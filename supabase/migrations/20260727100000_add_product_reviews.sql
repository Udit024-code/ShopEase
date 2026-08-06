-- ============================================================================
-- Product reviews
--
-- Adds a reviews table (one review per user per product) and keeps each
-- product's aggregate rating/rating_count in sync via a trigger. Reviews are
-- publicly readable; each user may only write/edit/delete their own.
-- ============================================================================

-- Aggregate columns on products (products.rating already exists; seeded values
-- are kept until a product receives its first real review).
alter table public.products
  add column if not exists rating_count integer not null default 0;

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  -- references profiles (not auth.users) so PostgREST can embed the author's
  -- profile; profiles cascades from auth.users, so deleting a user still
  -- removes their reviews.
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  -- one review per user per product; upsert on this key to edit
  unique (product_id, user_id)
);

create index reviews_product_id_created_at_idx
  on public.reviews (product_id, created_at desc);

alter table public.reviews enable row level security;

create policy "Reviews are viewable by everyone"
  on public.reviews for select
  using (true);

create policy "Users can insert their own reviews"
  on public.reviews for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own reviews"
  on public.reviews for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own reviews"
  on public.reviews for delete
  using ((select auth.uid()) = user_id);

-- Recompute the parent product's aggregate rating whenever its reviews change.
-- When a product has no reviews, the existing (seeded) rating is preserved and
-- only rating_count is reset to zero.
create or replace function public.sync_product_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product_id uuid := coalesce(new.product_id, old.product_id);
  v_avg numeric;
  v_count integer;
begin
  select avg(rating), count(*)
  into v_avg, v_count
  from public.reviews
  where product_id = v_product_id;

  update public.products
  set rating = coalesce(round(v_avg, 1), rating),
      rating_count = v_count
  where id = v_product_id;

  return null;
end;
$$;

create trigger sync_product_rating_trigger
after insert or update or delete on public.reviews
for each row
execute function public.sync_product_rating();
