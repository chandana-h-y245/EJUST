const express = require("express");
const Case = require("../models/case");
const { authRequired, allowRoles } = require("../middleware/auth");

const router = express.Router();

// POST /api/cases  (LAWYER creates a case)
router.post(
  "/",
  authRequired,
  allowRoles("LAWYER"),
  async (req, res, next) => {
    try {
      const {
        title,
        description,
        caseNumber,
        assignedProfessionals,
        assignedPublicViewers,
        assignedJudge,
      } = req.body;

      if (!title || !caseNumber) {
        return res.status(400).json({ message: "title and caseNumber are required" });
      }

      const exists = await Case.findOne({ caseNumber });
      if (exists) {
        return res.status(400).json({ message: "caseNumber already exists" });
      }

      const newCase = await Case.create({
        title,
        description,
        caseNumber,
        createdBy: req.user.id,
        assignedProfessionals: assignedProfessionals || [],
        assignedPublicViewers: assignedPublicViewers || [],
        assignedJudge: assignedJudge || null,
      });

      res.status(201).json(newCase);
    } catch (err) {
      next(err);
    }
  }
);


// GET /api/cases  (role-dependent view)
router.get("/", authRequired, async (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;

    let filter = {};

    if (role === "LAWYER") {
  filter.createdBy = userId;
} else if (role === "PROFESSIONAL") {
  filter.assignedProfessionals = userId;
} else if (role === "JUDGE") {
  // judge sees ALL cases
  // filter = {};   // no extra condition
} else if (role === "PUBLIC") {
  filter.assignedPublicViewers = userId;
}


    const cases = await Case.find(filter)
      .populate("createdBy", "name role")
      .populate("assignedProfessionals", "name role")
      .populate("assignedJudge", "name role");

    res.json(cases);
  } catch (err) {
    next(err);
  }
});

// GET /api/cases/:id  (everyone, but PUBLIC limited to CLOSED)
router.get("/:id", authRequired, async (req, res, next) => {
  try {
    const theCase = await Case.findById(req.params.id)
      .populate("createdBy", "name role")
      .populate("assignedProfessionals", "name role")
      .populate("assignedJudge", "name role");

    if (!theCase) return res.status(404).json({ message: "Case not found" });

    if (req.user.role === "PUBLIC" && theCase.status !== "CLOSED") {
      return res.status(403).json({ message: "Not allowed to view this case" });
    }

    res.json(theCase);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/cases/:id/status  (JUDGE only)
router.patch(
  "/:id/status",
  authRequired,
  allowRoles("JUDGE"),
  async (req, res, next) => {
    try {
      const { status } = req.body;
      if (!["OPEN", "UNDER_REVIEW", "CLOSED"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updated = await Case.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
      if (!updated) return res.status(404).json({ message: "Case not found" });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
