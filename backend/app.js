// src/app.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const routes = require("./routes");
const path = require("path");
const { uploadDir } = require("./config/multerConfig");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static(uploadDir));
app.use(routes);

app.get("/", (req, res) => res.send("🚀 Amal-e-Rozi API is running..."));

module.exports = app;
