# Architecture Documentation

This document outlines the architecture of the Expense Tracker application.

## 1. Technology Stack

- **Backend**: Flask (Python)
- **Database**: SQLite
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Deployment**: Render

**Architectural Decision**: I chose Flask because it is a lightweight and flexible framework, perfect for a small-scale application like this. SQLite was selected for its simplicity and file-based nature, eliminating the need for a separate database server. 
A minimal frontend without a heavy framework like React was used to keep the application simple and meet the requirements.

## 2. Database Schema

The application uses two main tables: `User` and `Expense`.

### `User` Table
Stores user credentials for authentication.

| Column        | Type      | Constraints       | Description                    |
|---------------|-----------|-------------------|--------------------------------|
| `id`          | Integer   | PRIMARY KEY       | Unique identifier for the user.  |
| `username`    | String(100) | UNIQUE, NOT NULL  | User's chosen username.          |
| `password_hash`| String(200) | NOT NULL        | Hashed password for security.    |

### `Expense` Table
Stores individual expense records, linked to a user.

| Column           | Type      | Constraints               | Description                                           |
|------------------|-----------|---------------------------|-------------------------------------------------------|
| `id`             | Integer   | PRIMARY KEY               | Unique identifier for the expense.                    |
| `description`    | String(200)| NOT NULL                  | **Text field**: What the expense was for.               |
| `category`       | Enum      | NOT NULL                  | **Enum field**: Category of the expense.                |
| `is_recurring`   | Boolean   | NOT NULL, default=FALSE   | **Boolean field**: If the expense repeats.            |
| `base_amount`    | Float     | NOT NULL                  | The cost before tax.                                  |
| `tax_rate`       | Float     | NOT NULL                  | The tax rate (e.g., 0.05 for 5%).                     |
| `user_id`        | Integer   | FOREIGN KEY (User.id)     | Links the expense to a user.                          |

**Calculated Field (`amount_with_tax`)**: This field is not stored in the database. 
It is calculated on-the-fly in the `Expense` model (`base_amount * (1 + tax_rate)`) to ensure data is always accurate[cite: 28].

## 3. Class/Module Breakdown

- **`app.py`**: The main application file. It handles:
  - Flask app initialization.
  - Database model definitions (`User`, `Expense`).
  - All API routes for authentication and CRUD operations.
  - Serving the frontend HTML files.
- **`static/app.js`**: Contains all frontend JavaScript logic, including API calls (fetch), DOM manipulation, and event handling for the main dashboard.
- **`templates/`**: Contains the HTML files (`login.html`, `index.html`) that form the structure of the UI.