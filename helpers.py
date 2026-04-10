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


def inr(value):
    """Format value as INR."""
    return f"₹{value:,.2f}"
