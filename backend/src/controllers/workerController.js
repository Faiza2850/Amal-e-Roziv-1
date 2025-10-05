// src/controllers/workerController.js
const dbp = require("../config/db");
const { ALLOWED_FILE_FIELDS } = require("../utils/constants");
const path = require("path");
const fs = require("fs");
const { uploadDir } = require("../config/multerConfig");

exports.registerWorker = async (req, res) => {
  try {
    const { fullName, cnic, phone, city, skill, availableHours, about } = req.body;
    const files = req.files || {};

    const sql = `
      INSERT INTO workers 
      (fullName, cnic, phone, city, skill, availableHours, about, cnicFront, cnicBack, profilePic, workCert, license, licenseBack, worker_form_completed) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await dbp.query(sql, [
      fullName,
      cnic,
      phone,
      city,
      skill,
      availableHours,
      about || null,
      files["cnicFront"]?.[0]?.filename || null,
      files["cnicBack"]?.[0]?.filename || null,
      files["profilePic"]?.[0]?.filename || null,
      files["workCert"]?.[0]?.filename || null,
      files["license"]?.[0]?.filename || null,
      files["licenseBack"]?.[0]?.filename || null,
      true,
    ]);

    res.json({ success: true, workerId: result.insertId });
  } catch (err) {
    console.error("❌ Worker insert error:", err);
    res.status(500).json({ error: "Error saving worker data" });
  }
};

// Other worker-related functions (get profile, update docs, delete docs, status) → move here as separate exports
