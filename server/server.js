const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
require("dotenv").config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 5000;
app.use("/api/auth", authRoutes);
// Error handler (must have 4 params)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res
    .status(500)
    .json({ message: "Server error", error: err && err.message ? err.message : String(err) });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
