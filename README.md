# Lustre Nail Bar — Luxury Nail Salon Website

A modern, elegant, mobile-friendly marketing website for a luxury nail salon.
Built as a fast, self-contained static site (HTML + CSS + vanilla JS) with optimized
nail photography, so it loads instantly on phones and can be hosted anywhere.

## Sections
- Hero — "Luxury Nails. Fair Pricing. Flawless Results."
- Why Choose Us — six trust-building highlights
- Services & Pricing — transparent, competitive pricing
- Gallery — curated nail-design photography
- Customer Reviews — professional testimonials
- Booking — appointment request form (name, phone, service, date, message)
- About — the salon story
- Footer — hours, location, phone, socials, booking CTA

## Run locally
```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Permanent web address (GitHub Pages)
A deploy workflow is included at `.github/workflows/deploy-pages.yml`. To publish a
permanent URL you can open from any iPhone or device:

1. Merge this branch into `main`.
2. In the GitHub repo, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
   - Note: GitHub Pages on a **private** repo requires GitHub Pro/Team. If on the free
     plan, set the repo to **Public** (Settings → General → Danger Zone) to publish for free.
4. The site goes live at:
   **https://rvargas112902-ship-it.github.io/Solar-project/**

The workflow re-deploys automatically on every push to `main`.

## Project structure
```
index.html
assets/
  css/styles.css
  js/main.js
  img/*.webp
.github/workflows/deploy-pages.yml
```
