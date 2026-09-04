# JL Tint — Website

A marketing site for JL Tint (window tinting, custom colour change vehicle
wraps, commercial/shop front wraps, and paint protection film), built for
**Cloudflare Pages**: static HTML/CSS/JS plus a Pages Function that backs the
"Get a Quote" form.

## Structure

```
index.html          Single-page site (nav, hero, service sections, gallery, quote form, footer)
css/style.css        Design system + responsive styles
js/main.js            Nav, scroll reveal, gallery lightbox, multi-step quote form
assets/img/           Optimised images sourced from the JL Tint brand artwork/flyers
functions/api/quote.js  Pages Function — receives quote submissions, writes to D1
migrations/           D1 schema (leads table)
wrangler.toml          Pages project config + D1 (and future R2) bindings
```

## How the quote form works

The 4-step "Get a Quote" form (with photo attachment) POSTs to `/api/quote`,
a Cloudflare Pages Function (`functions/api/quote.js`). Each submission is:

1. Validated server-side (name, phone, valid email, at least one service, consent).
2. Checked against a hidden honeypot field to drop obvious bot spam.
3. Written as a row in the **`jltint-leads`** D1 database (binding `DB`).

**A D1 database and its `leads` table already exist** in the connected
Cloudflare account (database `jltint-leads`, id in `wrangler.toml`) — no setup
needed there.

### Viewing leads

There's no admin UI yet — leads are reviewed directly in Cloudflare:

- **Dashboard:** Workers & Pages → D1 → `jltint-leads` → Tables → `leads`.
- **CLI:** `npm run d1:query:remote` (or `wrangler d1 execute jltint-leads
  --remote --command "select * from leads order by created_at desc"`).

### Photo attachments (R2) — one manual step left

Photos are validated and their metadata (filename/size/type) is always saved,
but the file bytes are only stored if an **R2** bucket is bound. R2 isn't
enabled on this Cloudflare account yet — it's a one-time toggle:

1. Cloudflare dashboard → **R2** → **Enable R2** (has a free tier).
2. `wrangler r2 bucket create jltint-quote-photos`
3. In `wrangler.toml`, uncomment the `[[r2_buckets]]` block.
4. In the Pages project dashboard → **Settings → Functions → R2 bucket
   bindings**, add a binding named `PHOTOS` → bucket `jltint-quote-photos`
   (Git-connected Pages projects read bindings from the dashboard, not just
   `wrangler.toml`).
5. Redeploy. No code changes needed — `functions/api/quote.js` already checks
   for `env.PHOTOS` and starts uploading to it automatically once bound.

### Email notifications — not set up yet (by design)

Right now nobody is emailed when a lead comes in; leads just accumulate in
D1. When jltint's domain is added to Cloudflare, the cleanest native option
is **Email Routing**'s `send_email` binding (no third-party account needed).
That hooks in via the empty `notifyNewLead()` function at the bottom of
`functions/api/quote.js` — nothing else in the form/API needs to change.

## Deploying to Cloudflare Pages

The repo has no build step (`pages_build_output_dir = "."` in
`wrangler.toml`), so either deploy path works:

**Option A — Git integration (recommended, auto-deploys on push):**
1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git** → select this repo/branch.
2. Build command: *(none)*. Build output directory: `/`.
3. **Settings → Functions → D1 database bindings** → add `DB` → `jltint-leads`.
   (This is required — Git-connected Pages builds don't automatically read
   `wrangler.toml` bindings.)
4. Deploy. The form will work immediately at the generated `*.pages.dev` URL.
5. Add a custom domain later under **Custom domains** once jltint's domain is
   on Cloudflare.

**Option B — CLI:**
```
npm install
npx wrangler login
npm run deploy
```
Wrangler CLI deploys do read `wrangler.toml` bindings directly.

## Local development

```
npm install
npm run d1:migrate:local   # creates the leads table in a local D1 copy
npm run dev                # wrangler pages dev — serves the site + /api/quote
```

## Content notes

- Phone number, Facebook handle, service pricing and package details were taken
  directly from the supplied JL Tint marketing artwork.
- The Facebook link in the header/footer points to `facebook.com` as a
  placeholder — update it to the real JL Tint page URL.
- Gallery images are the supplied promotional flyers/brand art; swap in real
  install photos as they become available.
