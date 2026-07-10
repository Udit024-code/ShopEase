-- ============================================================================
-- Create the profiles table, profile update trigger, and avatars storage bucket.
-- This migration adds the minimal user profile extension needed for auth users
-- and keeps avatar uploads reproducible through SQL.
-- ============================================================================

create table if not exists public.profiles (
	id uuid primary key references auth.users (id) on delete cascade,
	name text,
	phone text,
	avatar_url text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	insert into public.profiles (id, name, phone, avatar_url)
	values (
		new.id,
		coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'),
		new.raw_user_meta_data ->> 'phone',
		new.raw_user_meta_data ->> 'avatar_url'
	)
	on conflict (id) do nothing;

	return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars"
on storage.objects
for insert
to authenticated
with check (
	bucket_id = 'avatars'
	and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Users can update their avatars" on storage.objects;
create policy "Users can update their avatars"
on storage.objects
for update
to authenticated
using (
	bucket_id = 'avatars'
	and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Users can delete their avatars" on storage.objects;
create policy "Users can delete their avatars"
on storage.objects
for delete
to authenticated
using (
	bucket_id = 'avatars'
	and split_part(name, '/', 1) = auth.uid()::text
);