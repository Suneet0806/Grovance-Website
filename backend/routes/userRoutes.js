const express = require("express");
const router = express.Router();
const pool = require("../db");

// REGISTER
router.post("/register", async (req, res) => {
    const { name, email, password, phone, college } = req.body;

    try {
        const newUser = await pool.query(
            "INSERT INTO users(name, email, password, phone, college) VALUES($1, $2, $3, $4, $5) RETURNING *",
            [name, email, password, phone, college]
        );
        res.json(newUser.rows[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// ✅ LOGIN — matches email + password + phone (simple auth since no passwords yet)
router.post("/login", async (req, res) => {
    const { email, password, phone } = req.body;

    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1 AND password = $2 AND phone = $3",
            [email, password, phone]
        );

        if (result.rows.length === 0) {
            return res.status(401).send("Invalid email, password, or phone number. Please check and try again.");
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;
