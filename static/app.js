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
        const res = await fetch('/api/auth/status');
        const data = await res.json();
        if (data.is_logged_in) {
            welcomeUser.textContent = `Welcome, ${data.username}!`;
            fetchExpenses();
        } else {
            window.location.href = '/login';
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
        expenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${expense.description}</td>
                <td>${expense.category}</td>
                <td>$${expense.base_amount.toFixed(2)}</td>
                <td>${(expense.tax_rate * 100).toFixed(1)}%</td>
                <td>$${expense.amount_with_tax.toFixed(2)}</td>
                <td>${expense.is_recurring ? 'Yes' : 'No'}</td>
                <td>
                    <button onclick="editExpense(${expense.id},'${expense.description}','${expense.category}',${expense.base_amount},${expense.tax_rate},${expense.is_recurring})">Edit</button>
                    <button onclick="deleteExpense(${expense.id})">Delete</button>
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
    };

    window.deleteExpense = async (id) => {
        if (confirm('Are you sure you want to delete this expense?')) {
            const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
            if (res.ok) fetchExpenses();
        }
    };
    
    const resetForm = () => {
        expenseForm.reset();
        expenseIdInput.value = '';
        formTitle.textContent = 'Add New Expense';
        cancelEditBtn.classList.add('hidden');
    };
    
    cancelEditBtn.addEventListener('click', resetForm);

    prevPageBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; fetchExpenses(); } });
    nextPageBtn.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; fetchExpenses(); } });
    categoryFilter.addEventListener('change', () => { currentPage = 1; fetchExpenses(); });

    checkAuth();
});