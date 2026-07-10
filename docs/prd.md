# Product Requirements Document (PRD)
## E-Commerce Mobile Application (Amazon/Flipkart Style)

| | |
|---|---|
| **Product Name** | ShopEase (placeholder — rename as desired) |
| **Platform** | React Native (Expo) |
| **Backend** | Supabase (Auth, Database, Storage, Realtime) |
| **Document Version** | 1.0 |
| **Owner** | Product/Engineering |

---

## 1. Purpose & Vision

Build a full-featured, production-quality e-commerce mobile application similar to Amazon/Flipkart, enabling users to browse products, manage a cart/wishlist, place orders, and manage their profile — with a scalable Supabase backend and a clean, reusable React Native codebase that a solo developer or small team can build incrementally.

## 2. Goals & Success Metrics

| Goal | Metric |
|---|---|
| Smooth onboarding & auth | < 3 taps to sign up/login |
| Fast product discovery | Search/filter results render < 1s (cached) |
| Reliable checkout | Order completion success rate > 95% |
| Stable app | Crash-free session rate > 99% |
| Maintainable code | Modular folder structure, reusable component library |

## 3. Target Users

- General consumers shopping for physical goods on mobile.
- Guest browsers who convert to registered users at checkout.
- Returning users managing orders, addresses, and wishlists.

## 4. Tech Stack

| Layer | Technology |
|---|---|
| Base Template | **`expo-supabase-starter`** (Expo SDK 53, Expo Router, TypeScript) |
| App Framework | React Native + Expo (managed workflow) |
| Navigation | **Expo Router** (file-based routing, already scaffolded in starter: `(protected)`, `(tabs)`) |
| State Management | **Zustand** (client state: cart, filters, wishlist) + **React Query/TanStack Query** (server state, caching) — both to be added |
| Backend | Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) — client already configured in starter (`config/supabase.ts`) |
| Forms | **React Hook Form + Zod** (already in starter, via `components/ui/form.tsx`) |
| Styling | **NativeWind + Tailwind** (already configured in starter) + `components/ui/*` base kit (`rn-primitives`) |
| Push Notifications | Expo Notifications + Supabase Edge Function / FCM — to be added |
| Image Handling | expo-image-picker, expo-camera, Supabase Storage — to be added (starter has `expo-image` for display only) |
| Payments (optional) | Razorpay/Stripe test mode (out of scope unless specified) |
| Local Persistence | `expo-secure-store` (auth tokens, already in starter) + AsyncStorage (onboarding flag, recent searches) |

---

## 5. Feature List & Detailed Requirements

### 5.1 Splash & Onboarding
- Animated splash screen (Expo Splash Screen API) shown while app checks session/auth state.
- 3–4 swipeable onboarding slides (illustration + heading + subtext) shown only on first install.
- "Skip" and "Get Started" CTAs.
- Store `hasSeenOnboarding` flag in AsyncStorage.

### 5.2 Authentication
- **Signup**: Name, email, phone (optional), password, confirm password → Supabase Auth `signUp`.
- **Login**: Email/password login; optional "Login with OTP" via Supabase phone auth.
- **Forgot Password**: Email-based reset link via Supabase `resetPasswordForEmail`.
- **Session Persistence**: Supabase session stored via `expo-secure-store`, auto-refresh token.
- **Social Login (optional/future)**: Google/Apple via Supabase OAuth.
- Validation: email format, password strength, matching confirm-password.
- Error states: invalid credentials, email already exists, network failure.

### 5.3 Home Screen
- Header: location selector (optional), search bar entry point, cart/notification icons.
- Hero banner carousel (auto-scroll, dots indicator) — sourced from a `banners` table.
- Horizontal category chips/icons.
- Multiple product rails: "Top Deals", "Recommended", "New Arrivals", "Trending" (each a horizontal FlatList).
- Pull-to-refresh.
- Skeleton loaders while data loads.

### 5.4 Product Categories
- Grid/list of categories (icon + name), from `categories` table.
- Tapping a category → Product Listing screen filtered by `category_id`.
- Support nested subcategories (optional `parent_id` in categories table).

### 5.5 Product Listing
- Grid/List toggle view.
- Infinite scroll / pagination (Supabase `range()` queries).
- Quick-add-to-cart and wishlist-heart icon on each card.
- Price, discount badge, rating stars, product image.
- Empty state and loading skeletons.

### 5.6 Product Details
- Image carousel/gallery (pinch-to-zoom optional).
- Title, price, discount, rating & review count.
- Variant selectors (size/color) if applicable — `product_variants` table.
- Quantity stepper.
- "Add to Cart" and "Buy Now" buttons.
- Expandable sections: Description, Specifications, Reviews & Ratings.
- Related/"Frequently bought together" product rail.
- Wishlist toggle icon.
- Share product (Expo Sharing API).

### 5.7 Search
- Debounced search input with recent searches (stored locally) and trending/suggested searches.
- Full-text search using Postgres `ILIKE` or `tsvector` on `products` table.
- Search results screen reusing the Product Listing component.
- Voice search (optional, future enhancement).

### 5.8 Filters & Sorting
- Bottom sheet/modal with filters: Price range (slider), Category, Brand, Rating, Discount %, Availability.
- Sorting options: Price (low–high, high–low), Popularity, Newest, Rating.
- Applied filters shown as removable chips above results.
- "Clear All" and "Apply" actions.

### 5.9 Wishlist
- List of saved products (`wishlist` table: user_id, product_id).
- Move-to-cart action from wishlist.
- Remove from wishlist (swipe or icon).
- Empty state with CTA to browse products.

### 5.10 Shopping Cart
- List of cart items with image, name, variant, quantity stepper, subtotal.
- Remove item (swipe-to-delete).
- Price summary: subtotal, discount, delivery fee, tax, total.
- Coupon/promo code input (optional `coupons` table validation).
- "Proceed to Checkout" CTA.
- Empty cart state.
- Cart persisted per user in Supabase `cart_items` table (synced across devices) with local optimistic updates.

### 5.11 Checkout
- Step flow: Address selection → Delivery slot (optional) → Payment method → Order review → Place order.
- Order summary recap.
- Payment method selection (COD, Card/UPI via gateway — integration stubbed if not required immediately).
- Order confirmation screen with order ID and estimated delivery.
- Writes to `orders` and `order_items` tables atomically (Supabase RPC/Edge Function recommended for transaction safety).

### 5.12 Address Management
- List of saved addresses (`addresses` table: label, name, phone, line1, line2, city, state, pincode, is_default).
- Add/Edit/Delete address forms with validation.
- Set default address.
- Auto-detect location (expo-location) to prefill address (optional).

### 5.13 Order History
- List of past orders (status badges: Placed, Shipped, Out for Delivery, Delivered, Cancelled).
- Order details screen: items, address used, price breakdown, tracking timeline.
- Reorder and Cancel Order actions (cancel only if order status allows).
- Pull-to-refresh and pagination.

### 5.14 User Profile
- Display name, email, phone, profile picture.
- Menu: Edit Profile, Addresses, Order History, Wishlist, Settings, Logout.
- Avatar upload via camera/gallery → Supabase Storage bucket `avatars`.

### 5.15 Edit Profile
- Editable fields: name, phone, profile picture, gender/DOB (optional).
- Form validation and optimistic update to Supabase `profiles` table.

### 5.16 Settings
- Theme toggle (Dark/Light/System).
- Notification preferences (toggle push categories).
- Language selection (optional, future i18n).
- App version, Terms & Privacy links, Logout, Delete Account.

### 5.17 Dark/Light Theme
- Theme context/provider with tokens (colors, spacing, typography) consumed by all components.
- Persist user preference in AsyncStorage; default to system theme.
- All reusable components must be theme-aware (no hardcoded colors).

### 5.18 Push Notifications
- Expo Push Notifications setup (`expo-notifications`), device token stored in `device_tokens` table.
- Triggers: order status updates, promotional offers, back-in-stock alerts.
- Sending mechanism: Supabase Edge Function calling Expo Push API, invoked via DB trigger on `orders` status change.
- In-app notification center (optional) listing past notifications.

### 5.19 Image Upload (Camera/Gallery)
- Used for: profile avatar, product reviews (optional user-uploaded photos).
- `expo-image-picker` for gallery, `expo-camera` for camera capture.
- Permissions handling (iOS/Android) with graceful denial states.
- Upload to Supabase Storage with progress indicator; store public/signed URL in relevant table.

### 5.20 Responsive UI
- Support phones of varying sizes (small to large) and tablets via flexible layouts (`Dimensions`/`useWindowDimensions`, percentage-based widths, `SafeAreaView`).
- Adaptive grid columns based on screen width.
- Support both portrait orientations at minimum; landscape optional.

### 5.21 Reusable Components
Minimum shared component library:
- Button (primary/secondary/outline/loading states)
- Input/TextField (with label, error, icon slots)
- ProductCard (grid & list variants)
- Rating stars
- Badge/Chip
- Modal / Bottom Sheet
- Skeleton Loader
- EmptyState
- Header (with back, title, actions)
- PriceTag (with discount strike-through)
- Avatar
- Toast/Snackbar for feedback messages

### 5.22 API Integration
- All data operations via Supabase JS client (`@supabase/supabase-js`).
- Centralized `services/` layer (e.g., `authService`, `productService`, `cartService`, `orderService`) so UI never calls Supabase directly.
- React Query for caching, retries, and background refetching of server state.
- Row Level Security (RLS) policies on all tables to ensure users only access their own data (cart, orders, addresses, wishlist) while products/categories remain publicly readable.

### 5.23 Folder Structure (Based on `expo-supabase-starter`)

This project builds on top of the `expo-supabase-starter` template, which already uses **Expo Router** (file-based routing), **NativeWind**, and a Supabase auth context. The structure below extends that starter rather than replacing it — existing files (`app/_layout.tsx`, `context/supabase-provider.tsx`, `config/supabase.ts`, `components/ui/*`) are kept and built upon.

```
ecommerce-app/
├── app.json
├── .env / .env.example
├── app/                              # Expo Router — file-based routes (from starter)
│   ├── _layout.tsx                   # Root layout: wraps app in AuthProvider, ThemeProvider, QueryClientProvider
│   ├── welcome.tsx                   # Splash/landing (extend into Onboarding carousel)
│   ├── onboarding.tsx                # NEW: swipeable onboarding slides
│   ├── sign-in.tsx                   # (from starter) — Login
│   ├── sign-up.tsx                   # (from starter) — Signup
│   ├── forgot-password.tsx           # NEW: Forgot Password flow
│   ├── +not-found.tsx
│   └── (protected)/                  # Routes gated by auth session (from starter)
│       ├── _layout.tsx               # Redirects to sign-in if no session
│       ├── modal.tsx
│       ├── (tabs)/                   # Bottom tab navigator (from starter, extended)
│       │   ├── _layout.tsx           # Tab bar: Home, Categories, Cart, Wishlist, Profile
│       │   ├── index.tsx             # Home screen (rails, banners, categories)
│       │   ├── categories.tsx        # NEW
│       │   ├── cart.tsx              # NEW
│       │   ├── wishlist.tsx          # NEW
│       │   ├── profile.tsx           # NEW (was settings.tsx in starter)
│       │   └── settings.tsx          # (from starter) — theme, notifications, account
│       ├── product/
│       │   └── [id].tsx              # NEW: Product Details (dynamic route)
│       ├── category/
│       │   └── [id].tsx              # NEW: Product Listing by category
│       ├── search.tsx                # NEW: Search + Filters entry
│       ├── checkout/
│       │   ├── index.tsx             # NEW: Checkout flow
│       │   └── confirmation.tsx      # NEW: Order confirmation
│       ├── address/
│       │   ├── index.tsx             # NEW: Address list
│       │   └── edit.tsx              # NEW: Add/Edit address
│       ├── orders/
│       │   ├── index.tsx             # NEW: Order history
│       │   └── [id].tsx              # NEW: Order details/tracking
│       └── edit-profile.tsx          # NEW
│
├── components/
│   ├── ui/                           # (from starter) rn-primitives-based base kit:
│   │   ├── button.tsx  input.tsx  text.tsx  form.tsx  label.tsx
│   │   ├── switch.tsx  radio-group.tsx  textarea.tsx  typography.tsx
│   ├── image.tsx  safe-area-view.tsx # (from starter)
│   ├── product/                      # NEW: commerce-specific components
│   │   ├── ProductCard.tsx
│   │   ├── PriceTag.tsx
│   │   ├── RatingStars.tsx
│   │   ├── VariantSelector.tsx
│   │   └── ProductRail.tsx
│   ├── common/                       # NEW: shared UI
│   │   ├── EmptyState.tsx
│   │   ├── SkeletonLoader.tsx
│   │   ├── Badge.tsx
│   │   ├── Header.tsx
│   │   ├── Avatar.tsx
│   │   └── BottomSheetModal.tsx
│   └── forms/                        # NEW: address form, review form, etc.
│
├── context/
│   └── supabase-provider.tsx         # (from starter) — extend with resetPasswordForEmail, profile fetch
│
├── config/
│   └── supabase.ts                   # (from starter) — Supabase client init
│
├── services/                         # NEW: API layer wrapping Supabase calls
│   ├── productService.ts
│   ├── categoryService.ts
│   ├── cartService.ts
│   ├── wishlistService.ts
│   ├── orderService.ts
│   ├── addressService.ts
│   ├── reviewService.ts
│   └── notificationService.ts
│
├── store/                            # NEW: Zustand stores (client-only state)
│   ├── cartStore.ts
│   ├── wishlistStore.ts
│   └── filterStore.ts
│
├── hooks/                            # NEW: React Query hooks + utility hooks
│   ├── useProducts.ts
│   ├── useCategories.ts
│   ├── useCart.ts
│   ├── useOrders.ts
│   ├── useDebounce.ts
│   └── useImageUpload.ts
│
├── lib/
│   └── useColorScheme.ts             # (from starter) — theme hook, extend for full dark/light tokens
│
├── constants/
│   └── colors.ts                     # (from starter) — extend palette for product badges, discounts, status colors
│
├── types/                            # NEW: TypeScript types
│   ├── product.ts  cart.ts  order.ts  address.ts  user.ts
│
├── scripts/                          # (from starter) — e.g. generate-colors.js
├── global.css / tailwind.config.js   # (from starter)
└── package.json
```

**Integration notes:**
- Keep the starter's `AuthProvider` as the single source of truth for session state; add a `profiles` fetch inside it so `session.user` is enriched with app-level profile data (name, avatar_url).
- Wrap the root layout with a `QueryClientProvider` (React Query) alongside the existing providers.
- Reuse `components/ui/*` as low-level primitives; build `components/product/*` and `components/common/*` on top of them rather than duplicating styles.
- The starter's `(protected)` group already gates authenticated routes — nest all commerce screens (product, cart, checkout, orders, address) inside it.

---

## 6. Supabase Data Model (Core Tables)

| Table | Key Columns |
|---|---|
| `profiles` | id (FK auth.users), name, phone, avatar_url, created_at |
| `categories` | id, name, icon_url, parent_id |
| `products` | id, name, description, price, discount_price, category_id, brand, rating, images[], stock, created_at |
| `product_variants` | id, product_id, size, color, stock, price_override |
| `wishlist` | id, user_id, product_id, created_at |
| `cart_items` | id, user_id, product_id, variant_id, quantity |
| `addresses` | id, user_id, label, name, phone, line1, line2, city, state, pincode, is_default |
| `orders` | id, user_id, address_id, status, total_amount, payment_method, created_at |
| `order_items` | id, order_id, product_id, variant_id, quantity, price |
| `reviews` | id, product_id, user_id, rating, comment, images[], created_at |
| `coupons` | id, code, discount_type, value, valid_till |
| `device_tokens` | id, user_id, expo_push_token |
| `banners` | id, image_url, link, active |

**Security**: Enable RLS on all user-owned tables (`cart_items`, `orders`, `addresses`, `wishlist`, `device_tokens`, `profiles`) restricting `user_id = auth.uid()`. `products`, `categories`, `banners` are public read, admin write.

---

## 7. Non-Functional Requirements

- **Performance**: Lazy-load images (`expo-image` with caching), paginate large lists, memoize components (`React.memo`, `useMemo`).
- **Offline handling**: Basic offline detection (`@react-native-community/netinfo`) with retry banners.
- **Accessibility**: Sufficient color contrast in both themes, accessible labels on interactive elements.
- **Security**: Never store plaintext passwords (handled by Supabase), use Row Level Security, sanitize inputs.
- **Scalability**: Service-layer abstraction so backend (Supabase) can be swapped/extended without rewriting UI.

## 8. Suggested Development Phases

| Phase | Scope |
|---|---|
| 1 | Clone `expo-supabase-starter`, install added deps (Zustand, React Query, image-picker, camera, notifications), create Supabase project + all tables/RLS from Section 6, wire `QueryClientProvider` into root layout |
| 2 | Extend starter's Auth (add Forgot Password, enrich session with `profiles` table) + build Onboarding carousel on top of `welcome.tsx` |
| 3 | Home, Categories, Product Listing, Product Details |
| 4 | Search, Filters & Sorting |
| 5 | Cart, Wishlist |
| 6 | Address Management, Checkout, Orders |
| 7 | Profile, Edit Profile, Settings, Theme toggle |
| 8 | Push Notifications, Image Upload polish |
| 9 | QA, responsive polish, performance pass, store submission prep |

## 9. Out of Scope (v1)
- Multi-vendor/seller dashboards.
- Live chat support.
- Full payment gateway production integration (test/sandbox only unless specified).
- Multi-language localization (structure allowed, translations not included).

## 10. Open Questions
- Which payment gateway (Razorpay/Stripe/PayU) should be integrated, and in test or production mode?
- Is admin/seller panel needed, or is product data seeded manually via Supabase dashboard?
- Should social login (Google/Apple) be included in v1?
