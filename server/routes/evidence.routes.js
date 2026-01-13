const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const Evidence = require("../models/Evidence");
const { authRequired, allowRoles } = require("../middleware/auth");
const path = require("path");

// Replace your existing POST / route with this clean version
router.post("/", authRequired, allowRoles("LAWYER"), upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    // 1. Force category to uppercase to fix the grouping anomaly
    const category = req.body.category ? req.body.category.toUpperCase() : "DOCUMENT";

    const evidence = await Evidence.create({
      case: req.body.caseId,
      uploadedBy: req.user.id,
      description: req.body.description,
      displayName: req.body.displayName || req.file.originalname,
      originalFileName: req.file.originalname,
      mimeType: req.file.mimetype,
      category: category, // Matches the enum ["DOCUMENT", "IMAGE", "VIDEO", "OTHER"]
      fileUrl: `/uploads/${req.file.filename}`, // Path for frontend
      filePath: req.file.path, // Physical path for server logic
    });

    res.status(201).json(evidence);
  } catch (err) {
    next(err);
  }
});

// GET evidences by case
router.get("/by-case/:caseId", authRequired, async (req, res, next) => {
  try {
    const evidences = await Evidence.find({ case: req.params.caseId });
    res.json(evidences);
  } catch (err) {
    next(err);
  }
});

module.exports = router;