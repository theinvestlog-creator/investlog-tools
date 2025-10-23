import yfinance as yf
import json
import time
import pandas as pd

TICKER = "^GSPC"
OUTFILE = "public/data/sp500.json"

# Download last few days so we always get a valid close
df = yf.download(TICKER, period="5d", interval="1d", auto_adjust=True, progress=False)

if df.empty:
    raise RuntimeError("No data returned from yfinance")

# take the last non-NaN close, and convert to Python float safely
last_price = df["Close"].dropna().iloc[-1]
last_price = float(last_price.item() if hasattr(last_price, "item") else last_price)

# last index is a pandas Timestamp, sometimes tz-naive
ts = df.index[-1]
if ts.tzinfo is None:
    ts = ts.tz_localize("UTC")
else:
    ts = ts.tz_convert("UTC")

data = {
    "symbol": "SPX",
    "source": "yfinance",
    "price": round(last_price, 2),
    "currency": "USD",
    "as_of_utc": ts.isoformat().replace("+00:00", "Z"),
    "last_updated_unix": int(time.time())
}

with open(OUTFILE, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print("Wrote", OUTFILE, ":", data)
