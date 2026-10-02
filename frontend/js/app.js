// Expense Tracker - frontend logic

const API_URL = "http://localhost:3000/api/expenses";

let expenses = [];
let expenseChart = null;


// =========================
// DOM Elements
// =========================

const expensesTableBody =
  document.getElementById("expensesTableBody");

const totalAmount =
  document.getElementById("totalAmount");

const expenseCount =
  document.getElementById("expenseCount");

const highestExpense =
  document.getElementById("highestExpense");

const loadingSpinner =
  document.getElementById("loadingSpinner");

const alertContainer =
  document.getElementById("alertContainer");

const categoryFilter =
  document.getElementById("categoryFilter");

const searchInput =
  document.getElementById("searchInput");

const expenseChartCanvas =
  document.getElementById("expenseChart");

const themeToggle =
  document.getElementById("themeToggle");

const exportCsvBtn =
  document.getElementById("exportCsvBtn");

const expenseForm =
  document.getElementById("expenseForm");

const editExpenseForm =
  document.getElementById("editExpenseForm");

const editExpenseModalElement =
  document.getElementById("editExpenseModal");

const editExpenseModal =
  new bootstrap.Modal(editExpenseModalElement);


// =========================
// UI Helpers
// =========================

function showSpinner() {
  loadingSpinner.classList.remove("d-none");
}

function hideSpinner() {
  loadingSpinner.classList.add("d-none");
}

function showAlert(message, type = "danger") {
  alertContainer.innerHTML = `
    <div
      class="alert alert-${type} alert-dismissible fade show"
      role="alert"
    >
      ${message}

      <button
        type="button"
        class="btn-close"
        data-bs-dismiss="alert"
        aria-label="Close"
      ></button>
    </div>
  `;

  setTimeout(() => {
    const alert = alertContainer.querySelector(".alert");

    if (alert) {
      alert.classList.remove("show");

      setTimeout(() => {
        alert.remove();
      }, 150);
    }
  }, 3000);
}


// =========================
// API
// =========================

async function getExpenses() {
  try {
    showSpinner();

    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Failed to fetch expenses");
    }

    return await response.json();

  } catch (error) {
    showAlert("Failed to load expenses.");
    console.error(error);

    return [];

  } finally {
    hideSpinner();
  }
}


// =========================
// Rendering
// =========================

function renderTable(list) {
  expensesTableBody.innerHTML = "";

  if (list.length === 0) {
    expensesTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center">
          No expenses found.
        </td>
      </tr>
    `;

    return;
  }

  list.forEach((expense) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${expense.title}</td>

      <td>
        $${Number(expense.amount).toFixed(2)}
      </td>

      <td>${expense.category}</td>

      <td>${expense.date}</td>

      <td>
        <button
          class="btn btn-sm btn-warning me-1 edit-btn"
          data-id="${expense.id}"
          title="Edit expense"
        >
          <i class="bi bi-pencil"></i>
          Edit
        </button>

        <button
          class="btn btn-sm btn-danger delete-btn"
          data-id="${expense.id}"
          title="Delete expense"
        >
          <i class="bi bi-trash"></i>
          Delete
        </button>
      </td>
    `;

    expensesTableBody.appendChild(row);
  });
}


function renderSummary(list) {
  const total = list.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  const count = list.length;

  const highest =
    list.length > 0
      ? Math.max(
          ...list.map((expense) => Number(expense.amount))
        )
      : 0;

  totalAmount.textContent =
    `$${total.toFixed(2)}`;

  expenseCount.textContent = count;

  highestExpense.textContent =
    `$${highest.toFixed(2)}`;
}


function renderChart(list) {
  const categoryTotals = {
    Food: 0,
    Transport: 0,
    Bills: 0,
    Entertainment: 0,
    Other: 0
  };

  list.forEach((expense) => {
    const amount = Number(expense.amount);

    if (categoryTotals[expense.category] !== undefined) {
      categoryTotals[expense.category] += amount;
    }
  });

  const labels = Object.keys(categoryTotals);
  const values = Object.values(categoryTotals);

  if (expenseChart) {
    expenseChart.destroy();
  }

  expenseChart = new Chart(expenseChartCanvas, {
    type: "doughnut",

    data: {
      labels,

      datasets: [
        {
          label: "Expenses",
          data: values
        }
      ]
    },

    options: {
      responsive: true,

      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}


// =========================
// Search & Filter
// =========================

function getFilteredExpenses() {
  const selectedCategory =
    categoryFilter.value;

  const searchTerm =
    searchInput.value.trim().toLowerCase();

  return expenses.filter((expense) => {
    const matchesCategory =
      selectedCategory === "All" ||
      expense.category === selectedCategory;

    const matchesSearch =
      expense.title
        .toLowerCase()
        .includes(searchTerm) ||
      expense.category
        .toLowerCase()
        .includes(searchTerm);

    return matchesCategory && matchesSearch;
  });
}


function applyFilters() {
  const filteredExpenses =
    getFilteredExpenses();

  renderTable(filteredExpenses);
  renderSummary(filteredExpenses);
  renderChart(filteredExpenses);
}

categoryFilter.addEventListener(
  "change",
  applyFilters
);

searchInput.addEventListener(
  "input",
  applyFilters
);


// =========================
// Refresh
// =========================

async function refresh() {
  expenses = await getExpenses();

  renderTable(expenses);
  renderSummary(expenses);
  renderChart(expenses);
}


// =========================
// Delete Expense
// =========================

async function deleteExpense(id) {
  const confirmed = confirm(
    "Are you sure you want to delete this expense?"
  );

  if (!confirmed) {
    return;
  }

  try {
    showSpinner();

    const response = await fetch(
      `${API_URL}/${id}`,
      {
        method: "DELETE"
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to delete expense"
      );
    }

    showAlert(
      "Expense deleted successfully.",
      "success"
    );

    await refresh();

  } catch (error) {
    showAlert(error.message);
    console.error(error);

  } finally {
    hideSpinner();
  }
}


// =========================
// Edit & Delete Table Actions
// =========================

expensesTableBody.addEventListener(
  "click",
  (event) => {
    const button =
      event.target.closest("button");

    if (!button) {
      return;
    }

    const id =
      Number(button.dataset.id);

    if (button.classList.contains("delete-btn")) {
      deleteExpense(id);
      return;
    }

    if (button.classList.contains("edit-btn")) {
      const expense = expenses.find(
        (expense) => expense.id === id
      );

      if (!expense) {
        showAlert("Expense not found.");
        return;
      }

      document.getElementById(
        "editExpenseId"
      ).value = expense.id;

      document.getElementById(
        "editTitle"
      ).value = expense.title;

      document.getElementById(
        "editAmount"
      ).value = expense.amount;

      document.getElementById(
        "editCategory"
      ).value = expense.category;

      document.getElementById(
        "editDate"
      ).value = expense.date;

      editExpenseModal.show();
    }
  }
);


// =========================
// Update Expense
// =========================

editExpenseForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    const id =
      document.getElementById(
        "editExpenseId"
      ).value;

    const title =
      document.getElementById(
        "editTitle"
      ).value.trim();

    const amount =
      Number(
        document.getElementById(
          "editAmount"
        ).value
      );

    const category =
      document.getElementById(
        "editCategory"
      ).value;

    const date =
      document.getElementById(
        "editDate"
      ).value;

    if (!title) {
      showAlert("Title is required.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      showAlert("Amount must be greater than 0.");
      return;
    }

    if (!category) {
      showAlert("Category is required.");
      return;
    }

    if (!date) {
      showAlert("Date is required.");
      return;
    }

    try {
      showSpinner();

      const response = await fetch(
        `${API_URL}/${id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            title,
            amount,
            category,
            date
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to update expense"
        );
      }

      editExpenseModal.hide();

      showAlert(
        "Expense updated successfully.",
        "success"
      );

      await refresh();

    } catch (error) {
      showAlert(error.message);
      console.error(error);

    } finally {
      hideSpinner();
    }
  }
);


// =========================
// Add Expense
// =========================

expenseForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    const title =
      document.getElementById(
        "title"
      ).value.trim();

    const amount =
      Number(
        document.getElementById(
          "amount"
        ).value
      );

    const category =
      document.getElementById(
        "category"
      ).value;

    const date =
      document.getElementById(
        "date"
      ).value;

    if (!title) {
      showAlert("Title is required.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      showAlert("Amount must be greater than 0.");
      return;
    }

    if (!category) {
      showAlert("Category is required.");
      return;
    }

    if (!date) {
      showAlert("Date is required.");
      return;
    }

    try {
      showSpinner();

      const response =
        await fetch(API_URL, {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            title,
            amount,
            category,
            date
          })
        });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to add expense"
        );
      }

      showAlert(
        "Expense added successfully.",
        "success"
      );

      expenseForm.reset();

      await refresh();

    } catch (error) {
      showAlert(error.message);
      console.error(error);

    } finally {
      hideSpinner();
    }
  }
);


// =========================
// Export CSV
// =========================

function exportToCSV(list) {
  if (list.length === 0) {
    showAlert(
      "There are no expenses to export."
    );

    return;
  }

  const headers = [
    "ID",
    "Title",
    "Amount",
    "Category",
    "Date"
  ];

  const rows = list.map((expense) => [
    expense.id,
    `"${expense.title.replace(/"/g, '""')}"`,
    Number(expense.amount).toFixed(2),
    `"${expense.category.replace(/"/g, '""')}"`,
    `"${expense.date}"`
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(","))
  ].join("\n");

  const blob = new Blob(
    [csvContent],
    {
      type: "text/csv;charset=utf-8;"
    }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = "expenses.csv";

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);

  showAlert(
    "Expenses exported successfully.",
    "success"
  );
}


exportCsvBtn.addEventListener(
  "click",
  () => {
    const filteredExpenses =
      getFilteredExpenses();

    exportToCSV(filteredExpenses);
  }
);


// =========================
// Dark Mode
// =========================

function updateThemeIcon() {
  const isDarkMode =
    document.body.classList.contains(
      "dark-mode"
    );

  themeToggle.innerHTML = isDarkMode
    ? '<i class="bi bi-sun-fill"></i>'
    : '<i class="bi bi-moon-fill"></i>';
}


function applySavedTheme() {
  const savedTheme =
    localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add(
      "dark-mode"
    );
  }

  updateThemeIcon();
}


themeToggle.addEventListener(
  "click",
  () => {
    document.body.classList.toggle(
      "dark-mode"
    );

    const isDarkMode =
      document.body.classList.contains(
        "dark-mode"
      );

    localStorage.setItem(
      "theme",
      isDarkMode ? "dark" : "light"
    );

    updateThemeIcon();
  }
);


// =========================
// Initialization
// =========================

applySavedTheme();
refresh();