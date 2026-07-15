# ShopEase Security Checklist

A working reference for this app, not a generic OWASP list. Re-read the relevant section before
building each feature area. Update this file when a new pattern gets established or a past
mistake gets fixed — it should reflect what's actually true about this codebase.

## Secrets

- [ ] Nothing under `EXPO_PUBLIC_*` is ever a real secret — those values ship inside the client bundle. Only the Supabase **anon** key belongs there; security comes from RLS, not from hiding the anon key.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (or any service-role/admin key) never appears in app code, `.env.local`, or any file under `app/`, `context/`, `lib/`, `config/`. It only belongs server-side (Edge Functions, `Deno.env.get(...)`).
- [ ] Before committing, check `git status` for `.mcp.json`, `.vscode/mcp.json`, `.env*`, or anything under `supabase/.temp/` — none of these should be tracked. If one slips in with a real token, **rotate the token** — a `git rm --cached` alone does not undo a push; the value is already in remote history.
- [ ] If you ever suspect a secret was pushed, check `git branch -r --contains <commit>` to see whether it's actually on the remote before deciding how urgent the fix is.

## Row Level Security (every new table)

- [ ] RLS is enabled (`alter table ... enable row level security`) — a table with no RLS and no policies is either fully open or fully closed depending on `FORCE ROW LEVEL SECURITY`; don't rely on defaults, check.
- [ ] Every `insert`/`update` policy's `with check` restricts *values*, not just row ownership. Owning a row does not mean the client should be trusted to write anything into every column.
- [ ] **Never let the client set a price, total, discount, or status column directly on write.** If price/total needs to be in the row, compute it server-side (a `security definer` function or Edge Function that looks up the real product price) — do not accept it as client input on insert/update.
- [ ] State-machine columns (`orders.status`, payment status, etc.) should not be updatable by the row's owner via a blanket `update` policy. Either omit `status` from the owner's `with check`-permitted columns, or move status transitions into a `security definer` RPC that enforces valid transitions (`pending → paid`, never `pending → delivered` directly, etc.).
- [ ] Decide deliberately whether a row should ever be deletable by its owner once it reaches a terminal state (e.g. a fulfilled order) — don't let the default owner-delete policy apply to records that should be immutable history.
- [ ] After writing a policy, mentally run it as an attacker: "I own this row — what's the worst value I could write to each column?"

## Storage buckets

- [ ] Every bucket gets an explicit `file_size_limit` and `allowed_mime_types` at creation — `insert into storage.buckets (...)` with neither set means unlimited size and any content type.
- [ ] Path-ownership policies (`(storage.foldername(name))[1] = auth.uid()::text`) stop other users from writing to your files; they do **not** limit size or type. Both checks are needed together.
- [ ] Client-side, validate size/type before upload too (fail fast, save bandwidth) — but never treat client-side validation as the actual control. The bucket-level restriction is the real gate.
- [ ] If a bucket is `public: true`, treat its objects as things anyone on the internet can fetch by URL forever, including after a user deletes their account (orphaned objects don't auto-delete with the row that referenced them unless you write a cleanup path).

## Order / checkout flow (not built yet — read this before you build it)

- [ ] Price and total are always computed server-side from `products`/`product_variants` at write time, never trusted from the client request body.
- [ ] Stock decrement is atomic (a single `update ... set stock = stock - 1 where stock >= 1` guarded in a function/RPC, or a check constraint that rejects negative stock) — not a client-side "check then insert," which races under concurrent buyers.
- [ ] Status transitions go through one server-side function with an explicit allowed-transitions table, not ad hoc client updates.
- [ ] Consider whether `order_items` should even be client-writable after order creation, or whether the whole checkout should be a single `security definer` RPC call instead of raw table inserts.

## Auth

- [ ] Password policy lives in the sign-up zod schema (currently: 8–64 chars, upper/lower/digit/special) — if you loosen it, do it deliberately, not by accident while editing something else.
- [ ] `detectSessionInUrl: false` in `config/supabase.ts` is intentional — it stops the client from auto-parsing tokens out of an incoming URL, which closes off a class of deep-link/magic-link interception bugs. Don't flip this to `true` without adding real validation of the incoming URL first.
- [ ] Route-level gating (`app/(protected)/_layout.tsx` redirecting when there's no session) is a UX convenience, not a security boundary. The actual boundary is RLS. Never add a feature that trusts "the user got past the route guard" as proof of authorization for a specific row.
- [ ] Don't surface raw Supabase/Postgres error messages (`error.message`) to end users without a second look — they're usually safe, but check before shipping a new error path that it isn't leaking a constraint name, internal ID, or implementation detail.

## Native app config (Android/iOS)

- [ ] New Expo config plugins (image picker, camera, location, etc.) default to requesting more permissions than you need — check the generated `AndroidManifest.xml`/`Info.plist` after adding one, and explicitly disable what you don't use (e.g. `cameraPermission: false`, `microphonePermission: false` for a library-only image picker).
- [ ] Verify permission changes in the **merged** manifest (`android/app/build/intermediates/merged_manifest/.../AndroidManifest.xml`), not just the pre-merge one under `android/app/src/main/` — plugin-injected `tools:node="remove"` directives only take effect after Gradle's merge.
- [ ] `allowBackup="true"` is fine here because SecureStore's own data is explicitly excluded from Android backup (`secure_store_backup_rules.xml` / `secure_store_data_extraction_rules.xml`, shipped by `expo-secure-store`) — if you ever add another sensitive on-device store, make sure it's excluded the same way, or accept it'll be backed up.

## Dependencies

- [ ] Run `npm audit` periodically. As of this writing there are known issues in `ws`/`yaml`, but they're pulled in by Metro/react-devtools (dev-time tooling), not shipped in the app bundle — check *where* a flagged package is used before treating it as urgent.
- [ ] Metro's dev server is reachable by anyone on the same Wi-Fi/LAN while you're developing (it binds beyond localhost in some configurations). Don't treat anything sent through it as private, and don't leave it running on untrusted networks longer than you need to.

## Before every PR that touches data access

1. Did I add a table/column without RLS, or a policy without a `with check`?
2. Does any new `insert`/`update` let the client set a value (price, status, role, ownership) that should instead be computed or validated server-side?
3. Does any new storage bucket have both a size limit and a MIME allowlist?
4. Did I just commit a `.env*`, `.mcp.json`, or anything under `supabase/.temp/`?
