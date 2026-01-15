const express = require("express");
const Case = require("../models/case");
const { authRequired, allowRoles } = require("../middleware/auth");

const router = express.Router();
console.log("case.routes loaded");


// POST /api/cases (JUDGE creates a case)
router.post(
  "/",
  authRequired,
  allowRoles("JUDGE"),
  async (req, res, next) => {
    try {
      const {
        title,
        description,
        caseNumber,
        assignedLawyers,
        assignedProfessionals,
        assignedPublicViewers,
      } = req.body;

      if (!title || !caseNumber) {
        return res
          .status(400)
          .json({ message: "title and caseNumber are required" });
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
        assignedLawyers: assignedLawyers || [],
        assignedProfessionals: assignedProfessionals || [],
        assignedPublicViewers: assignedPublicViewers || [],
        assignedJudge: req.user.id, // Judge is self-assigned
      });

      res.status(201).json(newCase);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/cases (role-dependent view)
router.get("/", authRequired, async (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;

    let filter = {};

    if (role === "LAWYER") {
      filter.assignedLawyers = userId;
    } else if (role === "PROFESSIONAL") {
      filter.assignedProfessionals = userId;
    } else if (role === "JUDGE") {
      // judge sees ALL cases → leave filter as {}
    } else if (role === "PUBLIC") {
      filter.assignedPublicViewers = userId;
    }

    const cases = await Case.find(filter)
      .populate("createdBy", "name role")
      .populate("assignedProfessionals", "name role")
      .populate("assignedPublicViewers", "name role")
      .populate("assignedJudge", "name role")
      .populate("assignedLawyers", "name role")
      .populate("suggestions.user", "name role email")
      .populate("suggestions.suggestedBy", "name role email");

    res.json(cases);
  } catch (err) {
    next(err);
  }
});

// GET /api/cases/:id (everyone, but PUBLIC limited to CLOSED)
router.get("/:id", authRequired, async (req, res, next) => {
  try {
    const theCase = await Case.findById(req.params.id)
      .populate("createdBy", "name role")
      .populate("assignedProfessionals", "name role")
      .populate("assignedPublicViewers", "name role")
      .populate("assignedJudge", "name role")
      .populate("assignedLawyers", "name role")
      .populate("suggestions.user", "name role email")
      .populate("suggestions.suggestedBy", "name role email");

    if (!theCase) return res.status(404).json({ message: "Case not found" });

    if (req.user.role === "PUBLIC" && theCase.status !== "CLOSED") {
      return res
        .status(403)
        .json({ message: "Not allowed to view this case" });
    }

    res.json(theCase);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/cases/:id/status (JUDGE only)
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

// PATCH /api/cases/:id/verdict (JUDGE adds verdict / next session / close)
router.patch(
  "/:id/verdict",
  authRequired,
  allowRoles("JUDGE"),
  async (req, res, next) => {
    try {
      const { verdictText, nextHearingDate, closeCase } = req.body;

      const update = {};

      if (typeof verdictText === "string") {
        update.verdictText = verdictText;
      }

      if (nextHearingDate) {
        update.nextHearingDate = new Date(nextHearingDate);
      }

      if (closeCase === true) {
        update.status = "CLOSED";
        update.closedAt = new Date();
      }

      const updated = await Case.findByIdAndUpdate(
        req.params.id,
        {
          ...update,
          $push: {
            timeline: {
              date: new Date(),
              status: update.status, // might be undefined, that's fine
              verdict: verdictText,
              nextHearing: update.nextHearingDate,
            },
          },
        },
        { new: true }
      )
        .populate("createdBy", "name role")
        .populate("assignedProfessionals", "name role")
        .populate("assignedPublicViewers", "name role")
        .populate("assignedJudge", "name role")
        .populate("assignedLawyers", "name role")
        .populate("suggestions.user", "name role email")
        .populate("suggestions.suggestedBy", "name role email");

      if (!updated) {
        return res.status(404).json({ message: "Case not found" });
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/cases/:id (JUDGE updates assignments)
router.patch(
  "/:id",
  authRequired,
  allowRoles("JUDGE"),
  async (req, res, next) => {
    try {
      const { assignedLawyers, assignedProfessionals, assignedPublicViewers } = req.body;

      const update = {};
      if (assignedLawyers !== undefined) update.assignedLawyers = assignedLawyers;
      if (assignedProfessionals !== undefined) update.assignedProfessionals = assignedProfessionals;
      if (assignedPublicViewers !== undefined) update.assignedPublicViewers = assignedPublicViewers;

      const updated = await Case.findByIdAndUpdate(
        req.params.id,
        { $set: update },
        { new: true }
      )
        .populate("createdBy", "name role")
        .populate("assignedProfessionals", "name role")
        .populate("assignedPublicViewers", "name role")
        .populate("assignedJudge", "name role")
        .populate("assignedLawyers", "name role")
        .populate("suggestions.user", "name role email")
        .populate("suggestions.suggestedBy", "name role email");

      if (!updated) {
        return res.status(404).json({ message: "Case not found" });
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/cases/:id/suggest (LAWYER suggests people)
router.post(
  "/:id/suggest",
  authRequired,
  allowRoles("LAWYER"),
  async (req, res, next) => {
    try {
      const { userToSuggest, role } = req.body;
      if (!userToSuggest || !role) {
        return res.status(400).json({ message: "userToSuggest and role are required" });
      }

      const theCase = await Case.findById(req.params.id);
      if (!theCase) return res.status(404).json({ message: "Case not found" });

      // Check if already assigned
      const isAssigned =
        theCase.assignedProfessionals.some(id => id.toString() === userToSuggest) ||
        theCase.assignedPublicViewers.some(id => id.toString() === userToSuggest) ||
        theCase.assignedLawyers.some(id => id.toString() === userToSuggest);

      if (isAssigned) {
        return res.status(400).json({ message: "User is already involved in this case" });
      }

      // Check if already suggested
      const alreadySuggested = (theCase.suggestions || []).find(
        (s) => s.user.toString() === userToSuggest && s.status === "PENDING"
      );
      if (alreadySuggested) {
        return res.status(400).json({ message: "User already has a pending suggestion" });
      }

      theCase.suggestions.push({
        suggestedBy: req.user.id,
        user: userToSuggest,
        role,
        status: "PENDING",
      });

      await theCase.save();
      const updated = await Case.findById(req.params.id)
        .populate("createdBy", "name role")
        .populate("assignedProfessionals", "name role")
        .populate("assignedPublicViewers", "name role")
        .populate("assignedJudge", "name role")
        .populate("assignedLawyers", "name role")
        .populate("suggestions.user", "name role email")
        .populate("suggestions.suggestedBy", "name role email");

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/cases/:id/suggestions/:suggestionId (JUDGE approves/rejects)
router.patch(
  "/:id/suggestions/:suggestionId",
  authRequired,
  allowRoles("JUDGE"),
  async (req, res, next) => {
    try {
      const { status } = req.body; // APPROVED or REJECTED
      if (!["APPROVED", "REJECTED"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const theCase = await Case.findById(req.params.id);
      if (!theCase) return res.status(404).json({ message: "Case not found" });

      const suggestion = theCase.suggestions.id(req.params.suggestionId);
      if (!suggestion) return res.status(404).json({ message: "Suggestion not found" });

      suggestion.status = status;

      if (status === "APPROVED") {
        if (suggestion.role === "PROFESSIONAL") {
          if (!theCase.assignedProfessionals.some(id => id.toString() === suggestion.user.toString())) {
            theCase.assignedProfessionals.push(suggestion.user);
          }
        } else if (suggestion.role === "PUBLIC") {
          if (!theCase.assignedPublicViewers.some(id => id.toString() === suggestion.user.toString())) {
            theCase.assignedPublicViewers.push(suggestion.user);
          }
        }
      }

      await theCase.save();
      const updated = await Case.findById(req.params.id)
        .populate("createdBy", "name role")
        .populate("assignedProfessionals", "name role")
        .populate("assignedPublicViewers", "name role")
        .populate("assignedJudge", "name role")
        .populate("assignedLawyers", "name role")
        .populate("suggestions.user", "name role email")
        .populate("suggestions.suggestedBy", "name role email");

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

