const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const Evidence = require("../models/evidence");
const { authRequired, allowRoles } = require("../middleware/auth");
const path = require("path");
const { hashFileSha256 } = require("../utils/hashFile");

// Upload evidence (Lawyer)
router.post("/", authRequired, allowRoles("LAWYER"), upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    const category = req.body.category ? req.body.category.toUpperCase() : "DOCUMENT";
    const fileHash = await hashFileSha256(req.file.path);

    const evidence = await Evidence.create({
      case: req.body.caseId,
      uploadedBy: req.user.id,
      description: req.body.description,
      displayName: req.body.displayName || req.file.originalname,
      originalFileName: req.file.originalname,
      mimeType: req.file.mimetype,
      category: category,
      fileUrl: `/uploads/${req.file.filename}`,
      filePath: req.file.path,
      sha256Hash: fileHash,
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

// PATCH verify evidence (Professional) - Supports Comments
router.patch("/:id/verify", authRequired, allowRoles("PROFESSIONAL"), async (req, res, next) => {
  try {
    console.log(`[DEBUG] Verifying evidence ID: ${req.params.id} by user: ${req.user.id}`);
    const evidence = await Evidence.findById(req.params.id);
    if (!evidence) {
      console.log(`[DEBUG] Evidence NOT FOUND in DB for ID: ${req.params.id}`);
      return res.status(404).json({ message: "Evidence not found in database" });
    }

    evidence.status = "VERIFIED";
    evidence.professionalComments = req.body.comments || "";
    await evidence.save();
    res.json(evidence);
  } catch (err) {
    next(err);
  }
});

// PATCH approve/reject evidence (Judge)
router.patch("/:id/approve", authRequired, allowRoles("JUDGE"), async (req, res, next) => {
  try {
    const { decision } = req.body;
    if (!["APPROVED", "REJECTED"].includes(decision)) {
      return res.status(400).json({ message: "Invalid decision" });
    }

    const evidence = await Evidence.findById(req.params.id);
    if (!evidence) return res.status(404).json({ message: "Evidence not found" });

    evidence.status = decision;
    await evidence.save();
    res.json(evidence);
  } catch (err) {
    next(err);
  }
});

module.exports = router;