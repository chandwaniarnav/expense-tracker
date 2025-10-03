import os
from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from enum import Enum as PyEnum
from dotenv import load_dotenv

load_dotenv()

# --- App Initialization ---
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'instance', 'database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

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
    description = db.Column(db.String(200), nullable=False)
    category = db.Column(db.Enum(ExpenseCategory), nullable=False)
    is_recurring = db.Column(db.Boolean, default=False, nullable=False)
    base_amount = db.Column(db.Float, nullable=False)
    tax_rate = db.Column(db.Float, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    @property
    def amount_with_tax(self):
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

# --- Authentication Routes ---
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Missing username or password'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 409
    new_user = User(username=username)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': f'User {username} created successfully'}), 201

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        user = User.query.filter_by(username=data['username']).first()
        if user and user.check_password(data['password']):
            login_user(user)
            return jsonify({'message': 'Login successful'}), 200
        return jsonify({'error': 'Invalid credentials'}), 401
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/api/auth/status')
def auth_status():
    if current_user.is_authenticated:
        return jsonify({'is_logged_in': True, 'username': current_user.username})
    return jsonify({'is_logged_in': False})

# --- Main Application Route ---
@app.route('/')
@login_required
def index():
    return render_template('index.html')

# --- API Routes for Expenses (CRUD) ---
@app.route('/api/expenses', methods=['POST'])
@login_required
def create_expense():
    data = request.get_json()
    try:
        new_expense = Expense(
            description=data['description'],
            category=ExpenseCategory[data['category'].upper()],
            base_amount=float(data['base_amount']),
            tax_rate=float(data['tax_rate']),
            is_recurring=bool(data['is_recurring']),
            user_id=current_user.id
        )
        db.session.add(new_expense)
        db.session.commit()
        return jsonify(new_expense.to_dict()), 201
    except (KeyError, ValueError) as e:
        return jsonify({'error': f'Invalid input data: {e}'}), 400

@app.route('/api/expenses', methods=['GET'])
@login_required
def get_expenses():
    page = request.args.get('page', 1, type=int)
    per_page = 5
    category_filter = request.args.get('category', None, type=str)
    query = Expense.query.filter_by(user_id=current_user.id)
    if category_filter:
        try:
            category_enum = ExpenseCategory[category_filter.upper()]
            query = query.filter_by(category=category_enum)
        except KeyError:
            return jsonify({'error': 'Invalid category filter'}), 400
    paginated_expenses = query.order_by(Expense.id.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'expenses': [expense.to_dict() for expense in paginated_expenses.items],
        'total_pages': paginated_expenses.pages,
        'current_page': paginated_expenses.page,
        'has_next': paginated_expenses.has_next,
        'has_prev': paginated_expenses.has_prev
    })

@app.route('/api/expenses/<int:expense_id>', methods=['PUT'])
@login_required
def update_expense(expense_id):
    expense = Expense.query.get_or_404(expense_id)
    if expense.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    try:
        expense.description = data.get('description', expense.description)
        expense.category = ExpenseCategory[data['category'].upper()]
        expense.base_amount = float(data.get('base_amount', expense.base_amount))
        expense.tax_rate = float(data.get('tax_rate', expense.tax_rate))
        expense.is_recurring = bool(data.get('is_recurring', expense.is_recurring))
        db.session.commit()
        return jsonify(expense.to_dict())
    except (KeyError, ValueError) as e:
        return jsonify({'error': f'Invalid input data: {e}'}), 400

@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
@login_required
def delete_expense(expense_id):
    expense = Expense.query.get_or_404(expense_id)
    if expense.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    db.session.delete(expense)
    db.session.commit()
    return jsonify({'message': 'Expense deleted successfully'})

# This block should always be at the very end of the file
if __name__ == '__main__':
    app.run(debug=True)

