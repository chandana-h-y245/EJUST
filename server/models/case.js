const mongoose = require("mongoose");

const caseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    caseNumber: { type: String, required: true, unique: true },

    status: {
      type: String,
      enum: ["OPEN", "UNDER_REVIEW", "CLOSED"],
      default: "OPEN",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",     // your user model
      required: true,
    },

    assignedProfessionals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auth",
      },
    ],

    assignedJudge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Case", caseSchema);
