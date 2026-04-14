const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema({
  userId:        { type: String, required: true },
  module:        { type: String, required: true },
  certificateId: { type: String, required: true, unique: true },
  userName:      { type: String, default: "" },
  issuedAt:      { type: Date, default: Date.now }
});

module.exports = mongoose.models.Certificate || mongoose.model("Certificate", certificateSchema);
