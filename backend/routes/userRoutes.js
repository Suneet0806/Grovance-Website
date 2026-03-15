const express = require("express");
const router = express.Router();
const pool = require("../db");

// REGISTER
router.post("/register", async (req, res) => {
    const { name, email, phone, college } = req.body;

    try {
        const newUser = await pool.query(
            "INSERT INTO users(name, email, phone, college) VALUES($1, $2, $3, $4) RETURNING *",
            [name, email, phone, college]
        );
        res.json(newUser.rows[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// ✅ LOGIN — matches email + phone (simple auth since no passwords yet)
router.post("/login", async (req, res) => {
    const { email, phone } = req.body;

    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1 AND phone = $2",
            [email, phone]
        );

        if (result.rows.length === 0) {
            return res.status(401).send("Invalid email or phone number. Please check and try again.");
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;
