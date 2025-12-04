const express = require("express");
const Auth = require("../models/auth"); // your user model
const { authRequired, allowRoles } = require("../middleware/auth");

const router = express.Router();

// LAWYER needs to see professionals, public, judges to assign
router.get(
  "/by-role",
  authRequired,
  allowRoles("LAWYER"),
  async (req, res, next) => {
    try {
      const professionals = await Auth.find({ role: "PROFESSIONAL", active: true })
        .select("name email role");
      const publics = await Auth.find({ role: "PUBLIC", active: true })
        .select("name email role");
      const judges = await Auth.find({ role: "JUDGE", active: true })
        .select("name email role");

      res.json({ professionals, publics, judges });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
