import requests

from flask import redirect, render_template, session
from functools import wraps
import yfinance as yf


def apology(message, code=400):
    """Render message as an apology to user."""

    return render_template("apology.html", top=code, bottom=message), code


def login_required(f):
    """
    Decorate routes to require login.

    https://flask.palletsprojects.com/en/latest/patterns/viewdecorators/
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/login")
        return f(*args, **kwargs)

    return decorated_function

def search_stocks(query):
    try:
        stocks = yf.Lookup(query).get_stock()
        return stocks
    except Exception as e:
        print(f"Error searching stocks: {e}")
        return None


def lookup(symbol):
    """Look up quote for symbol using yfinance."""
    try:
        stock = yf.Ticker(symbol)
        info = stock.info
        print(info)
        return {
            "name": info.get("shortName"),
            "price": info.get("currentPrice"),
            "symbol": symbol.upper(),
            "exchange": info.get("fullExchangeName"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "website": info.get("website"),
            "summary": info.get("longBusinessSummary"),
            "officers": info.get("companyOfficers"),
        }
    except Exception as e:
        print(f"Error looking up stock: {e}")
        return None


def get_historical_data(symbol, start_date=None, end_date=None, period="1y"):
    """Fetch historical stock data using yfinance.

    Args:
        symbol: Stock ticker symbol
        start_date: Start date string (YYYY-MM-DD). If provided with end_date, overrides period.
        end_date: End date string (YYYY-MM-DD). If provided with start_date, overrides period.
        period: Time period string (e.g. '1mo', '3mo', '6mo', '1y', '2y', '5y', 'max').
                Used only when start_date/end_date are not provided.

    Returns:
        dict with 'records' (list of dicts) and 'symbol', or None on error.
    """
    try:
        stock = yf.Ticker(symbol)

        if start_date and end_date:
            historical_data = stock.history(start=start_date, end=end_date)
        else:
            historical_data = stock.history(period=period)

        if historical_data.empty:
            return None

        # Convert to list of dicts for template rendering
        records = []
        for date, row in historical_data.iterrows():
            records.append({
                "date": date.strftime("%Y-%m-%d"),
                "open": round(row["Open"], 2),
                "high": round(row["High"], 2),
                "low": round(row["Low"], 2),
                "close": round(row["Close"], 2),
                "volume": int(row["Volume"]),
            })

        return {
            "symbol": symbol.upper(),
            "records": records,
            "total_records": len(records),
        }
    except Exception as e:
        print(f"Error fetching historical data: {e}")
        return None





def search_stocks(query):
    """Search for Indian stocks matching the query using yfinance Lookup."""
    try:
        stocks = yf.Lookup(query).get_stock()
        
        # Filter only Indian stocks (NSE and BSE)
        indian_stocks = stocks[stocks['exchange'].isin(['NSI', 'BSE'])]
        
        if not indian_stocks.empty:
            # Return list of matching stocks
            results = []
            for symbol, row in indian_stocks.iterrows():
                results.append({
                    "symbol": symbol,
                    "name": row['shortName'],
                    "exchange": row['exchange'],
                    "price": row['regularMarketPrice'] or row['currentPrice']
                })
            return results
        return None
    except Exception as e:
        print(f"Error searching stocks: {e}")
        return None


def get_top_gainers():
    """Fetch top 8 monthly gaining Indian stocks from a curated Nifty 50 watchlist."""
    # Curated list of major Indian stocks to scan (Nifty 50 core + popular picks)
    watchlist = [
        "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS",
        "HINDUNILVR.NS", "ITC.NS", "SBIN.NS", "BHARTIARTL.NS", "KOTAKBANK.NS",
        "LT.NS", "AXISBANK.NS", "WIPRO.NS", "HCLTECH.NS", "SUNPHARMA.NS",
        "MARUTI.NS", "TRENT.NS", "BAJFINANCE.NS", "TITAN.NS", "NTPC.NS",
        "POWERGRID.NS", "ONGC.NS", "TATASTEEL.NS", "JSWSTEEL.NS", "ADANIENT.NS",
        "ADANIPORTS.NS", "ULTRACEMCO.NS", "TECHM.NS", "BAJAJFINSV.NS", "HDFCLIFE.NS",
        "DRREDDY.NS", "CIPLA.NS", "APOLLOHOSP.NS", "TATACONSUM.NS", "COALINDIA.NS",
    ]

    # Pre-built name map — avoids 35 individual yf.Ticker().info calls
    name_map = {
        "RELIANCE.NS": "Reliance Industries", "TCS.NS": "Tata Consultancy",
        "INFY.NS": "Infosys", "HDFCBANK.NS": "HDFC Bank",
        "ICICIBANK.NS": "ICICI Bank", "HINDUNILVR.NS": "Hindustan Unilever",
        "ITC.NS": "ITC Limited", "SBIN.NS": "State Bank of India",
        "BHARTIARTL.NS": "Bharti Airtel", "KOTAKBANK.NS": "Kotak Mahindra Bank",
        "LT.NS": "Larsen & Toubro", "AXISBANK.NS": "Axis Bank",
        "WIPRO.NS": "Wipro", "HCLTECH.NS": "HCL Technologies",
        "SUNPHARMA.NS": "Sun Pharma", "MARUTI.NS": "Maruti Suzuki",
        "TRENT.NS": "Trent Limited", "BAJFINANCE.NS": "Bajaj Finance",
        "TITAN.NS": "Titan Company", "NTPC.NS": "NTPC Limited",
        "POWERGRID.NS": "Power Grid Corp", "ONGC.NS": "ONGC",
        "TATASTEEL.NS": "Tata Steel", "JSWSTEEL.NS": "JSW Steel",
        "ADANIENT.NS": "Adani Enterprises", "ADANIPORTS.NS": "Adani Ports",
        "ULTRACEMCO.NS": "UltraTech Cement", "TECHM.NS": "Tech Mahindra",
        "BAJAJFINSV.NS": "Bajaj Finserv", "HDFCLIFE.NS": "HDFC Life",
        "DRREDDY.NS": "Dr. Reddy's Labs", "CIPLA.NS": "Cipla",
        "APOLLOHOSP.NS": "Apollo Hospitals", "TATACONSUM.NS": "Tata Consumer",
        "COALINDIA.NS": "Coal India",
    }

    try:
        import yfinance as yf

        # Batch download 1-month data for all symbols (single HTTP call)
        data = yf.download(watchlist, period="1mo", group_by="ticker", progress=False, threads=True)

        gainers = []
        for symbol in watchlist:
            try:
                if symbol in data.columns.get_level_values(0):
                    ticker_data = data[symbol]["Close"].dropna()
                else:
                    continue

                if len(ticker_data) < 2:
                    continue

                first_close = float(ticker_data.iloc[0])
                last_close = float(ticker_data.iloc[-1])
                change_pct = ((last_close - first_close) / first_close) * 100

                gainers.append({
                    "symbol": symbol,
                    "name": name_map.get(symbol, symbol.replace(".NS", "")),
                    "price": round(last_close, 2),
                    "change_pct": round(change_pct, 2),
                    "prev_close": round(first_close, 2),
                })
            except Exception:
                continue

        # Sort by monthly % gain descending, take top 8
        gainers.sort(key=lambda x: x["change_pct"], reverse=True)
        return gainers[:10]

    except Exception as e:
        print(f"Error fetching top gainers: {e}")
        return []


def inr(value):
    """Format value as INR."""
    return f"₹{value:,.2f}"
