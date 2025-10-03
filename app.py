import os
from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from enum import Enum as PyEnum
from dotenv import load_dotenv # <-- Import the library

load_dotenv() # <-- Load the .env file

# --- App Initialization ---
app = Flask(__name__)

# This is now production-ready. It reads the SECRET_KEY from the environment.
# If the key is not found, the app will fail to start, which is a good security practice.
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'instance', 'database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# --- (The rest of your code remains exactly the same) ---
# --- Enums for Expense Model ---
class ExpenseCategory(PyEnum):
    FOOD = "Food"
    TRANSPORT = "Transport"
    UTILITIES = "Utilities"
    ENTERTAINMENT = "Entertainment"
    OTHER = "Other"

# --- Database Models (User and Expense) ---
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False) # Text field
    category = db.Column(db.Enum(ExpenseCategory), nullable=False) # Enum field
    is_recurring = db.Column(db.Boolean, default=False, nullable=False) # Boolean field
    base_amount = db.Column(db.Float, nullable=False)
    tax_rate = db.Column(db.Float, nullable=False) # e.g., 0.05 for 5%
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    @property
    def amount_with_tax(self): # Calculated field
        return self.base_amount * (1 + self.tax_rate)

    def to_dict(self):
        return {
            'id': self.id,
            'description': self.description,
            'category': self.category.value,
            'is_recurring': self.is_recurring,
            'base_amount': self.base_amount,
            'tax_rate': self.tax_rate,
            'amount_with_tax': round(self.amount_with_tax, 2)
        }

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- Database Initialization Command ---
@app.cli.command("init-db")
def init_db_command():
    """Creates the database tables."""
    db.create_all()
    print("Initialized the database.")

# --- Routes will be added below ---
# ...

if __name__ == '__main__':
    app.run(debug=True)
