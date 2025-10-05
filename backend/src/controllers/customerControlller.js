// src/controllers/customerController.js
const dbp = require("../config/db");
const { uploadDir } = require("../config/multerConfig");

exports.registerCustomer = async (req, res) => {
  try {
    const { fullName, cnic, phone, city } = req.body;
    const cnicFront = req.files?.["cnicFront"]?.[0]?.filename || null;
    const cnicBack = req.files?.["cnicBack"]?.[0]?.filename || null;
    const profilepic = req.files?.["profilepic"]?.[0]?.filename || null;

    const sql = `INSERT INTO customers (fullName, cnic, phone, city, cnicFront, cnicBack, profilepic)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const [result] = await dbp.query(sql, [
      fullName,
      cnic,
      phone,
      city,
      cnicFront,
      cnicBack,
      profilepic,
    ]);

    res.status(201).json({ message: "✅ Customer registered", id: result.insertId });
  } catch (err) {
    console.error("❌ Customer insert error:", err);
    res.status(500).json({ error: "Failed to save customer data" });
  }
};
