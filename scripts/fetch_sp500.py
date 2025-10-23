import yfinance as yf, json, time
from datetime import timezone

df = yf.download("^GSPC", period="5d", interval="1d", auto_adjust=True, progress=False)
last_price = float(df["Close"].dropna().iloc[-1])
ts = df.index[-1].tz_convert(timezone.utc)

data = {
    "symbol": "SPX",
    "price": round(last_price, 2),
    "currency": "USD",
    "as_of_utc": ts.isoformat().replace("+00:00","Z"),
    "last_updated_unix": int(time.time())
}

with open("public/data/sp500.json", "w") as f:
    json.dump(data, f, indent=2)
