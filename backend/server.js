// index.js
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt"); // ✅ Added
const authRoutes = require("./src/routes/authRoutes");
const app = express();

app.use(cors());
app.use(bodyParser.json());
dotenv.config();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

// --- SIGN UP ---
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
        return res.status(400).json({ error: 'All fields are required' });

    try {
        const [existing] = await dbp.query(
            'SELECT * FROM workerlogin WHERE email = ?',
            [email]
        );
        if (existing.length)
            return res.status(400).json({ error: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await dbp.query(
            'INSERT INTO workerlogin (fullName, email, password, method) VALUES (?, ?, ?, "local")',
            [name, email, hashedPassword]
        );

        res.json({ message: 'Sign up successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- LOGIN ---
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: 'Email & password required' });

    try {
        const [rows] = await dbp.query(
            'SELECT * FROM workerlogin WHERE email = ?',
            [email]
        );
        if (!rows.length) return res.status(400).json({ error: 'User not found' });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: 'Incorrect password' });

        res.json({
            message: 'Login successful',
            user: { id: user.id, name: user.fullName, email: user.email },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- GOOGLE AUTH ---
app.post('/google-auth', async (req, res) => {
    const { email, name } = req.body;
    try {
        const [rows] = await dbp.query(
            'SELECT * FROM workerlogin WHERE email = ?',
            [email]
        );
        if (rows.length) {
            return res.json({ message: 'Google login successful', user: rows[0] });
        } else {
            await dbp.query(
                'INSERT INTO workerlogin (fullName, email, method) VALUES (?, ?, "google")',
                [name, email]
            );
            const [newUser] = await dbp.query(
                'SELECT * FROM workerlogin WHERE email = ?',
                [email]
            );
            return res.json({ message: 'Google sign up successful', user: newUser[0] });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use("/uploads", express.static(uploadDir));

// ================= MySQL Connection =================
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "users_data",
});

// use promise wrapper for async/await
const dbp = db.promise();

db.connect((err) => {
  if (err) {
    console.error("❌ Error connecting to MySQL:", err);
    process.exit(1);
  } else {
    console.log("✅ Connected to MySQL");
  }
});

// ================= Multer Setup =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    const uniqueName = `${Date.now()}-${basename}${ext}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

const ALLOWED_FILE_FIELDS = [
  "profilePic",
  "cnicFront",
  "cnicBack",
  "workCert",
  "license",
  "licenseBack",
];

// ================== Customer Registration ==================
app.post(
  "/api/profile",
  upload.fields([
    { name: "cnicFront", maxCount: 1 },
    { name: "cnicBack", maxCount: 1 },
    { name: "profilepic", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { fullName, cnic, phone, city } = req.body;

      const cnicFront = req.files?.["cnicFront"]?.[0]?.filename || null;
      const cnicBack = req.files?.["cnicBack"]?.[0]?.filename || null;
      const profilepic = req.files?.["profilepic"]?.[0]?.filename || null;

      const sql = `INSERT INTO customers (fullName, cnic, phone, city, cnicFront, cnicBack, profilepic)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;

      const [result] = await dbp.query(sql, [fullName, cnic, phone, city, cnicFront, cnicBack, profilepic]);

      res.status(201).json({
        message: "✅ Customer data saved successfully!",
        id: result.insertId,
      });
    } catch (err) {
      console.error("❌ Insert customer error:", err);
      res.status(500).json({ error: "Failed to save customer data" });
    }
  }
);

// ================== Worker Registration ==================
app.post(
  "/api/worker",
  upload.fields([
    { name: "cnicFront", maxCount: 1 },
    { name: "cnicBack", maxCount: 1 },
    { name: "profilePic", maxCount: 1 },
    { name: "workCert", maxCount: 1 },
    { name: "license", maxCount: 1 },
    { name: "licenseBack", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { fullName, cnic, phone, city, skill, availableHours, about } = req.body;
      const files = req.files || {};

      const cnicFront = files["cnicFront"]?.[0]?.filename || null;
      const cnicBack = files["cnicBack"]?.[0]?.filename || null;
      const profilePic = files["profilePic"]?.[0]?.filename || null;
      const workCert = files["workCert"]?.[0]?.filename || null;
      const license = files["license"]?.[0]?.filename || null;
      const licenseBack = files["licenseBack"]?.[0]?.filename || null;

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
        cnicFront,
        cnicBack,
        profilePic,
        workCert,
        license,
        licenseBack,
        true,
      ]);

      res.json({ success: true, workerId: result.insertId });
    } catch (err) {
      console.error("❌ Worker insert error:", err);
      res.status(500).json({ error: "Error saving worker data" });
    }
  }
);

// ================== Get Worker Full Profile ==================
const handleSubmit = async (e) => {
  e.preventDefault();
  const validationErrors = validate();
  setErrors(validationErrors);

  if (Object.keys(validationErrors).length === 0) {
    const basicInfo = JSON.parse(localStorage.getItem("workerInfo"));
    const formData = new FormData();

    // Add basic info
    Object.entries(basicInfo).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // Add files
    Object.entries(files).forEach(([key, file]) => {
      if (file) formData.append(key, file);
    });

   try {
  const response = await axios.post(
    "http://localhost:5000/api/worker",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  alert("Form submitted successfully!");
  console.log("Server response:", response.data);

  // ✅ Save workerId for later use
  localStorage.setItem("workerId", response.data.workerId);

  localStorage.removeItem("workerInfo");

  // ✅ Navigate to worker profile/dashboard
  navigate(`/workers/${response.data.workerId}`);
} catch (error) {
  console.error("Error submitting form:", error);
  alert("Something went wrong while submitting!");
}

  }
};


// ================== Update/Upload single document for worker ==================
// Usage: PUT /api/worker/:id/documents?field=profilePic
// multipart form-data with key "file"
app.put(
  "/api/worker/:id/documents",
  upload.single("file"),
  async (req, res) => {
    const { id } = req.params;
    const { field } = req.query;
    const file = req.file;

    if (!field || !ALLOWED_FILE_FIELDS.includes(field)) {
      // delete uploaded temp file if field invalid
      if (file) fs.unlinkSync(path.join(uploadDir, file.filename));
      return res.status(400).json({
        error: `Invalid or missing 'field' query. Allowed: ${ALLOWED_FILE_FIELDS.join(
          ", "
        )}`,
      });
    }

    if (!file) return res.status(400).json({ error: "No file uploaded (use form field 'file')" });

    try {
      // get existing filename (to delete)
      const [rows] = await dbp.query(`SELECT ${field} FROM workers WHERE id = ?`, [id]);
      if (rows.length === 0) {
        // remove uploaded file because worker doesn't exist
        fs.unlinkSync(path.join(uploadDir, file.filename));
        return res.status(404).json({ error: "Worker not found" });
      }

      const existingFilename = rows[0][field];

      // Update DB with new filename
      await dbp.query(`UPDATE workers SET ${field} = ? WHERE id = ?`, [file.filename, id]);

      // Delete previous file from disk if exists
      if (existingFilename) {
        const existingPath = path.join(uploadDir, existingFilename);
        if (fs.existsSync(existingPath)) {
          fs.unlink(existingPath, (err) => {
            if (err) console.warn("⚠ Failed to delete old file:", err);
          });
        }
      }

      res.json({
        message: "Document updated successfully",
        fileUrl: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
      });
    } catch (err) {
      console.error("❌ Error updating document:", err);
      // cleanup uploaded file on error
      if (file && fs.existsSync(path.join(uploadDir, file.filename))) {
        fs.unlinkSync(path.join(uploadDir, file.filename));
      }
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ================== Delete document for worker ==================
// Usage: DELETE /api/worker/:id/documents?field=profilePic
app.delete("/api/worker/:id/documents", async (req, res) => {
  const { id } = req.params;
  const { field } = req.query;

  if (!field || !ALLOWED_FILE_FIELDS.includes(field)) {
    return res.status(400).json({
      error: `Invalid or missing 'field' query. Allowed: ${ALLOWED_FILE_FIELDS.join(", ")}`,
    });
  }

  try {
    const [rows] = await dbp.query(`SELECT ${field} FROM workers WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Worker not found" });

    const existingFilename = rows[0][field];
    if (!existingFilename) return res.status(400).json({ error: "No file to delete for this field" });

    // Remove DB reference
    await dbp.query(`UPDATE workers SET ${field} = NULL WHERE id = ?`, [id]);

    // Delete file from disk
    const existingPath = path.join(uploadDir, existingFilename);
    if (fs.existsSync(existingPath)) {
      fs.unlink(existingPath, (err) => {
        if (err) {
          console.warn("⚠ Failed to delete file from disk:", err);
        }
      });
    }

    res.json({ message: "File deleted and DB updated" });
  } catch (err) {
    console.error("❌ Error deleting document:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================== Worker status route (kept) ==================
app.get("/api/worker/:id/status", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await dbp.query("SELECT worker_form_completed FROM workers WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).send("Worker not found");
    res.json({ formCompleted: rows[0].worker_form_completed });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error checking form status");
  }
});

//fetch data from profile page for each  worker
app.get("/api/worker/:id", async (req, res) => {
  const workerId = req.params.id;
  try {
    const [rows] = await dbp.query("SELECT * FROM workers WHERE id = ?", [workerId]); // ✅ fixed

    if (rows.length === 0) {
      return res.status(404).json({ error: "Worker not found" });
    }

    const worker = rows[0];

    // Convert file names to full URLs if needed
    ALLOWED_FILE_FIELDS.forEach((f) => {
      worker[f] = worker[f] ? `${req.protocol}://${req.get("host")}/uploads/${worker[f]}` : null;
    });

    res.json(worker);
  } catch (err) {
    console.error("❌ Error fetching worker:", err);
    res.status(500).json({ error: "Server error" });
  }
});




// ================== Default Route ==================
app.get("/", (req, res) => {
  res.send("🚀 Amal-e-Rozi API is running...");
});

// ================== Start Server ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
