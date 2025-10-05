// routes/authRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db.js");
const { OAuth2Client } = require("google-auth-library");

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Signup
router.post("/signup", (req, res) => {
  const { name, email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (result.length > 0) return res.status(400).json({ msg: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashed],
      (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ msg: "User created successfully" });
      }
    );
  });
});

// Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (result.length === 0) return res.status(400).json({ msg: "User not found" });

    const valid = await bcrypt.compare(password, result[0].password);
    if (!valid) return res.status(400).json({ msg: "Invalid password" });

    const token = jwt.sign({ id: result[0].id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user: result[0] });
  });
});

// Google login
router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    db.query("SELECT * FROM users WHERE google_id = ?", [sub], (err, result) => {
      if (result.length > 0) {
        return res.json({ user: result[0] });
      } else {
        db.query(
          "INSERT INTO users (google_id, email, name, picture) VALUES (?, ?, ?, ?)",
          [sub, email, name, picture],
          (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ user: { id: result.insertId, email, name, picture } });
          }
        );
      }
    });
  } catch (err) {
    res.status(400).json({ msg: "Invalid Google token" });
  }
});

module.exports = router;  // ✅ CommonJS export
