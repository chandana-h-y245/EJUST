const router = require("express").Router();
const Auth = require("../models/auth");
const jwt = require("jsonwebtoken");

// REGISTER
router.post("/register", async (req, res) => {
  const { name, userName, email, password, role } = req.body;

  if (!name || !userName || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const existing = await Auth.findOne({ $or: [{ email }, { userName }] });
  if (existing) {
    return res.status(400).json({ message: "Email or username already used" });
  }

  const user = await Auth.create({ name, userName, email, password, role });

  res.status(201).json({
    id: user._id,
    name: user.name,
    role: user.role,
    email: user.email,
  });
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await Auth.findOne({ email });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const isMatch = await user.comparePassword(password);
  if (!isMatch)
    return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      role: user.role,
      email: user.email,
    },
  });
});

module.exports = router;

