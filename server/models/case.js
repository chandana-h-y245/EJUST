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
      ref: "Auth",
      required: true,
    },

    assignedProfessionals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auth",
      },
    ],

    assignedPublicViewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auth",
      },
    ],

    assignedJudge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
    },

    // judge fields
    verdictText: { type: String },       // judge’s final verdict/notes
    nextHearingDate: { type: Date },     // next session visible to all
    closedAt: { type: Date },            // when case was closed
  },
  { timestamps: true }
);

module.exports = mongoose.model("Case", caseSchema);

