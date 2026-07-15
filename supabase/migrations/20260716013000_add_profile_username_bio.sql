-- ============================================================================
-- Extend public.profiles with the fields the settings screen needs to edit:
-- username (unique handle), display_name (shown in UI), and bio.
-- ============================================================================

alter table public.profiles
	add column if not exists username text,
	add column if not exists display_name text,
	add column if not exists bio text;

alter table public.profiles
	drop constraint if exists profiles_username_format;

alter table public.profiles
	add constraint profiles_username_format
	check (
		username is null
		or username ~ '^[a-z0-9_]{3,30}$'
	);

alter table public.profiles
	drop constraint if exists profiles_display_name_length;

alter table public.profiles
	add constraint profiles_display_name_length
	check (display_name is null or char_length(display_name) <= 60);

alter table public.profiles
	drop constraint if exists profiles_bio_length;

alter table public.profiles
	add constraint profiles_bio_length
	check (bio is null or char_length(bio) <= 280);

create unique index if not exists profiles_username_key
	on public.profiles (username)
	where username is not null;
