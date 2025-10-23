#!/usr/bin/env python3
"""
Fetch daily adjusted-close history for multiple tickers via yfinance,
then write compact JSONs for static hosting.
- prices_daily.json: daily adjusted closes per ticker
- prices_monthly.json: monthly (business-month end) adjusted closes
- perf100_monthly.json: monthly series rebased to 100 at first observation
"""

import os, json, time
from datetime import timezone
import pandas as pd
import yfinance as yf

TICKERS = [
    "VWCE.MI",  # Vanguard FTSE All-World UCITS EUR Acc (Borsa Italiana)
    "V60A.AS",  # Vanguard LifeStrategy 60% UCITS (Euronext Amsterdam)
    "CSPX.AS",  # iShares Core S&P 500 UCITS (Euronext Amsterdam)
    "VOO",      # Vanguard S&P 500 ETF
    "VT",       # Vanguard Total World
    "AOR"       # iShares Core Growth Allocation (60/40)
]

OUT_DIR = "public/data"
DAILY_FILE = os.path.join(OUT_DIR, "prices_daily.json")
MONTHLY_FILE = os.path.join(OUT_DIR, "prices_monthly.json")
PERF100_MONTHLY_FILE = os.path.join(OUT_DIR, "perf100_monthly.json")

def _ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)

def _iso_date(ts: pd.Timestamp) -> str:
    # normalize to UTC date string YYYY-MM-DD
    if ts.tzinfo is None:
        ts = ts.tz_localize("UTC")
    else:
        ts = ts.tz_convert("UTC")
    return ts.date().isoformat()

def _to_pairs(s: pd.Series) -> list:
    """Convert a Series with DatetimeIndex -> [[YYYY-MM-DD, value], ...]"""
    s = s.dropna()
    return [[_iso_date(ts), round(float(v), 4)] for ts, v in s.items()]

def fetch_history(tickers):
    # One batched call is nicer to Yahoo than many singles
    df = yf.download(
        tickers=" ".join(tickers),
        period="max",
        interval="1d",
        auto_adjust=True,
        group_by="ticker",
        threads=True,
        progress=False,
    )
    if df.empty:
        raise RuntimeError("No data returned from yfinance")

    data_daily = {}
    # yfinance returns a multi-column DF for multiple tickers: level0=ticker, level1=OHLCV
    for t in tickers:
        try:
            if isinstance(df.columns, pd.MultiIndex):
                s = df[t]["Close"].dropna()
            else:
                # Single-ticker edge case (shouldn't happen here)
                s = df["Close"].dropna()
        except KeyError:
            # Ticker missing or renamed; skip quietly
            continue
        s = s.sort_index()
        data_daily[t] = _to_pairs(s)

    return data_daily

def resample_monthly(data_daily: dict) -> dict:
    out = {}
    for t, pairs in data_daily.items():
        if not pairs:
            continue
        # Rebuild a Series to resample
        idx = pd.to_datetime([p[0] for p in pairs], utc=True)
        vals = pd.Series([p[1] for p in pairs], index=idx)
        m = vals.resample("M").last().dropna()
        out[t] = _to_pairs(m)
    return out

def rebase_100(data_monthly: dict) -> dict:
    out = {}
    for t, pairs in data_monthly.items():
        if not pairs:
            continue
        base = pairs[0][1]
        if base == 0:
            continue
        out[t] = [[d, round(v / base * 100.0, 4)] for d, v in pairs]
    return out

def write_json(path: str, payload: dict) -> None:
    _ensure_dir(os.path.dirname(path))
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"), indent=0)

def main():
    data_daily = fetch_history(TICKERS)
    meta = {
        "source": "yfinance",
        "last_updated_utc": pd.Timestamp.utcnow().tz_convert("UTC").isoformat().replace("+00:00", "Z")
    }
    # 1) daily
    payload_daily = {"meta": meta} | data_daily
    write_json(DAILY_FILE, payload_daily)

    # 2) monthly downsample
    data_monthly = resample_monthly(data_daily)
    payload_monthly = {"meta": meta} | data_monthly
    write_json(MONTHLY_FILE, payload_monthly)

    # 3) perf100 monthly
    perf100 = rebase_100(data_monthly)
    payload_perf = {"meta": meta} | perf100
    write_json(PERF100_MONTHLY_FILE, payload_perf)

    # Log a concise summary for the Actions log
    print("Wrote:", DAILY_FILE, MONTHLY_FILE, PERF100_MONTHLY_FILE)
    for t in TICKERS:
        n_d = len(data_daily.get(t, []))
        n_m = len(data_monthly.get(t, []))
        print(f"  {t}: {n_d} daily pts, {n_m} monthly pts")

if __name__ == "__main__":
    main()
