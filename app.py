import os

from flask import Flask, flash, redirect, render_template, request, session
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash

from helpers import apology, login_required, lookup, inr, search_stocks
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


@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


@app.route("/")
@login_required
def index():
    """Show portfolio of stocks"""
    all_stocks = []
    stocks = db.execute(
        "SELECT stock, shares FROM portfolio where user_id = ?", session["user_id"])
    print(stocks)
    total_price = 0
    for stock in stocks:
        # if stock row has no stock value skip
        if stock.get("stock") is None:
            continue
        price = float(lookup(stock["stock"])["price"])
        total_price += price * stock["shares"]
        all_stocks.append({"stock": stock["stock"], "shares": stock["shares"], "price": inr(
            price), "total_price": inr(price * stock["shares"])})

    cash_row = db.execute("select cash from users where id = ?", session["user_id"])
    cash = float(cash_row[0]["cash"]) if cash_row else 0.0
    total_worth = total_price + cash
    print(all_stocks)
    return render_template("index.html", stocks=all_stocks, cash=inr(cash), total=inr(total_worth))


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


@app.route("/quote/<symbol>")
@login_required
def quote(symbol):
    """Get stock quote."""
    stock = lookup(symbol)
    if not stock:
        return apology("Stock not found")
    return render_template("quoted.html", stock=stock, value=inr(stock["price"]))


@app.route("/search", methods=["GET", "POST"])
@login_required
def search():
    """Search stocks."""
    if request.method == "POST":
        query = request.form.get("query")
        return redirect(f"/search/{query}")
    return render_template("search.html")

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


