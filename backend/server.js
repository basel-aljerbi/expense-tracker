const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

const allowedCategories = [
  "Food",
  "Transport",
  "Bills",
  "Entertainment",
  "Other"
];


// =========================
// Helpers
// =========================

function validateExpense({
  title,
  amount,
  category,
  date
}) {
  if (
    !title ||
    typeof title !== "string" ||
    title.trim() === ""
  ) {
    return "Title is required";
  }

  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount)
  ) {
    return "Amount must be a number";
  }

  if (amount <= 0) {
    return "Amount must be greater than 0";
  }

  if (!allowedCategories.includes(category)) {
    return "Invalid category";
  }

  if (!date || typeof date !== "string") {
    return "Date is required";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return "Invalid date";
  }

  return null;
}

function formatExpense(expense) {
  return {
    ...expense,
    amount: Number(expense.amount)
  };
}

function parseExpenseId(id) {
  const expenseId = Number(id);

  return Number.isInteger(expenseId)
    ? expenseId
    : null;
}


// =========================
// GET ALL EXPENSES
// =========================

app.get("/api/expenses", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, amount, category,
              TO_CHAR(date, 'YYYY-MM-DD') AS date
       FROM expenses
       ORDER BY id`
    );

    const expenses = result.rows.map(formatExpense);

    res.json(expenses);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


// =========================
// GET ONE EXPENSE
// =========================

app.get("/api/expenses/:id", async (req, res) => {
  try {
    const id = parseExpenseId(req.params.id);

    if (id === null) {
      return res.status(404).json({
        message: "Expense not found"
      });
    }

    const result = await pool.query(
      `SELECT id, title, amount, category,
              TO_CHAR(date, 'YYYY-MM-DD') AS date
       FROM expenses
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Expense not found"
      });
    }

    res.json(formatExpense(result.rows[0]));

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


// =========================
// CREATE EXPENSE
// =========================

app.post("/api/expenses", async (req, res) => {
  try {
    const {
      title,
      amount,
      category,
      date
    } = req.body;

    const validationError = validateExpense({
      title,
      amount,
      category,
      date
    });

    if (validationError) {
      return res.status(400).json({
        message: validationError
      });
    }

    const result = await pool.query(
      `INSERT INTO expenses (
         title,
         amount,
         category,
         date
       )
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, amount, category,
                 TO_CHAR(date, 'YYYY-MM-DD') AS date`,
      [
        title.trim(),
        amount,
        category,
        date
      ]
    );

    res.status(201).json(
      formatExpense(result.rows[0])
    );

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


// =========================
// UPDATE EXPENSE
// =========================

app.put("/api/expenses/:id", async (req, res) => {
  try {
    const id = parseExpenseId(req.params.id);

    if (id === null) {
      return res.status(404).json({
        message: "Expense not found"
      });
    }

    const {
      title,
      amount,
      category,
      date
    } = req.body;

    const validationError = validateExpense({
      title,
      amount,
      category,
      date
    });

    if (validationError) {
      return res.status(400).json({
        message: validationError
      });
    }

    const result = await pool.query(
      `UPDATE expenses
       SET title = $1,
           amount = $2,
           category = $3,
           date = $4
       WHERE id = $5
       RETURNING id, title, amount, category,
                 TO_CHAR(date, 'YYYY-MM-DD') AS date`,
      [
        title.trim(),
        amount,
        category,
        date,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Expense not found"
      });
    }

    res.json(
      formatExpense(result.rows[0])
    );

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


// =========================
// DELETE EXPENSE
// =========================

app.delete("/api/expenses/:id", async (req, res) => {
  try {
    const id = parseExpenseId(req.params.id);

    if (id === null) {
      return res.status(404).json({
        message: "Expense not found"
      });
    }

    const result = await pool.query(
      "DELETE FROM expenses WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Expense not found"
      });
    }

    res.json({
      message: "Expense deleted successfully"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


// =========================
// START SERVER
// =========================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});