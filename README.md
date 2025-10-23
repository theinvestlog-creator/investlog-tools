# InvestLog Tools (11ty + AdminLTE)
Static site with shared AdminLTE layout, built using Eleventy v2.

## URLs
- Landing: `/`
- Take-Profit (UI only): `/take-profit/`

## Local
npm ci
npm run serve   # http://localhost:8080

## Cloudflare Pages
Build command: npm ci && npm run build
Output directory: _site
Node version: 20+
Framework preset: None
No catch-all rewrites; file routing must serve /take-profit/ → /_site/take-profit/index.html.
