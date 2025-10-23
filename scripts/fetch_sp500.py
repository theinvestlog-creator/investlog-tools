import yfinance as yf, json, time
from datetime import timezone

TICKER = "^GSPC"

df = yf.download(TICKER, period="5d", interval="1d", auto_adjust=True, progress=False)

if df.empty:
    raise RuntimeError("No data returned from yfinance")

# take last valid close
last_price = float(df["Close"].dropna().iloc[-1].item())
ts = df.index[-1]

# handle timezone: localize if naive, otherwise convert
if ts.tzinfo is None:
    ts = ts.tz_localize("UTC")
else:
    ts = ts.tz_convert("UTC")

data = {
    "symbol": "SPX",
    "price": round(last_price, 2),
    "currency": "USD",
    "as_of_utc": ts.isoformat().replace("+00:00", "Z"),
    "last_updated_unix": int(time.time())
}

with open("public/data/sp500.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print("Wrote public/data/sp500.json:", data)
