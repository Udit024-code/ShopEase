# ShopEase

Expo (SDK 53) + React Native app using expo-router, NativeWind, and Supabase as the backend.

## Rules

These are the same rules used by Copilot (`.github/instructions/`) and Cursor (`.cursor/rules/`),
imported here so all three tools stay in sync. Edit the files below — not copies.

@.github/instructions/coding-standards.instructions.md
@.github/instructions/create-db-functions.instructions.md
@.github/instructions/create-edge-functions.instructions.md
@.github/instructions/create-migration.instructions.md
@.github/instructions/create-rls-policies.instructions.md
@.github/instructions/postgres-sql-style-guide.instructions.md

## Running the app

Android emulator (`Pixel_Test`):

```
npx expo run:android --device Pixel_Test
```

- Run via **PowerShell**, not Git Bash — `npx` through Git Bash fails with `'"node"' is not recognized`.
- `--device` takes the **AVD name** (`Pixel_Test`), not the adb serial (`emulator-5554`).
- The dev-launcher defaults to the host LAN IP, which this emulator cannot reach (times out).
  Use `10.0.2.2:8081` instead — that address maps to the host loopback from inside the emulator.
- The first cold bundle takes ~50s and can exceed the dev-launcher's timeout. If it times out,
  wait for Metro to finish bundling, then reload.

## Gotcha: duplicate Expo module registration

If the app crashes on launch with:

```
IllegalStateException: DevelopmentClientController was initialized.
```

it means stray `android/bin/` directories inside `node_modules` packages are mirroring each
package's real `android/` folder, so autolinking discovers `*Package` classes twice and registers
them twice. Opening the project in Android Studio (and `npm install`) can recreate them. Fix:

```
find node_modules -type d -path "*/android/bin" -not -path "*/android/bin/*" -exec rm -rf {} +
rm -rf node_modules/expo/android/build/generated
```

The second line matters: the generated package list is cached there, and Gradle will keep reusing
the stale duplicated copy (reporting `UP-TO-DATE`) even after `gradlew clean`.

## Secrets

- `.env.local` holds `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (gitignored).
- The Supabase MCP server reads `SUPABASE_ACCESS_TOKEN` from the environment (see `.mcp.json`).
  Never hardcode that token in a committed file — it is an account-wide personal access token.
