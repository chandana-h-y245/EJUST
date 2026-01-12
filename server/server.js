const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const caseRoutes = require("./routes/case.routes");
const evidenceRoutes = require("./routes/evidence.routes");
const userRoutes = require("./routes/user.routes");
require("dotenv").config();
const path = require("path");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/evidences", evidenceRoutes);
app.use("/api/users", userRoutes);

// static files for uploaded evidence
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// DB connect
console.log("MONGO_URI is:", process.env.MONGO_URI);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("DB error:", err.message));

// simple test route
app.get("/", (req, res) => {
  res.send("API running");
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res
    .status(500)
    .json({
      message: "Server error",
      error: err && err.message ? err.message : String(err),
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
