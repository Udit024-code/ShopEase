-- ============================================================================
-- Coupons / promo codes.
--
-- Adds a coupons table, a validate_coupon() helper the checkout screen calls
-- to preview a discount, and extends place_order() to apply a coupon
-- server-side (never trusting a client-supplied discount), recording the code
-- and discount on the order and incrementing the coupon's usage.
-- ============================================================================

create table public.coupons (
	id uuid primary key default gen_random_uuid(),
	code text not null unique,
	-- 'percent' => value is a percentage (e.g. 10 = 10% off);
	-- 'fixed'   => value is a flat currency amount off the subtotal.
	discount_type text not null check (discount_type in ('percent', 'fixed')),
	value numeric(10, 2) not null check (value > 0),
	min_order_amount numeric(10, 2) not null default 0,
	max_uses integer, -- null = unlimited
	used_count integer not null default 0,
	active boolean not null default true,
	valid_from timestamptz,
	valid_until timestamptz,
	created_at timestamptz not null default now()
);

alter table public.coupons enable row level security;

-- Coupons are never read directly by clients; all access is via the
-- security-definer functions below, so no permissive policies are added.
-- (RLS enabled with no policy = deny all direct access.)

-- ---------------------------------------------------------------------------
-- validate_coupon: check a code against a subtotal and return the discount.
-- Used by checkout to preview the discount before placing the order. Raises
-- a descriptive error if the code is invalid / expired / below minimum.
-- ---------------------------------------------------------------------------

create or replace function public.validate_coupon(
	p_code text,
	p_subtotal numeric
)
returns table (
	code text,
	discount_type text,
	value numeric,
	discount_amount numeric
)
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
	v_coupon public.coupons;
	v_norm text := upper(trim(p_code));
	v_discount numeric(10, 2);
begin
	select * into v_coupon
	from public.coupons c
	where c.code = v_norm
		and c.active = true
		and (c.valid_from is null or now() >= c.valid_from)
		and (c.valid_until is null or now() <= c.valid_until)
		and (c.max_uses is null or c.used_count < c.max_uses);

	if not found then
		raise exception 'Invalid or expired coupon';
	end if;

	if p_subtotal < v_coupon.min_order_amount then
		raise exception 'Order must be at least % to use this coupon',
			v_coupon.min_order_amount;
	end if;

	if v_coupon.discount_type = 'percent' then
		v_discount := round(p_subtotal * v_coupon.value / 100, 2);
	else
		v_discount := v_coupon.value;
	end if;

	-- Never discount more than the subtotal.
	if v_discount > p_subtotal then
		v_discount := p_subtotal;
	end if;

	return query
	select v_coupon.code, v_coupon.discount_type, v_coupon.value, v_discount;
end;
$$;

grant execute on function public.validate_coupon(text, numeric) to authenticated;
revoke all on function public.validate_coupon(text, numeric) from public, anon;

-- ---------------------------------------------------------------------------
-- orders: record the applied coupon and discount.
-- ---------------------------------------------------------------------------

alter table public.orders
	add column coupon_code text,
	add column discount_amount numeric(10, 2) not null default 0;

-- ---------------------------------------------------------------------------
-- place_order: recreated to accept an optional coupon code and apply the
-- discount server-side. The 2-arg version is dropped in favour of this one
-- (coupon code defaults to null, so existing callers keep working).
-- ---------------------------------------------------------------------------

drop function if exists public.place_order(uuid, text);

create or replace function public.place_order(
	p_address_id uuid,
	p_payment_method text default 'cod',
	p_coupon_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
	v_user_id uuid := auth.uid();
	v_order_id uuid;
	v_subtotal numeric(10, 2) := 0;
	v_discount numeric(10, 2) := 0;
	v_total numeric(10, 2) := 0;
	v_unit_price numeric(10, 2);
	v_item record;
	v_coupon public.coupons;
	v_norm text := upper(trim(coalesce(p_coupon_code, '')));
begin
	if v_user_id is null then
		raise exception 'Not authenticated';
	end if;

	if p_address_id is not null
		and not exists (
			select 1 from public.addresses
			where id = p_address_id and user_id = v_user_id
		)
	then
		raise exception 'Invalid address';
	end if;

	if not exists (
		select 1 from public.cart_items where user_id = v_user_id
	) then
		raise exception 'Cart is empty';
	end if;

	insert into public.orders (user_id, address_id, status, total_amount, payment_method)
	values (v_user_id, p_address_id, 'pending', 0, coalesce(p_payment_method, 'cod'))
	returning id into v_order_id;

	for v_item in
		select
			ci.product_id,
			ci.variant_id,
			ci.quantity,
			p.name as product_name,
			p.price,
			p.discount_price,
			pv.price_override
		from public.cart_items ci
		join public.products p on p.id = ci.product_id
		left join public.product_variants pv on pv.id = ci.variant_id
		where ci.user_id = v_user_id
	loop
		v_unit_price := coalesce(
			v_item.price_override,
			v_item.discount_price,
			v_item.price
		);

		if v_item.variant_id is not null then
			update public.product_variants
				set stock = stock - v_item.quantity
				where id = v_item.variant_id and stock >= v_item.quantity;
		else
			update public.products
				set stock = stock - v_item.quantity
				where id = v_item.product_id and stock >= v_item.quantity;
		end if;

		if not found then
			raise exception 'Insufficient stock for %', v_item.product_name;
		end if;

		insert into public.order_items (order_id, product_id, variant_id, quantity, price)
		values (v_order_id, v_item.product_id, v_item.variant_id, v_item.quantity, v_unit_price);

		v_subtotal := v_subtotal + v_unit_price * v_item.quantity;
	end loop;

	-- Apply a coupon if one was provided, validating it server-side against
	-- the server-computed subtotal (the client's amount is never trusted).
	if v_norm <> '' then
		select * into v_coupon
		from public.coupons c
		where c.code = v_norm
			and c.active = true
			and (c.valid_from is null or now() >= c.valid_from)
			and (c.valid_until is null or now() <= c.valid_until)
			and (c.max_uses is null or c.used_count < c.max_uses);

		if not found then
			raise exception 'Invalid or expired coupon';
		end if;

		if v_subtotal < v_coupon.min_order_amount then
			raise exception 'Order must be at least % to use this coupon',
				v_coupon.min_order_amount;
		end if;

		if v_coupon.discount_type = 'percent' then
			v_discount := round(v_subtotal * v_coupon.value / 100, 2);
		else
			v_discount := v_coupon.value;
		end if;

		if v_discount > v_subtotal then
			v_discount := v_subtotal;
		end if;

		update public.coupons
			set used_count = used_count + 1
			where id = v_coupon.id;
	end if;

	v_total := v_subtotal - v_discount;

	update public.orders
		set total_amount = v_total,
			discount_amount = v_discount,
			coupon_code = case when v_discount > 0 then v_coupon.code else null end
		where id = v_order_id;

	delete from public.cart_items where user_id = v_user_id;

	return v_order_id;
end;
$$;

grant execute on function public.place_order(uuid, text, text) to authenticated;
revoke all on function public.place_order(uuid, text, text) from public, anon;

-- ---------------------------------------------------------------------------
-- Seed a couple of demo coupons.
-- ---------------------------------------------------------------------------

insert into public.coupons (code, discount_type, value, min_order_amount)
values
	('SAVE10', 'percent', 10, 0),
	('FLAT5', 'fixed', 5, 30)
on conflict (code) do nothing;
