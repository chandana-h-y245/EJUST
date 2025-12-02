const express = require("express");
const Case = require("../models/case");
const Evidence = require("../models/evidence");
const { authRequired, allowRoles } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { hashFileSha256 } = require("../utils/hashFile"); // path where you put it
const router = express.Router();

// POST /api/evidences  (LAWYER uploads evidence for a case)
router.post(
  "/",
  authRequired,
  allowRoles("LAWYER"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      const { caseId, type, description } = req.body;
      if (!caseId || !req.file) {
        return res.status(400).json({ message: "caseId and file are required" });
      }

      const theCase = await Case.findById(caseId);
      if (!theCase) return res.status(404).json({ message: "Case not found" });

      const hash = await hashFileSha256(req.file.path);

      const evidence = await Evidence.create({
        case: caseId,
        uploadedBy: req.user.id,
        type: type || "DOCUMENT",
        description,
        filePath: req.file.path,
        originalFileName: req.file.originalname,
        mimeType: req.file.mimetype,
        sha256Hash: hash,
      });

      res.status(201).json(evidence);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/evidences/by-case/:caseId  (role-limited list)
router.get(
  "/by-case/:caseId",
  authRequired,
  async (req, res, next) => {
    try {
      const theCase = await Case.findById(req.params.caseId);
      if (!theCase) return res.status(404).json({ message: "Case not found" });

      if (req.user.role === "PUBLIC" && theCase.status !== "CLOSED") {
        return res.status(403).json({ message: "Not allowed to view evidences for this case" });
      }

      const evidences = await Evidence.find({ case: theCase._id })
        .populate("uploadedBy", "name role")
        .populate("verifiedBy", "name role")
        .populate("approvedBy", "name role");

      res.json(evidences);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/evidences/:id/verify  (PROFESSIONAL)
router.patch(
  "/:id/verify",
  authRequired,
  allowRoles("PROFESSIONAL"),
  async (req, res, next) => {
    try {
      const evidence = await Evidence.findById(req.params.id);
      if (!evidence) return res.status(404).json({ message: "Evidence not found" });

      evidence.status = "VERIFIED";
      evidence.verifiedBy = req.user.id;
      await evidence.save();

      res.json(evidence);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/evidences/:id/approve  (JUDGE approve/reject)
router.patch(
  "/:id/approve",
  authRequired,
  allowRoles("JUDGE"),
  async (req, res, next) => {
    try {
      const { decision } = req.body; // "APPROVED" or "REJECTED"
      if (!["APPROVED", "REJECTED"].includes(decision)) {
        return res.status(400).json({ message: "decision must be APPROVED or REJECTED" });
      }

      const evidence = await Evidence.findById(req.params.id);
      if (!evidence) return res.status(404).json({ message: "Evidence not found" });

      evidence.status = decision;
      evidence.approvedBy = req.user.id;
      await evidence.save();

      res.json(evidence);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
