# Reverse DCF — Implied Growth (AdminLTE CDN)

A one-screen calculator embedded in **AdminLTE v4** (via CDN) that takes today’s **price**, **shares**, **net debt**, **WACC**, **ROIC**, and **NOPAT (NTM)** and solves for the **market-implied perpetual growth `g`** using the value-driver DCF.

## URLs
- Landing: `/index.html`
- Tool: `/tools/reverse-dcf/index.html`

## Math

EV = NOPAT × (1 − g/ROIC) / (WACC − g)
g = (EV·WACC − NOPAT) / (EV − NOPAT/ROIC)
EV = Price × Shares + NetDebt
Reinvestment = g/ROIC; Payout = 1 − g/ROIC

Constraints: `g < WACC` and `g < ROIC`. Near `EV ≈ NOPAT/ROIC`, results are unstable (“knife-edge”).

## Deploy (Cloudflare Pages)
1. Push this repo to GitHub.
2. In Cloudflare Pages: **Create a project** → **Connect to Git** → choose repo.
3. Build settings:
   - Framework preset: **None**
   - Build command: *(leave empty)*
   - Build output directory: **/**
4. Deploy. Commits to `main` auto-deploy.

## Deploy (GitHub Pages)
Settings → Pages → Source: **Deploy from a branch** → branch **main**, folder **/**.

## Notes
- Enter **shares, net debt, and NOPAT in billions**; price is per share.
- Currency symbol is for display only.
- Educational tool. Not investment advice.

## License
MIT — see `LICENSE`.
