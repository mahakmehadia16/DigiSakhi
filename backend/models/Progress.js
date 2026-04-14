const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
  userId:    { type: String, required: true },
  module:    { type: String, required: true },
  percent:   { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Progress || mongoose.model("Progress", progressSchema);
