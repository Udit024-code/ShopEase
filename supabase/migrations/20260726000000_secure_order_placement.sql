-- ============================================================================
-- Secure order placement.
--
-- The initial schema let a client insert order_items with any price and set
-- orders.status directly. This migration closes that: it drops the direct
-- client write policies on orders/order_items (keeping read), and moves order
-- creation and cancellation into security-definer RPCs that compute prices
-- server-side from the catalog and decrement stock atomically.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Lock down direct client writes. Reads (own orders) stay allowed; all
-- mutations now go through the RPCs below.
-- ---------------------------------------------------------------------------

drop policy if exists "Users can insert their own orders" on public.orders;
drop policy if exists "Users can update their own orders" on public.orders;
drop policy if exists "Users can delete their own orders" on public.orders;

drop policy if exists "Users can insert order items for their orders" on public.order_items;
drop policy if exists "Users can update order items for their orders" on public.order_items;
drop policy if exists "Users can delete order items for their orders" on public.order_items;

-- ---------------------------------------------------------------------------
-- place_order: create an order from the caller's cart.
--
-- Prices are read from the catalog (never trusted from the client); stock is
-- decremented atomically and the operation fails if any line is short; the
-- cart is cleared on success. Runs as definer to write orders/order_items the
-- client can no longer write directly, but every read/write is scoped to
-- auth.uid().
-- ---------------------------------------------------------------------------

create or replace function public.place_order(
	p_address_id uuid,
	p_payment_method text default 'cod'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
	v_user_id uuid := auth.uid();
	v_order_id uuid;
	v_total numeric(10,2) := 0;
	v_unit_price numeric(10,2);
	v_item record;
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

		v_total := v_total + v_unit_price * v_item.quantity;
	end loop;

	update public.orders set total_amount = v_total where id = v_order_id;

	delete from public.cart_items where user_id = v_user_id;

	return v_order_id;
end;
$$;

grant execute on function public.place_order(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- cancel_order: cancel a still-pending order and restock its items.
-- ---------------------------------------------------------------------------

create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
	v_user_id uuid := auth.uid();
	v_status text;
	v_item record;
begin
	if v_user_id is null then
		raise exception 'Not authenticated';
	end if;

	select status into v_status
	from public.orders
	where id = p_order_id and user_id = v_user_id;

	if v_status is null then
		raise exception 'Order not found';
	end if;

	if v_status <> 'pending' then
		raise exception 'Only pending orders can be cancelled';
	end if;

	for v_item in
		select product_id, variant_id, quantity
		from public.order_items
		where order_id = p_order_id
	loop
		if v_item.variant_id is not null then
			update public.product_variants
				set stock = stock + v_item.quantity
				where id = v_item.variant_id;
		else
			update public.products
				set stock = stock + v_item.quantity
				where id = v_item.product_id;
		end if;
	end loop;

	update public.orders set status = 'cancelled' where id = p_order_id;
end;
$$;

grant execute on function public.cancel_order(uuid) to authenticated;
