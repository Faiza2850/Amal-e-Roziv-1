// src/config/db.js
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "users_data",
});

const dbp = db.promise();

db.connect((err) => {
  if (err) {
    console.error("❌ Error connecting to MySQL:", err);
    process.exit(1);
  } else {
    console.log("✅ Connected to MySQL");
  }
});

module.exports = dbp;
