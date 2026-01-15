const mongoose = require("mongoose");

const EvidenceSchema = new mongoose.Schema({
  case: { type: mongoose.Schema.Types.ObjectId, ref: "Case", required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Auth", required: true },
  description: { type: String },
  displayName: { type: String },
  originalFileName: { type: String },
  fileUrl: { type: String, required: true }, // The URL path for the browser
  filePath: { type: String, required: true }, // The physical path on the server
  mimeType: { type: String },
  sha256Hash: { type: String },
  category: {
    type: String,
    enum: ["DOCUMENT", "IMAGE", "VIDEO", "OTHER"],
    default: "DOCUMENT"
  },
  status: {
    type: String,
    enum: ["UPLOADED", "VERIFIED", "APPROVED", "REJECTED"],
    default: "UPLOADED"
  },
  professionalComments: { type: String },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Evidence", EvidenceSchema);