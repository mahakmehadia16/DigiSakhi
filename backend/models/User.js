const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  username:      { type: String, required: true, unique: true },
  email:         { type: String, required: true, unique: true },
  password:      { type: String, required: true },
  role:          { type: String, default: "user" },        // "user" | "admin"
  language:      { type: String, default: "en" },
  notifications: { type: Boolean, default: true },
  darkMode:      { type: Boolean, default: false },
  privacy:       { type: Boolean, default: false },
  isBlocked:     { type: Boolean, default: false },
  photo:         { type: String, default: "" },            // base64 or filename

  // 🔥 Gamification
  streak:        { type: Number, default: 0 },
  lastActive:    { type: Date, default: Date.now },
  badges:        { type: [String], default: [] },          // ["digital_champion", ...]
  xp:            { type: Number, default: 0 },

  createdAt:     { type: Date, default: Date.now }
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
