import os
from dotenv import load_dotenv

load_dotenv()  # Load .env before anything else

from flask import Flask, flash, jsonify, redirect, render_template, request, session
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash

import firebase_admin
from firebase_admin import credentials, auth as firebase_auth

from helpers import apology, login_required, lookup, inr, search_stocks, get_historical_data, get_top_gainers, get_top_weekly_stocks
from db import SQL

# Configure application
app = Flask(__name__)

# Custom filter
app.jinja_env.filters["inr"] = inr
app.jinja_env.filters["strip_suffix"] = lambda s: s.replace(".NS", "").replace(".BO", "")

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configure DB wrapper
db = SQL("finance.db")

# Initialize Firebase Admin SDK
_firebase_cred_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
if os.path.exists(_firebase_cred_path):
    cred = credentials.Certificate(_firebase_cred_path)
    firebase_admin.initialize_app(cred)
else:
    print("WARNING: serviceAccountKey.json not found — Google sign-in will not work.")
    print("Download it from Firebase Console → Project Settings → Service Accounts")


@app.context_processor
def inject_firebase_config():
    """Make Firebase client-side config available in every template."""
    return {
        "firebase_config": {
            "apiKey": os.environ.get("FIREBASE_API_KEY", ""),
            "authDomain": os.environ.get("FIREBASE_AUTH_DOMAIN", ""),
            "projectId": os.environ.get("FIREBASE_PROJECT_ID", ""),
            "storageBucket": os.environ.get("FIREBASE_STORAGE_BUCKET", ""),
            "messagingSenderId": os.environ.get("FIREBASE_MESSAGING_SENDER_ID", ""),
            "appId": os.environ.get("FIREBASE_APP_ID", ""),
        }
    }


@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


@app.route("/")
def index():
    """Show portfolio of stocks (logged in) or landing page (logged out)."""
    if session.get("user_id") is None:
        return render_template("landing.html")
    all_stocks = []
    stocks = db.execute(
        "SELECT stock, shares FROM portfolio where user_id = ?", session["user_id"])
    print(stocks)

    # Filter valid stocks
    valid_stocks = [s for s in stocks if s.get("stock")]
    symbols = [s["stock"] for s in valid_stocks]

    # Batch-fetch current prices in a single call instead of N serial lookup() calls
    prices = {}
    if symbols:
        try:
            import yfinance as yf
            batch = yf.download(symbols, period="1d", progress=False, threads=True)
            if len(symbols) == 1:
                # yf.download returns flat columns for a single symbol
                last_close = batch["Close"].dropna()
                if not last_close.empty:
                    prices[symbols[0]] = float(last_close.iloc[-1])
            else:
                for sym in symbols:
                    try:
                        col = batch[("Close", sym)].dropna()
                        if not col.empty:
                            prices[sym] = float(col.iloc[-1])
                    except Exception:
                        pass
        except Exception as e:
            print(f"Batch price fetch error: {e}")

    # Fall back to individual lookup for any missing prices
    for sym in symbols:
        if sym not in prices:
            info = lookup(sym)
            if info and info.get("price"):
                prices[sym] = float(info["price"])

    total_price = 0
    for stock in valid_stocks:
        sym = stock["stock"]
        price = prices.get(sym, 0)
        total_price += price * stock["shares"]
        all_stocks.append({"stock": sym, "shares": stock["shares"], "price": inr(
            price), "raw_price": price, "total_price": inr(price * stock["shares"])})

    cash_row = db.execute("select cash from users where id = ?", session["user_id"])
    cash = float(cash_row[0]["cash"]) if cash_row else 0.0
    # total_worth = total_price + cash
    total_worth = total_price
    profit_pct = ((total_worth - 10000.0) / 10000.0) * 10 if total_worth > 0 else 0.0
    
    return render_template("index.html", stocks=all_stocks, cash=inr(cash), total=inr(total_worth), profit_pct=profit_pct)



@app.route("/api/sparkline/<symbol>")
@login_required
def sparkline(symbol):
    """Return 1-month close prices as JSON for sparkline charts."""
    data = get_historical_data(symbol, period="1mo")
    if not data or not data["records"]:
        return jsonify({"closes": []})
    closes = [r["close"] for r in data["records"]]
    return jsonify({"closes": closes})


@app.route("/api/sparklines")
@login_required
def sparklines_batch():
    """Return 1-month close prices for multiple symbols in one request.
    Usage: /api/sparklines?symbols=TCS.NS,INFY.NS,RELIANCE.NS
    """
    symbols_param = request.args.get("symbols", "")
    symbols = [s.strip() for s in symbols_param.split(",") if s.strip()]
    if not symbols:
        return jsonify({})

    result = {}
    for sym in symbols:
        data = get_historical_data(sym, period="1mo")
        if data and data["records"]:
            result[sym] = [r["close"] for r in data["records"]]
        else:
            result[sym] = []
    return jsonify(result)


@app.route("/api/history/<symbol>")
@login_required
def api_history(symbol):
    """Return close prices and dates for a given period as JSON."""
    period = request.args.get("period", "1mo")
    allowed = {"5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"}
    if period not in allowed:
        period = "1mo"
    data = get_historical_data(symbol, period=period)
    if not data or not data["records"]:
        return jsonify({"closes": [], "dates": []})
    closes = [r["close"] for r in data["records"]]
    dates = [r["date"] for r in data["records"]]
    return jsonify({"closes": closes, "dates": dates})



@app.route("/buy", methods=["POST"])
@login_required
def buy():
    """Buy shares of stock"""
    if not request.form.get("symbol"):
        return apology("must provide symbol", 403)

    # Ensure password was submitted
    elif not request.form.get("shares"):
        return apology("must provide shares", 403)

    symbol = request.form.get("symbol")
    stock = lookup(symbol)
    if not stock:
        return apology("Stock not found")
    try:
        shares = int(request.form.get("shares"))
    except ValueError:
        return apology("Please provide numeric share value", 400)
    else:
        if shares < 1:
            return apology("Please enter a valid shares value", 400)

    balance_row = db.execute("SELECT cash FROM users WHERE id = ?", session["user_id"])
    balance = balance_row[0] if balance_row else {"cash": 0}

    if float(balance["cash"]) < float(stock["price"]) * shares:
        return apology("You don't have enough balance")

   # check if it already exist
    existing = db.execute("SELECT * FROM portfolio WHERE user_id = ? AND stock = ?", session["user_id"], symbol)
    if existing:
        db.execute("UPDATE portfolio SET shares = shares + ? WHERE user_id = ? AND stock = ?", shares, session["user_id"], symbol)
    else:
        db.execute("INSERT INTO portfolio (user_id, stock, shares) VALUES (?, ?, ?)", session["user_id"], symbol, shares)

    db.execute("INSERT INTO transactions values (?, ?, ?, datetime('now'), ?)",
                session["user_id"], symbol, f"+{shares}", inr(float(stock["price"])))
    print(session["user_id"])
    db.execute("update users set cash = cash - ? where id = ?",
                float(stock["price"]) * float(shares), session["user_id"])
    return redirect("/")


@app.route("/history")
@login_required
def history():
    """Show history of transactions"""
    transactions = db.execute("SELECT * from transactions where user_id = ?", session["user_id"])
    return render_template("history.html", transactions=transactions)


@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in"""
    if session.get("user_id") is not None:
        return redirect("/")

    # Forget any user_id
    session.clear()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":
        # Ensure username was submitted
        if not request.form.get("username"):
            return apology("must provide username", 403)

        # Ensure password was submitted
        elif not request.form.get("password"):
            return apology("must provide password", 403)

        # Query database for username
        rows = db.execute(
            "SELECT * FROM users WHERE username = ?", request.form.get("username"))

        # Ensure username exists and password is correct
        if len(rows) != 1 or not check_password_hash(
            rows[0]["hash"], request.form.get("password")
        ):
            return apology("invalid username and/or password", 403)

        # Remember which user has logged in
        session["user_id"] = rows[0]["id"]

        # Redirect user to home page
        return redirect("/")

    else:
        return render_template("login.html")


@app.route("/logout")
def logout():
    """Log user out"""

    # Forget any user_id
    session.clear()

    # Redirect user to login form
    return redirect("/")


@app.route("/google-login", methods=["POST"])
def google_login():
    """Handle Google sign-in via Firebase ID token."""
    data = request.get_json()
    id_token = data.get("idToken") if data else None

    if not id_token:
        return jsonify({"error": "Missing ID token"}), 400

    try:
        # Verify the Firebase ID token
        decoded = firebase_auth.verify_id_token(id_token)
        google_uid = decoded["uid"]
        google_email = decoded.get("email", google_uid)

        # Check if this Google user already exists in our DB
        user = db.execute("SELECT * FROM users WHERE username = ?", google_uid)

        if not user:
            # First-time Google user — create a row with a placeholder hash
            db.execute(
                "INSERT INTO users (username, hash) VALUES (?, ?)",
                google_uid, "GOOGLE_AUTH"
            )
            user = db.execute("SELECT * FROM users WHERE username = ?", google_uid)

        # Set Flask session
        session["user_id"] = user[0]["id"]

        return jsonify({"success": True})

    except Exception as e:
        print(f"Google login error: {e}")
        return jsonify({"error": "Authentication failed"}), 401


@app.route("/quote/<symbol>")
@login_required
def quote(symbol):
    """Get stock quote."""
    stock = lookup(symbol)
    if not stock:
        return apology("Stock not found")
    if stock.get("price") is None:
        return apology("Price data unavailable for this stock")
    return render_template("quoted.html", stock=stock, value=inr(stock["price"]))


@app.route("/stockhistory/<symbol>")
@login_required
def stock_history(symbol):
    """Show historical stock data."""
    period = request.args.get("period", "1y")
    start_date = request.args.get("start")
    end_date = request.args.get("end")

    data = get_historical_data(symbol, start_date=start_date, end_date=end_date, period=period)
    if not data:
        return apology("Could not fetch historical data for this stock")

    stock_info = lookup(symbol)
    stock_name = stock_info["name"] if stock_info else symbol.upper()

    return render_template(
        "stock_history.html",
        data=data,
        stock_name=stock_name,
        period=period,
        start_date=start_date or "",
        end_date=end_date or "",
    )


@app.route("/search", methods=["GET", "POST"])
@login_required
def search():
    """Search stocks."""
    if request.method == "POST":
        query = request.form.get("query")
        return redirect(f"/search/{query}")
    # Render page immediately — top gainers load async via /api/top-gainers
    return render_template("search.html")


@app.route("/api/top-gainers")
@login_required
def api_top_gainers():
    """Return top monthly gainers as JSON (loaded async by the search page)."""
    gainers = get_top_gainers()
    return jsonify(gainers)

@app.route("/api/top-weekly")
@login_required
def api_top_weekly():
    """Return top weekly gainers as JSON (loaded async by the search page)."""
    weekly = get_top_weekly_stocks()
    return jsonify(weekly)

@app.route("/search/<query>")
@login_required
def search_results(query):
    """Search stocks."""
    stocks = search_stocks(query)
    if not stocks:
        return apology("Stock not found")
    return render_template("search_results.html", stocks=stocks)

@app.route("/register", methods=["GET", "POST"])
def register():
    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":
        # Ensure username was submitted
        if not request.form.get("username"):
            return apology("must provide username", 400)

        # Ensure password was submitted
        elif not request.form.get("password"):
            return apology("must provide password", 400)

        # Ensure confirmation was submitted
        elif not request.form.get("confirmation"):
            return apology("must provide confirmation", 400)

        if request.form.get("password") != request.form.get("confirmation"):
            return apology("Please double check your confirmation", 400)

        users = db.execute("SELECT * FROM users WHERE username = ?", request.form.get("username"))

        if len(users) != 0:
            return apology("Sorry, username already taken", 400)

        # Insert user
        db.execute(
            "INSERT INTO users (username, hash) values (?, ?)", request.form.get(
                "username"), generate_password_hash(request.form.get("password"))
        )

        user = db.execute("SELECT * FROM users WHERE username = ?", request.form.get("username"))

        # Remember which user has logged in
        session["user_id"] = user[0]["id"]

        # Redirect user to home page
        return redirect("/")

    else:
        return render_template("register.html")



@app.route("/api/price/<symbol>")
@login_required
def api_price(symbol):
    """Return current price and owned shares for a symbol as JSON."""
    stock = lookup(symbol)
    if not stock:
        return jsonify({"error": "Stock not found"}), 404
    held = db.execute("SELECT shares FROM portfolio WHERE user_id = ? AND stock = ?", session["user_id"], symbol)
    owned_shares = held[0]["shares"] if held else 0
    return jsonify({"price": stock["price"], "owned_shares": owned_shares})


@app.route("/sell", methods=["GET", "POST"])
@login_required
def sell():
    """Sell shares of stock"""
    stocks = db.execute("SELECT * FROM portfolio where user_id = ?", session["user_id"])
    symbols = []

    if len(stocks) != 0:
        for stock in stocks:
            symbols.append(stock["stock"])

    if request.method == "POST":
        if not request.form.get("symbol"):
            return apology("must provide symbol", 403)

        elif not request.form.get("shares"):
            return apology("must provide shares", 403)

        symbol = request.form.get("symbol")
        stock = lookup(symbol)

        current_stock = db.execute("SELECT * FROM portfolio WHERE stock = ? AND user_id = ?", symbol, session["user_id"])

        if not current_stock:
            return apology("You don't own this stock", 400)

        try:
            shares = int(request.form.get("shares"))
        except ValueError:
            return apology("Please provide numeric share value", 400)
        else:
            if shares < 1:
                return apology("Please enter a valid shares value", 400)
            
            elif shares > current_stock[0]["shares"]:
                return jsonify({"error": f"You only own {current_stock[0]['shares']} shares of this stock."}), 400

        if current_stock[0]["shares"] - shares == 0:
            db.execute("DELETE FROM portfolio WHERE stock = ? AND user_id = ?", symbol, session["user_id"])
        else:
            db.execute("update portfolio set shares = shares - ? where user_id = ? and stock = ?",
                       shares, session["user_id"], symbol)

        db.execute("INSERT INTO transactions values (?, ?, ?, datetime('now'), ?)",
                   session["user_id"], symbol, f"-{shares}", inr(float(stock["price"])))
        db.execute("update users set cash = cash + ? where id = ?",
                   float(stock["price"]) * shares, session["user_id"])
        return jsonify({"status": "success"})

    return render_template("sell.html", symbols=symbols)
