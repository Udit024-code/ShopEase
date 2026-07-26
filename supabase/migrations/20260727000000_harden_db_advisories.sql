-- ============================================================================
-- Address Supabase security & performance advisor findings:
--   * Restrict EXECUTE on SECURITY DEFINER functions (place_order,
--     cancel_order to authenticated only; handle_new_user to no API role).
--   * Remove broad public listing on the avatars storage bucket.
--   * De-duplicate overlapping RLS policies on public.profiles and
--     storage.objects, keeping the versions that wrap auth.uid() in a
--     scalar subselect (evaluated once per statement, not once per row).
-- No behavioural change for legitimate clients — this only removes
-- redundant/overly-broad grants and policies.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. SECURITY DEFINER function execute grants
-- ---------------------------------------------------------------------------

-- Trigger function: never meant to be called via the REST API.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Order RPCs: only signed-in users, never anonymous.
revoke all on function public.place_order(uuid, text) from public, anon;
grant execute on function public.place_order(uuid, text) to authenticated;

revoke all on function public.cancel_order(uuid) from public, anon;
grant execute on function public.cancel_order(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. profiles: drop the unoptimised duplicate policies (bare auth.uid()),
--    keeping the "Users can ..." set that uses (select auth.uid()).
-- ---------------------------------------------------------------------------

drop policy if exists "Profiles are viewable by owner" on public.profiles;
drop policy if exists "Profiles are insertable by owner" on public.profiles;
drop policy if exists "Profiles are updatable by owner" on public.profiles;

-- ---------------------------------------------------------------------------
-- 3. avatars bucket: remove broad SELECT (listing) policies. The bucket is
--    public, so object URLs (getPublicUrl) keep working without any SELECT
--    policy; this just prevents clients from enumerating every file.
-- ---------------------------------------------------------------------------

drop policy if exists "Avatar bucket is publicly readable" on storage.objects;
drop policy if exists "Avatar images are publicly readable" on storage.objects;

-- De-duplicate the write policies (two functionally-identical copies each),
-- keeping the "Authenticated users can ..." set.
drop policy if exists "Users can delete their avatars" on storage.objects;
drop policy if exists "Users can update their avatars" on storage.objects;
