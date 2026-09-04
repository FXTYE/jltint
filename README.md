# JL Tint — Website

A static marketing site for JL Tint (window tinting, custom colour change vehicle
wraps, commercial/shop front wraps, and paint protection film). No build step —
plain HTML, CSS and JS.

## Structure

```
index.html        Single-page site (nav, hero, service sections, gallery, quote form, footer)
css/style.css      Design system + responsive styles
js/main.js         Nav, scroll reveal, gallery lightbox, multi-step quote form
assets/img/        Optimised images sourced from the JL Tint brand artwork/flyers
```

## Running locally

Any static file server works, e.g.:

```
npx http-server -p 8080
```

Then open http://localhost:8080/index.html.

## Get a Quote form — required setup

The multi-step quote form (with photo attachment) submits via
[FormSubmit.co](https://formsubmit.co/), which requires **no backend and no
account** — it emails submissions straight to an inbox.

**Before going live**, open `js/main.js` and replace the placeholder address:

```js
var QUOTE_FORM_EMAIL = "quotes@jltint.com.au"; // <-- put the real inbox here
```

The **first** submission sent to a new address triggers a one-time confirmation
email from FormSubmit — click the link in it to activate delivery. Until that's
confirmed, quote requests won't arrive in the inbox even though the form
succeeds. Test this end-to-end (submit a real test enquiry) before launch.

Photo attachments (up to 5 images, 8MB each) are included in the emailed
submission automatically.

## Deploying

Being a static site, it can be hosted as-is on GitHub Pages, Netlify, Cloudflare
Pages, or any static host — just publish the repository root (or copy these
files to the host's publish directory).

## Content notes

- Phone number, Facebook handle, service pricing and package details were taken
  directly from the supplied JL Tint marketing artwork.
- The Facebook link in the header/footer points to `facebook.com` as a
  placeholder — update it to the real JL Tint page URL.
- Gallery images are the supplied promotional flyers/brand art; swap in real
  install photos as they become available.
