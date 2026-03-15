const express = require("express");
const router  = express.Router();
const pool    = require("../db");

// POST /api/users/register
router.post("/register", async (req, res) => {
    const { name, email, phone, college } = req.body;

    if (!name || !email || !phone || !college) {
        return res.status(400).send("All fields are required.");
    }

    try {
        // Check for duplicate email
        const existing = await pool.query(
            "SELECT id FROM users WHERE email = $1", [email]
        );
        if (existing.rows.length > 0) {
            return res.status(409).send("An account with this email already exists. Please login instead.");
        }

        const result = await pool.query(
            "INSERT INTO users(name, email, phone, college) VALUES($1,$2,$3,$4) RETURNING *",
            [name, email, phone, college]
        );
        res.json(result.rows[0]);

    } catch (err) {
        console.error("Register error:", err.message);
        // ✅ Send a clear message — not a raw DB error
        if (err.message.includes("connect") || err.message.includes("ECONNREFUSED")) {
            return res.status(500).send("Database not connected. Check Render environment variables.");
        }
        res.status(500).send("Registration failed: " + err.message);
    }
});

// POST /api/users/login
router.post("/login", async (req, res) => {
    const { email, phone } = req.body;

    if (!email || !phone) {
        return res.status(400).send("Email and phone are required.");
    }

    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1 AND phone = $2",
            [email, phone]
        );
        if (result.rows.length === 0) {
            return res.status(401).send("No account found. Check your email and phone number.");
        }
        res.json(result.rows[0]);

    } catch (err) {
        console.error("Login error:", err.message);
        if (err.message.includes("connect") || err.message.includes("ECONNREFUSED")) {
            return res.status(500).send("Database not connected. Check Render environment variables.");
        }
        res.status(500).send("Login failed: " + err.message);
    }
});

module.exports = router;
