const express = require("express");
const Auth = require("../models/auth"); // your user model
const { authRequired, allowRoles } = require("../middleware/auth");

const router = express.Router();
const upload = require("../middleware/upload");


// JUDGE and PUBLIC need to see lists of officials
router.get(
  "/by-role",
  authRequired,
  allowRoles("JUDGE", "PUBLIC"),
  async (req, res, next) => {
    try {
      const lawyers = await Auth.find({ role: "LAWYER", active: true }).select("name email role experience education profilePicture");
      const professionals = await Auth.find({ role: "PROFESSIONAL", active: true }).select("name email role experience education profilePicture");
      const judges = await Auth.find({ role: "JUDGE", active: true }).select("name email role experience education profilePicture");

      // Only Judge needs to see other Public users for assignment
      let publics = [];
      if (req.user.role === "JUDGE") {
        publics = await Auth.find({ role: "PUBLIC", active: true }).select("name email role");
      }

      res.json({ lawyers, professionals, publics, judges });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/users/profile
router.get("/profile", authRequired, async (req, res, next) => {
  try {
    const user = await Auth.findById(req.user.id).select("-password -refreshToken");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/profile
router.patch("/profile", authRequired, async (req, res, next) => {
  try {
    const { name, experience, education, governmentIdType, governmentIdNumber } = req.body;

    const update = {};
    if (name) update.name = name;
    if (experience !== undefined) update.experience = experience;
    if (education !== undefined) update.education = education;
    if (governmentIdType !== undefined) update.governmentIdType = governmentIdType;
    if (governmentIdNumber !== undefined) update.governmentIdNumber = governmentIdNumber;

    const user = await Auth.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true }
    ).select("-password -refreshToken");

    res.json(user);
  } catch (err) {
    next(err);
  }
});

// POST /api/users/profile/picture
router.post("/profile/picture", authRequired, upload.single("profilePicture"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    const fileUrl = `/uploads/${req.file.filename}`;
    const user = await Auth.findByIdAndUpdate(
      req.user.id,
      { profilePicture: fileUrl },
      { new: true }
    ).select("-password -refreshToken");

    res.json(user);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

