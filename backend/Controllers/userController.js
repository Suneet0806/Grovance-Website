const User = require("../models/User");

// REGISTER
exports.registerUser = async (req, res) => {
    try {
        const user = await User.create(req.body);
        res.status(201).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating user");
    }
};

// LOGIN
exports.loginUser = async (req, res) => {
    const { email, phone } = req.body;

    try {
        const user = await User.findOne({
            email,
            phone,
        });

        if (!user) {
            return res.status(401).send("Invalid email or phone number.");
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error logging in");
    }
};