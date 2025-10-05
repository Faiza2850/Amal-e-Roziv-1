// src/routes/workerRoutes.js
const express = require("express");
const router = express.Router();
const { upload } = require("../config/multerConfig");
const workerController = require("../controllers/workerController");

router.post(
  "/worker",
  upload.fields([
    { name: "cnicFront", maxCount: 1 },
    { name: "cnicBack", maxCount: 1 },
    { name: "profilePic", maxCount: 1 },
    { name: "workCert", maxCount: 1 },
    { name: "license", maxCount: 1 },
    { name: "licenseBack", maxCount: 1 },
  ]),
  workerController.registerWorker
);

// Add: update docs, delete docs, get profile, status → same style

module.exports = router;
