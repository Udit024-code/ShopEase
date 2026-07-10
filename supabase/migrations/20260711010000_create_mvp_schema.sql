-- ============================================================================
-- Minimal ShopEase schema for the MVP
-- Keeps auth, catalog, cart, wishlist, orders, and avatar storage while
-- deferring geographic address fields until a later migration.
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists public.profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	full_name text,
	phone text,
	avatar_url text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.categories (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	slug text unique,
	parent_id uuid references public.categories(id) on delete set null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.products (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	description text,
	price numeric(10,2) not null default 0,
	discount_price numeric(10,2),
	category_id uuid references public.categories(id) on delete set null,
	brand text,
	rating numeric(2,1) not null default 0,
	stock integer not null default 0,
	images text[] not null default '{}'::text[],
	is_active boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
	id uuid primary key default gen_random_uuid(),
	product_id uuid not null references public.products(id) on delete cascade,
	size text,
	color text,
	stock integer not null default 0,
	price_override numeric(10,2),
	is_active boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.addresses (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	label text,
	full_name text not null,
	phone text not null,
	is_default boolean not null default false,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.wishlist (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	product_id uuid not null references public.products(id) on delete cascade,
	created_at timestamptz not null default now(),
	unique(user_id, product_id)
);

create table if not exists public.cart_items (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	product_id uuid not null references public.products(id) on delete cascade,
	variant_id uuid references public.product_variants(id) on delete set null,
	quantity integer not null default 1,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.orders (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	address_id uuid references public.addresses(id) on delete set null,
	status text not null default 'pending',
	total_amount numeric(10,2) not null default 0,
	payment_method text not null default 'cod',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
	id uuid primary key default gen_random_uuid(),
	order_id uuid not null references public.orders(id) on delete cascade,
	product_id uuid not null references public.products(id) on delete restrict,
	variant_id uuid references public.product_variants(id) on delete set null,
	quantity integer not null default 1,
	price numeric(10,2) not null default 0,
	created_at timestamptz not null default now()
);

create table if not exists public.banners (
	id uuid primary key default gen_random_uuid(),
	title text,
	image_url text not null,
	link text,
	is_active boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
	insert into public.profiles (id, full_name)
	values (
		new.id,
		coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
	)
	on conflict (id) do nothing;

	return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_product_variants_updated_at on public.product_variants;
create trigger set_product_variants_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

drop trigger if exists set_addresses_updated_at on public.addresses;
create trigger set_addresses_updated_at
before update on public.addresses
for each row execute function public.set_updated_at();

drop trigger if exists set_cart_items_updated_at on public.cart_items;
create trigger set_cart_items_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists set_banners_updated_at on public.banners;
create trigger set_banners_updated_at
before update on public.banners
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.addresses enable row level security;
alter table public.wishlist enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.banners enable row level security;

create policy "Users can view their own profile"
	on public.profiles
	for select
	using ((select auth.uid()) = id);

create policy "Users can insert their own profile"
	on public.profiles
	for insert
	with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
	on public.profiles
	for update
	using ((select auth.uid()) = id)
	with check ((select auth.uid()) = id);

create policy "Users can delete their own profile"
	on public.profiles
	for delete
	using ((select auth.uid()) = id);

create policy "Categories are viewable by everyone"
	on public.categories
	for select
	using (true);

create policy "Products are viewable by everyone"
	on public.products
	for select
	using (true);

create policy "Product variants are viewable by everyone"
	on public.product_variants
	for select
	using (true);

create policy "Banners are viewable by everyone"
	on public.banners
	for select
	using (true);

create policy "Users can view their own addresses"
	on public.addresses
	for select
	using ((select auth.uid()) = user_id);

create policy "Users can insert their own addresses"
	on public.addresses
	for insert
	with check ((select auth.uid()) = user_id);

create policy "Users can update their own addresses"
	on public.addresses
	for update
	using ((select auth.uid()) = user_id)
	with check ((select auth.uid()) = user_id);

create policy "Users can delete their own addresses"
	on public.addresses
	for delete
	using ((select auth.uid()) = user_id);

create policy "Users can view their own wishlist"
	on public.wishlist
	for select
	using ((select auth.uid()) = user_id);

create policy "Users can insert their own wishlist items"
	on public.wishlist
	for insert
	with check ((select auth.uid()) = user_id);

create policy "Users can delete their own wishlist items"
	on public.wishlist
	for delete
	using ((select auth.uid()) = user_id);

create policy "Users can view their own cart items"
	on public.cart_items
	for select
	using ((select auth.uid()) = user_id);

create policy "Users can insert their own cart items"
	on public.cart_items
	for insert
	with check ((select auth.uid()) = user_id);

create policy "Users can update their own cart items"
	on public.cart_items
	for update
	using ((select auth.uid()) = user_id)
	with check ((select auth.uid()) = user_id);

create policy "Users can delete their own cart items"
	on public.cart_items
	for delete
	using ((select auth.uid()) = user_id);

create policy "Users can view their own orders"
	on public.orders
	for select
	using ((select auth.uid()) = user_id);

create policy "Users can insert their own orders"
	on public.orders
	for insert
	with check ((select auth.uid()) = user_id);

create policy "Users can update their own orders"
	on public.orders
	for update
	using ((select auth.uid()) = user_id)
	with check ((select auth.uid()) = user_id);

create policy "Users can delete their own orders"
	on public.orders
	for delete
	using ((select auth.uid()) = user_id);

create policy "Users can view order items for their orders"
	on public.order_items
	for select
	using (
		exists (
			select 1
			from public.orders o
			where o.id = order_items.order_id
				and o.user_id = (select auth.uid())
		)
	);

create policy "Users can insert order items for their orders"
	on public.order_items
	for insert
	with check (
		exists (
			select 1
			from public.orders o
			where o.id = order_items.order_id
				and o.user_id = (select auth.uid())
		)
	);

create policy "Users can update order items for their orders"
	on public.order_items
	for update
	using (
		exists (
			select 1
			from public.orders o
			where o.id = order_items.order_id
				and o.user_id = (select auth.uid())
		)
	)
	with check (
		exists (
			select 1
			from public.orders o
			where o.id = order_items.order_id
				and o.user_id = (select auth.uid())
		)
	);

create policy "Users can delete order items for their orders"
	on public.order_items
	for delete
	using (
		exists (
			select 1
			from public.orders o
			where o.id = order_items.order_id
				and o.user_id = (select auth.uid())
		)
	);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar bucket is publicly readable" on storage.objects;
create policy "Avatar bucket is publicly readable"
	on storage.objects
	for select
	using (bucket_id = 'avatars');

drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars"
	on storage.objects
	for insert
	to authenticated
	with check (
		bucket_id = 'avatars'
		and auth.uid()::text = (storage.foldername(name))[1]
	);

drop policy if exists "Authenticated users can update their own avatars" on storage.objects;
create policy "Authenticated users can update their own avatars"
	on storage.objects
	for update
	to authenticated
	using (
		bucket_id = 'avatars'
		and auth.uid()::text = (storage.foldername(name))[1]
	)
	with check (
		bucket_id = 'avatars'
		and auth.uid()::text = (storage.foldername(name))[1]
	);

drop policy if exists "Authenticated users can delete their own avatars" on storage.objects;
create policy "Authenticated users can delete their own avatars"
	on storage.objects
	for delete
	to authenticated
	using (
		bucket_id = 'avatars'
		and auth.uid()::text = (storage.foldername(name))[1]
	);

create index if not exists categories_parent_id_idx
	on public.categories (parent_id);

create index if not exists products_category_id_idx
	on public.products (category_id);

create index if not exists products_created_at_idx
	on public.products (created_at desc);

create index if not exists product_variants_product_id_idx
	on public.product_variants (product_id);

create index if not exists addresses_user_id_idx
	on public.addresses (user_id);

create index if not exists wishlist_user_id_idx
	on public.wishlist (user_id);

create index if not exists wishlist_product_id_idx
	on public.wishlist (product_id);

create index if not exists cart_items_user_id_idx
	on public.cart_items (user_id);

create index if not exists cart_items_product_id_idx
	on public.cart_items (product_id);

create index if not exists cart_items_variant_id_idx
	on public.cart_items (variant_id);

create index if not exists orders_user_id_idx
	on public.orders (user_id);

create index if not exists orders_address_id_idx
	on public.orders (address_id);

create index if not exists orders_created_at_idx
	on public.orders (created_at desc);

create index if not exists order_items_order_id_idx
	on public.order_items (order_id);

create index if not exists order_items_product_id_idx
	on public.order_items (product_id);

create index if not exists order_items_variant_id_idx
	on public.order_items (variant_id);

create index if not exists banners_created_at_idx
	on public.banners (created_at desc);