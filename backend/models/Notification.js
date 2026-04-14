const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  message:   { type: String, required: true },
  type:      { type: String, default: "info" },  // "info" | "success" | "warning"
  global:    { type: Boolean, default: true },   // broadcast to all users
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
