document.addEventListener('DOMContentLoaded', () => {
    const expenseForm = document.getElementById('expense-form');
    const expenseTableBody = document.getElementById('expense-table-body');
    const formTitle = document.getElementById('form-title');
    const expenseIdInput = document.getElementById('expense-id');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const welcomeUser = document.getElementById('welcome-user');

    // Pagination elements
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    let currentPage = 1;
    let totalPages = 1;

    // Filter element
    const categoryFilter = document.getElementById('category-filter');

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/status');
            if (!res.ok) throw new Error('Auth check failed');
            const data = await res.json();
            if (data.is_logged_in) {
                welcomeUser.textContent = `Welcome, ${data.username}!`;
                fetchExpenses();
            } else {
                window.location.href = '/login';
            }
        } catch (error) {
            console.error("Authentication check failed:", error);
            // Optionally redirect to login or show an error message
            // window.location.href = '/login'; 
        }
    };

    const fetchExpenses = async () => {
        const category = categoryFilter.value;
        let url = `/api/expenses?page=${currentPage}`;
        if (category) {
            url += `&category=${category}`;
        }

        const res = await fetch(url);
        if (!res.ok) { console.error("Failed to fetch expenses"); return; }
        const data = await res.json();
        
        renderExpenses(data.expenses);
        updatePagination(data);
    };

    const renderExpenses = (expenses) => {
        expenseTableBody.innerHTML = '';
        if (expenses.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 7;
            cell.textContent = 'No expenses found. Add one above!';
            cell.style.textAlign = 'center';
            row.appendChild(cell);
            expenseTableBody.appendChild(row);
            return;
        }
        expenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHTML(expense.description)}</td>
                <td>${escapeHTML(expense.category)}</td>
                <td>₹${expense.base_amount.toFixed(2)}</td>
                <td>${(expense.tax_rate * 100).toFixed(1)}%</td>
                <td>₹${expense.amount_with_tax.toFixed(2)}</td>
                <td>${expense.is_recurring ? 'Yes' : 'No'}</td>
                <td class="action-buttons">
                    <button class="edit-btn" onclick="editExpense(${expense.id},'${escapeHTML(expense.description)}','${escapeHTML(expense.category)}',${expense.base_amount},${expense.tax_rate},${expense.is_recurring})">Edit</button>
                    <button class="delete-btn" onclick="deleteExpense(${expense.id})">Delete</button>
                </td>
            `;
            expenseTableBody.appendChild(row);
        });
    };

    const updatePagination = (data) => {
        currentPage = data.current_page;
        totalPages = data.total_pages;
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevPageBtn.disabled = !data.has_prev;
        nextPageBtn.disabled = !data.has_next;
    };

    expenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = expenseIdInput.value;
        const expenseData = {
            description: document.getElementById('description').value,
            category: document.getElementById('category').value,
            base_amount: document.getElementById('base_amount').value,
            tax_rate: document.getElementById('tax_rate').value,
            is_recurring: document.getElementById('is_recurring').checked
        };

        if (!expenseData.category) {
            alert('Please select a category.');
            return;
        }

        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/expenses/${id}` : '/api/expenses';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expenseData)
        });

        if (res.ok) {
            resetForm();
            fetchExpenses();
        } else {
            const error = await res.json();
            alert(`Error: ${error.error}`);
        }
    });

    window.editExpense = (id, desc, cat, base, tax, recur) => {
        formTitle.textContent = 'Edit Expense';
        expenseIdInput.value = id;
        document.getElementById('description').value = desc;
        document.getElementById('category').value = cat;
        document.getElementById('base_amount').value = base;
        document.getElementById('tax_rate').value = tax;
        document.getElementById('is_recurring').checked = recur;
        cancelEditBtn.classList.remove('hidden');
        window.scrollTo(0, 0); // Scroll to top to see the form
    };

    window.deleteExpense = async (id) => {
        if (confirm('Are you sure you want to delete this expense?')) {
            const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
            if (res.ok) {
                // If the last item on a page is deleted, go to the previous page
                if (expenseTableBody.rows.length === 1 && currentPage > 1) {
                    currentPage--;
                }
                fetchExpenses();
            }
        }
    };
    
    const resetForm = () => {
        expenseForm.reset();
        document.getElementById('category').value = ""; // Ensure placeholder is shown
        expenseIdInput.value = '';
        formTitle.textContent = 'Add New Expense';
        cancelEditBtn.classList.add('hidden');
    };
    
    // Simple HTML escaping function to prevent XSS
    const escapeHTML = (str) => {
        const p = document.createElement('p');
        p.textContent = str;
        return p.innerHTML;
    };
    
    cancelEditBtn.addEventListener('click', resetForm);

    prevPageBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; fetchExpenses(); } });
    nextPageBtn.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; fetchExpenses(); } });
    categoryFilter.addEventListener('change', () => { currentPage = 1; fetchExpenses(); });

    checkAuth();
});
