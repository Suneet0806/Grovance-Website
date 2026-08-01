require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test connection
(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Database connected successfully");
    client.release();
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
})();

module.exports = pool;