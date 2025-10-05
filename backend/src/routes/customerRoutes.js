// src/routes/customerRoutes.js
const express = require("express");
const router = express.Router();
const { upload } = require("../config/multerConfig");
const { registerCustomer } = require("../controllers/customerController");

router.post(
  "/profile",
  upload.fields([
    { name: "cnicFront", maxCount: 1 },
    { name: "cnicBack", maxCount: 1 },
    { name: "profilepic", maxCount: 1 },
  ]),
  registerCustomer
);

module.exports = router;
