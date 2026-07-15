# Transactional Email: Resend vs. Loops vs. Mailersend

Evaluated for ShopEase's transactional needs — order confirmations, shipping updates, password
resets, welcome emails — sent from a React Native/Expo app backed by Supabase.

## TL;DR

**Resend** is the strongest fit. Best developer experience (React Email component-based
templates, clean API, generous docs), transparent volume-based pricing, and first-class Supabase
integration guides. **Mailersend** is the safe second choice if you outgrow Resend's dashboard or
want built-in email verification. **Loops** is not a good fit — it's priced and built for
marketing/lifecycle email with transactional as an add-on, not the other way around.

## Comparison table

| | Resend | Loops | Mailersend |
|---|---|---|---|
| **Pricing model** | Per email volume | Per subscribed contact (transactional included) | Per email volume |
| **Free tier** | 3,000/mo, 100/day | 4,000/mo, 1,000 contacts, never expires | 500/mo, 100/day (as of Dec 2025) |
| **Entry paid tier** | $20–35/mo | $49/mo (1,000–5,000 contacts) | $7/mo (5,000 emails) |
| **Templates** | React Email (code, versionable) | Visual drag-and-drop editor | Drag-and-drop + dynamic templates |
| **SDKs** | Official, all major languages | JS-focused | Official, all major languages |
| **Dedicated IP** | Scale tier and up | Not the focus | Available on higher tiers |
| **Best suited for** | Product/dev teams shipping code-defined emails | SaaS teams merging marketing + transactional in one tool | Teams wanting deliverability tooling (verification, dashboards) out of the box |

## Resend

**Pros**
- Templates are React components (React Email) — type-checked, testable, reviewable in a normal PR, no separate visual-editor tool to learn or keep in sync with code.
- Clean, minimal REST API with an idempotent send endpoint; SDKs feel native rather than generated.
- Volume-based pricing scales predictably with actual usage — no per-contact tax as your user base grows independent of email volume.
- Widely documented Supabase integration path (common pairing for Auth email hooks + transactional sends), which matters directly for this stack.

**Cons**
- Minimal dashboard — fewer built-in deliverability/analytics insights than Mailersend.
- Scale-tier pricing roughly doubled in late 2024; the trajectory of future price changes is a real unknown for a growing app.
- No built-in list/contact management — pure transactional/send API, so any marketing-adjacent email needs a separate tool.

**Scalability**: Per-email pricing means cost tracks usage linearly; dedicated IPs available from the Scale tier for senders who need reputation isolation at high volume.

**Ease of development**: Highest of the three, specifically because your Expo app is already a React/TypeScript codebase — email templates become just another set of components instead of a context switch into a separate builder tool.

**Maintenance**: Templates live in your repo and deploy with the rest of your code — one less external system to keep in sync. Domain/DNS (DKIM/SPF/DMARC) setup is a one-time cost shared by all three providers.

## Loops

**Pros**
- Free tier never expires and includes both transactional and marketing sends.
- Visual editor is accessible to non-engineers — useful if a founder or PM wants to edit copy without a PR.
- Single platform for onboarding sequences, campaigns, *and* transactional email, which reduces tool count if you actually need all three.

**Pros/cons overlap**: the visual editor is also the biggest downside for a code-first team — templates aren't version-controlled, can't go through CI, and drift from what's in the repo.

**Cons**
- Pricing is per-contact, not per-email — this is the core mismatch for ShopEase. A pure transactional workload (order confirmations, shipping notices) has no natural relationship to "subscribed contacts," so you'd likely pay for a marketing-sized contact tier to support a small transactional volume.
- No React Email-equivalent story — template changes mean logging into a separate tool, not a code change.
- Best value only materializes if you also adopt Loops for marketing/lifecycle email — evaluated as pure transactional infra, it's the most expensive and least code-native of the three.

**Scalability**: Fine at the email-throughput level, but the pricing model doesn't scale cleanly with a growing *user base* unless most of those users are also marketing contacts.

**Ease of development**: Fast to get a first email sending, but ongoing template work happens outside your codebase.

**Maintenance**: Lower engineering maintenance (no template code to own) but higher cross-tool coordination — someone has to keep the visual templates aligned with product copy/branding changes made in the app.

## Mailersend

**Pros**
- Strong deliverability tooling out of the box: built-in email verification, real-time activity dashboard, webhooks, inbound routing — more operational visibility than Resend's minimal UI.
- Both drag-and-drop and code-based (dynamic) templates, so it doesn't force an all-visual or all-code workflow.
- Cheapest true entry point of the three ($7/mo for 5,000 emails) if you want a paid tier without Resend's Pro jump.

**Cons**
- No React Email equivalent — template authoring is close to Resend's DX but doesn't reach the same "it's just a component" simplicity.
- Recent pricing restructure (Dec 2025) cut the free tier from 3,000/mo down to 500/mo, with the old free volume now gated behind a $7/mo plan — worth watching for further downward adjustments to the free tier.
- Professional tier ($99–110/mo for 50k emails) is pricier than Resend's equivalent Scale-tier volume.

**Scalability**: Comparable to Resend — per-volume pricing, dedicated IPs available for high-volume senders.

**Ease of development**: Close to Resend, slightly behind due to the lack of React Email integration; still a clean API and solid SDK coverage.

**Maintenance**: The built-in verification and deliverability dashboard reduce the operational burden of diagnosing bounce/spam issues — a genuine maintenance advantage over Resend's leaner tooling.

## Recommendation for ShopEase

Go with **Resend**. The deciding factor is that ShopEase is already a TypeScript/React codebase —
React Email means transactional templates (order confirmed, shipment update, password reset) are
authored, reviewed, and deployed exactly like the rest of the app, with no separate tool to
maintain or keep in sync. Loops' per-contact pricing is a poor match for a pure transactional
workload, and Mailersend's advantages (verification, richer dashboard) are operational nice-to-haves
that matter more at a scale ShopEase isn't at yet — they're worth revisiting if deliverability
troubleshooting becomes a real pain point later.

## Sources

- [Pricing · Resend](https://resend.com/pricing)
- [Resend pricing (April 30, 2026): plans, alternatives, limits | TierGauge](https://tiergauge.com/tools/resend/)
- [Email API Pricing Comparison (July 2026) | Resend, SendGrid, Postmark](https://www.buildmvpfast.com/api-costs/email)
- [Pricing: Free Plan and Contact-Based Plans | Loops](https://loops.so/pricing)
- [Transactional Email Service | Loops](https://loops.so/transactional-email)
- [Free plan - Loops](https://loops.so/docs/account/free-plan)
- [Loops vs Resend: Contact Pricing vs Volume Pricing (2026) | Transmit](https://xmit.sh/versus/loops-vs-resend)
- [MailerSend Pricing - Get Started Today - MailerSend](https://www.mailersend.com/pricing)
- [MailerSend Plans and Limits - MailerSend](https://www.mailersend.com/help/plans-features-and-limits)
- [MailerSend Pricing 2026: Plans, Costs & Real TCO | CheckThat.ai](https://checkthat.ai/brands/mailersend/pricing)
- [Loops vs Resend: Modern Transactional Email Comparison | Mailflow Authority](https://mailflowauthority.com/email-comparisons/loops-vs-resend)
- [React Email vs Resend vs Loops for SaaS Email 2026 | StarterPick](https://starterpick.com/guides/react-email-vs-resend-vs-loops-boilerplates-2026)
- [Resend vs Loops — Honest Head-to-Head Comparison](https://www.unlocksaas.com/vs/resend-vs-loops)
