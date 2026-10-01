const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cors());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});


// ===============================
// GET ALL EXPENSES
// ===============================
app.get("/api/expenses", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, amount, category,
              TO_CHAR(date, 'YYYY-MM-DD') AS date
       FROM expenses
       ORDER BY id`
    );

    const expenses = result.rows.map((expense) => ({
      ...expense,
      amount: Number(expense.amount)
    }));

    res.json(expenses);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


// ===============================
// GET ONE EXPENSE
// ===============================
app.get("/api/expenses/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
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

    const expense = {
      ...result.rows[0],
      amount: Number(result.rows[0].amount)
    };

    res.json(expense);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


// ===============================
// CREATE EXPENSE
// ===============================
app.post("/api/expenses", async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;


    // Validate title
    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({
        message: "Title is required"
      });
    }


    // Validate amount
    if (typeof amount !== "number" || !Number.isFinite(amount)) {
      return res.status(400).json({
        message: "Amount must be a number"
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0"
      });
    }


    // Validate category
    const allowedCategories = [
      "Food",
      "Transport",
      "Bills",
      "Entertainment",
      "Other"
    ];

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        message: "Invalid category"
      });
    }


    // Validate date
    if (!date || typeof date !== "string") {
      return res.status(400).json({
        message: "Date is required"
      });
    }

    // Make sure date is YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        message: "Invalid date"
      });
    }


    // Insert expense
    const result = await pool.query(
      `INSERT INTO expenses (title, amount, category, date)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, amount, category,
                 TO_CHAR(date, 'YYYY-MM-DD') AS date`,
      [title.trim(), amount, category, date]
    );


    const expense = {
      ...result.rows[0],
      amount: Number(result.rows[0].amount)
    };

    res.status(201).json(expense);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


// ===============================
// UPDATE EXPENSE
// ===============================
app.put("/api/expenses/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(404).json({
        message: "Expense not found"
      });
    }

    const { title, amount, category, date } = req.body;


    // Validate title
    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({
        message: "Title is required"
      });
    }


    // Validate amount
    if (typeof amount !== "number" || !Number.isFinite(amount)) {
      return res.status(400).json({
        message: "Amount must be a number"
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0"
      });
    }


    // Validate category
    const allowedCategories = [
      "Food",
      "Transport",
      "Bills",
      "Entertainment",
      "Other"
    ];

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        message: "Invalid category"
      });
    }


    // Validate date
    if (!date || typeof date !== "string") {
      return res.status(400).json({
        message: "Date is required"
      });
    }

    // Make sure date is YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        message: "Invalid date"
      });
    }


    // Update expense
    const result = await pool.query(
      `UPDATE expenses
       SET title = $1,
           amount = $2,
           category = $3,
           date = $4
       WHERE id = $5
       RETURNING id, title, amount, category,
                 TO_CHAR(date, 'YYYY-MM-DD') AS date`,
      [title.trim(), amount, category, date, id]
    );


    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Expense not found"
      });
    }


    const expense = {
      ...result.rows[0],
      amount: Number(result.rows[0].amount)
    };

    res.json(expense);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


// ===============================
// DELETE EXPENSE
// ===============================
app.delete("/api/expenses/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
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


// ===============================
// START SERVER
// ===============================
app.listen(3000, () => {
  console.log("Server running on port 3000");
});