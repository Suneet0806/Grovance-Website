const { Pool } = require("pg");

const useSsl = process.env.DB_SSL === "true";

const pool = new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "db.tyvtrwifjwkmvctdeawr.supabase.co",
    database: process.env.DB_NAME || "postgres",
    password: process.env.DB_PASS,
    port: Number(process.env.DB_PORT) || 5432,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
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