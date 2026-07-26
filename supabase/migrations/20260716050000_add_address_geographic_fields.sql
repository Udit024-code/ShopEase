-- ============================================================================
-- Add the geographic fields to public.addresses that were deferred in the
-- initial schema, so the app can store real delivery addresses (needed for
-- the address book and checkout). Also add a trigger that keeps at most one
-- default address per user.
--
-- Safe as NOT NULL because no address rows exist yet (the feature was never
-- built).
-- ============================================================================

alter table public.addresses
	add column if not exists line1 text not null,
	add column if not exists line2 text,
	add column if not exists city text not null,
	add column if not exists state text,
	add column if not exists postal_code text not null,
	add column if not exists country text not null default 'India';

-- When an address is marked default, clear the default flag on the user's
-- other addresses so exactly one stays default. Runs only when the row is
-- being set to default, and the inner update sets others to false (which does
-- not re-fire this trigger thanks to the WHEN clause), so there is no
-- recursion.
create or replace function public.enforce_single_default_address()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
	update public.addresses
		set is_default = false
		where user_id = new.user_id
			and id <> new.id
			and is_default = true;
	return new;
end;
$$;

drop trigger if exists enforce_single_default_address on public.addresses;

create trigger enforce_single_default_address
	before insert or update of is_default on public.addresses
	for each row
	when (new.is_default is true)
	execute function public.enforce_single_default_address();
