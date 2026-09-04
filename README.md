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
assets/img/           Optimised photos of real installs
assets/img/cutouts/   Background-removed vehicle PNG/WebP cut-outs (see below)
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

## Vehicle cut-outs

The hero, the Window Tint section and the CTA band use vehicles that have had
their background removed, so they sit *in* the dark page rather than looking
like photos pasted on it.

Current cut-outs:

| File | Where | Source |
|---|---|---|
| `gt3rs.webp` | Hero | Stock photo — **not** JL Tint's work |
| `g63.webp` | CTA band | Stock photo — **not** JL Tint's work. Number plate blacked out. |
| `patrol.webp` | Window Tint section | JL Tint's own install |
| `urus.webp` | *unused spare* | Stock photo. Front is cropped in the original, so it only works bleeding off a page edge. |
 Each one is composed of three layers
(`.vehicle-stage` in the CSS): a warm radial glow behind, the transparent
cut-out itself with a silhouette drop-shadow, and an elliptical contact
shadow so it reads as standing on a floor. In the hero and CTA band a
left-hand gradient scrim (`.hero-scrim` / `.cta-scrim`) melts the vehicle
into the same background the text sits on.

The cut-outs were generated from the originals in `assets/img/work/` with
[rembg](https://github.com/danielgatis/rembg) (u2net model, alpha matting on).
To add more:

```
pip install rembg onnxruntime
python3 -c "
from rembg import remove, new_session
from PIL import Image
s = new_session('u2net')
im = Image.open('assets/img/work/YOURCAR.jpg').convert('RGB')
out = remove(im, session=s, alpha_matting=True, alpha_matting_foreground_threshold=270,
             alpha_matting_background_threshold=20, alpha_matting_erode_size=11)
out.crop(out.getbbox()).save('assets/img/cutouts/yourcar.webp', 'WEBP', quality=88, method=6)
"
```

Check the result on a dark background before shipping it — reflective panels
and roof racks occasionally pick up a sliver of the shed behind them.

## Content notes

- Phone number, Facebook handle, service pricing and package details were taken
  directly from the supplied JL Tint marketing artwork.
- The Facebook link in the header/footer points to `facebook.com` as a
  placeholder — update it to the real JL Tint page URL.
- Gallery images are real install photos supplied by the shop. Check each new
  one for visible number plates before publishing (one has been blurred).
- **Stock vs. own work.** The hero and CTA band use stock photos of premium cars
  as brand/mood imagery. Everything that makes a claim about JL Tint's work —
  the Recent Work gallery and the Window Tint section — uses the shop's own
  installs, and should stay that way.
- **Keep the licence record for the stock photos.** They need a licence that
  permits commercial use (Unsplash and Pexels both do, with no attribution
  required). Save the source URL and licence for each one somewhere you can
  find it later; stock agencies do chase unlicensed use on business sites.
