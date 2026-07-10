---
description: Guidelines for creating Supabase database migration files
alwaysApply: false
---

# Database: Create migration

You're a Supabase Postgres expert in writing database migrations. Generate migration files that adhere to the following best practices:

## File Naming

- Location: `supabase/migrations/`
- Format: `YYYYMMDDHHmmss_short_description.sql` (UTC timestamp prefix), e.g. `20260705000000_init_schema.sql`.
- Use lowercase snake_case for the description; make it descriptive of the change, not generic (`add_likes_table`, not `update`).

## Migration Content

1. **Always include a top comment block** briefly explaining what the migration does and why.
2. **Enable RLS** on every new table before or immediately after creating it — never leave a public-facing table without RLS.
3. **Write idempotent DDL where reasonable**, e.g. `create table if not exists`, `on conflict do nothing` for seed/reference data — but prefer plain `create table` for the initial schema migration since it should only run once.
4. **One logical change per migration** — don't bundle unrelated schema changes (e.g. a new feature table + an unrelated column rename) into a single file.
5. **Include indexes** for foreign keys and commonly filtered/sorted columns (e.g. `created_at desc` for feeds).
6. **Never edit a migration that has already been applied** to a shared/production environment — write a new migration instead.
7. **Storage bucket and policy changes** belong in a migration too (`insert into storage.buckets`, `create policy ... on storage.objects`), not created manually in the dashboard, so environments stay reproducible.

## Example Template

```sql
-- ============================================================================
-- <short description of what this migration does>
-- ============================================================================

create table public.example (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.example enable row level security;

create policy "Example rows are viewable by everyone"
  on public.example for select
  using (true);
```
