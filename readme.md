# ShopEase

A cross-platform **e-commerce mobile app** (Amazon/Flipkart style) built with **React Native (Expo)** and **Supabase**. Users can browse a product catalog, search and filter, manage a cart and wishlist, save addresses, apply coupons, and place orders — with a security model where **prices and discounts are computed server-side** and **Row-Level Security** guards every table.

> Built as a Practice School project. Backend on Supabase (Postgres + Auth + Storage + Edge Functions); frontend in TypeScript with Expo Router and NativeWind.

---

## ✨ Features

- **Onboarding & Auth** — first-run carousel, email/password sign-up & sign-in, in-app password reset, encrypted session persistence.
- **Home** — banner carousel, category chips, and product rails (Top Deals, New Arrivals, Trending) with pull-to-refresh and skeletons.
- **Catalog** — product listing by category (with subcategories), product detail with image gallery, variants (size/color), and quantity selector.
- **Search & Filters** — debounced search with recent searches, plus a Sort & Filter sheet (price, rating, on-sale, in-stock, category).
- **Cart & Wishlist** — per-user, synced to the backend, with quantity steppers and move-to-cart.
- **Addresses** — add/edit/delete delivery addresses and set a default.
- **Checkout & Orders** — address selection, Cash-on-Delivery, promo codes, order confirmation, order history, order-status timeline, cancel, and reorder.
- **Reviews & Ratings** — one review per user per product; product rating stays in sync via a DB trigger.
- **Coupons** — server-validated promo codes (percentage or fixed discount).
- **Account** — profile edit, avatar upload to Supabase Storage, theme preference, and full account deletion.

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.79 · Expo SDK 53 |
| Language | TypeScript (strict) |
| Routing | Expo Router (file-based, typed routes, deep links) |
| Styling | NativeWind (Tailwind CSS for React Native) |
| Server state | TanStack Query (React Query) |
| Forms | React Hook Form + Zod |
| Backend | Supabase — Postgres, Auth, Storage, Edge Functions |
| Auth storage | expo-secure-store + AES (encrypted at rest) |

## 🔐 Security highlights

- **Row-Level Security on every table** — users can only read/write their own cart, orders, addresses, wishlist, and reviews; catalog data is public-read.
- **Server-authoritative pricing** — order placement runs in a `security definer` Postgres function (`place_order`) that computes each price from the catalog and applies coupons server-side, so a tampered client can never set its own prices. Stock is decremented atomically.
- **Encrypted auth tokens** — the Supabase session is AES-encrypted on-device, with the key in the OS keystore (`LargeSecureStore`).
- **Account deletion via Edge Function** — a Deno function running with the service role identifies the caller from their JWT and removes their data.

## 🏗️ Architecture

```
React Native app (Expo)
      │  supabase-js (HTTPS + JWT)
      ▼
Supabase
  ├─ Auth (GoTrue)          → issues JWT, manages users
  ├─ Postgres + RLS         → tables + per-row authorization
  ├─ security-definer RPCs  → place_order, cancel_order, validate_coupon
  ├─ Storage                → avatar images
  └─ Edge Function (Deno)   → delete-account
```

Server state lives in Postgres and is cached with TanStack Query; UI state uses React `useState` with small persisted prefs in `AsyncStorage`.

## 📁 Project structure

```
app/            Expo Router screens (file-based routing)
  (protected)/  routes that require a session (tabs, product, cart, checkout, orders…)
components/     reusable UI (ui/ design kit, home/, product/)
hooks/          TanStack Query hooks (one per domain)
context/        auth session provider
config/         Supabase client + encrypted auth storage
lib/ constants/ helpers and theme tokens
supabase/
  migrations/   SQL schema history (source of truth for the DB)
  functions/    Edge Functions (delete-account)
database.types.ts  types generated from the DB schema
```

## 🚀 Getting started

### Prerequisites
- Node.js 18+
- A Supabase project
- Android Studio (emulator) or a physical device with Expo Dev Client

### 1. Install
```bash
npm install
```

### 2. Environment
Create `.env.local` (gitignored):
```
EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. Database
Apply the SQL migrations in `supabase/migrations/` to your Supabase project (via the Supabase CLI `supabase db push`, or by running them in the dashboard SQL editor in filename order).

### 4. Run
```bash
npx expo run:android      # build & run the dev client on Android
# or
npx expo start            # start Metro (with an existing dev client installed)
```

## 📦 Build

- **Preview APK (installable):** `eas build --profile preview --platform android`, or a local Gradle release build (`cd android && ./gradlew assembleRelease`).
- **Play Store:** `eas build --profile production --platform android` (produces an AAB).

## 🗺️ Roadmap

- [ ] Online payments (Razorpay/Stripe) with a signature-verified webhook
- [ ] Push notifications for order updates (Expo Notifications)
- [ ] Order-confirmation emails
- [ ] Admin surface to advance order fulfillment status
- [ ] Separate staging and production Supabase projects
- [ ] Crash reporting (Sentry)

## 📄 License

MIT.
