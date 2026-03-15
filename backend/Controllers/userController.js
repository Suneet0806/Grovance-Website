const pool = require("../db");

// REGISTER
exports.registerUser = async (req, res) => {
    const { name, email, phone, college } = req.body;

    try {
        const result = await pool.query(
            "INSERT INTO users(name, email, phone, college) VALUES($1, $2, $3, $4) RETURNING *",
            [name, email, phone, college]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating user");
    }
};

// LOGIN
exports.loginUser = async (req, res) => {
    const { email, phone } = req.body;

    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1 AND phone = $2",
            [email, phone]
        );

        if (result.rows.length === 0) {
            return res.status(401).send("Invalid email or phone number.");
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error logging in");
    }
};
