# AI Integration Documentation

This document details the pivotal prompts directed to an AI assistant (Google Gemini) during the development of the **Expense Tracker** application. The interactions focused on foundational architecture, core backend and frontend features, and significant UI enhancements.

---

## 1. Initial Project Scaffolding and Architecture

**Context:**  
At the project's inception, a comprehensive plan was needed. I provided the assignment PDF and requested a complete project structure, setup instructions for a Flask application, and boilerplate code for all necessary files to establish a strong foundation.

**My Prompt:**  
> "Give the complete project structure, setup instructions (step by step) and code for each file and how to document everything (detailed instructions) for this assignment."

**AI Contribution:**  
The AI generated the entire project directory structure, a full `app.py` with database models and CRUD placeholders, initial HTML/CSS/JS templates, and a detailed step-by-step guide from project initialization to deployment. This output served as the architectural blueprint for the entire application.

---

## 2. Implementing a Calculated Field in the Database Model

**Context:**  
A core requirement was a calculated field derived from two other inputs. I needed the correct way to implement the `amount_with_tax` field in the Flask-SQLAlchemy `Expense` model so that it would be calculated automatically rather than stored in the database, ensuring data integrity.

**My Prompt:**  
> "In my Flask-SQLAlchemy Expense model, I have base_amount and tax_rate columns. Show me the best way to add a calculated amount_with_tax field that automatically computes base_amount * (1 + tax_rate) whenever the expense object is accessed."

**AI Contribution:**  
The AI recommended using the `@property` decorator in Python. It provided the exact code for the `amount_with_tax` method within the `Expense` class, which was a clean and efficient solution that perfectly met the assignment's requirement.

---

## 3. Backend Logic for Server-Side Pagination and Filtering

**Context:**  
To meet the data management requirements, the API needed to support pagination and filtering by category. I required the Flask-SQLAlchemy logic to modify the database query to handle these features efficiently on the server side.

**My Prompt:**  
> "Modify my /api/expenses GET route to include pagination. It should accept a 'page' query parameter, display 5 items per page, and handle filtering by an optional 'category' parameter. Show the full query and the structure of the JSON response, including total pages and current page number."

**AI Contribution:**  
The AI provided the complete implementation using SQLAlchemy's `.paginate()` method. It showed how to read query parameters using `request.args.get()`, dynamically build the query based on the category filter, and structure the final JSON response with all necessary pagination metadata (`total_pages`, `current_page`, `has_next`, etc.).

---

## 4. Major UI Overhaul for the Main Dashboard

**Context:**  
The initial UI was functional but lacked professional polish. I requested a significant visual upgrade for the dashboard, specifically asking to fix a checkbox layout issue, improve the overall aesthetic, and change the currency symbol from dollars to rupees.

**My Prompt:**  
> "Improve the UI, especially the 'Is Recurring' checkbox where the text is wrapping. Do an overall improvement in UI and frontend, and change the currency to Rupees instead of the dollar symbol."

**AI Contribution:**  
The AI generated a completely new, modern `styles.css` file using a professional color palette, improved typography with Google Fonts, and flexbox for layout. It provided updated HTML (`index.html`) with new class structures and a corrected JavaScript file (`app.js`) with the currency symbol changed to `'₹'`.

---

## 5. Redesigning the Login Page for Visual Consistency

**Context:**  
After the dashboard was redesigned, the original login page looked outdated and inconsistent. I needed a new login page that matched the modern, card-based aesthetic of the main application to create a cohesive user experience.

**My Prompt:**  
> "The login page UI needs to be improved now; it's broken after the new changes to the other files."

**AI Contribution:**  
The AI generated a completely new `login.html` file featuring a clean, centered card layout and a tabbed interface to switch between "Login" and "Register" forms. It also appended the necessary CSS to the `styles.css` file to support this new design.

---

## 6. Writing Asynchronous JavaScript to Render API Data

**Context:**  
To make the dashboard dynamic, I needed the client-side JavaScript code to fetch data from the backend API, handle the JSON response, and render the expenses into the HTML table without a page reload.

**My Prompt:**  
> "Provide the vanilla JavaScript code for an async function that fetches data from my /api/expenses endpoint. It needs to clear the existing table, loop through the returned expenses, dynamically create and append a new table row for each expense, and update the pagination controls."

**AI Contribution:**  
The AI generated the core `fetchExpenses` async function in `static/app.js`. This included using the `fetch` API, clearing the table body with `innerHTML = ''`, dynamically creating table rows with template literals, and calling other functions to update the pagination buttons based on the API response.

---

**End of Documentation**
