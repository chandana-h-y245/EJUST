const mongoose = require("mongoose");

const evidenceSchema = new mongoose.Schema(
  {
    case: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },

    type: {
      type: String,
      enum: ["DOCUMENT", "IMAGE", "VIDEO", "OTHER"],
      default: "DOCUMENT",
    },

    description: { type: String },

    filePath: { type: String, required: true },     // where on disk
    originalFileName: { type: String, required: true },
    mimeType: { type: String },

    sha256Hash: { type: String, required: true },   // hash of file content

    status: {
      type: String,
      enum: ["UPLOADED", "VERIFIED", "APPROVED", "REJECTED"],
      default: "UPLOADED",
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Evidence", evidenceSchema);
