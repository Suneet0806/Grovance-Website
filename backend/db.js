const { Pool } = require("pg");

// ✅ Reads directly from your .env variables
const pool = new Pool({
    user:     process.env.postgres,
    host:     process.env.DB_HOST || "localhost",
    database: process.env.grovance,
    password: process.env.suneet,
    port:     process.env.DB_PORT || 5432,
});

// Test connection on startup
pool.connect((err, client, release) => {
    if (err) {
        console.error("❌ Database connection failed:", err.message);
    } else {
        console.log("✅ Database connected successfully");
        release();
    }
});

module.exports = pool;
