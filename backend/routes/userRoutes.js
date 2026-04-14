const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const path    = require("path");
const User    = require("../models/User");
const auth    = require("../middleware/authMiddleware");

// ─── MULTER SETUP ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename:    (req, file, cb) => cb(null, `${req.user.id}_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  }
});

// ─── GET PROFILE ──────────────────────────────────────────────────────────────
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, username, language, notifications, darkMode, privacy } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { name, username, language, notifications, darkMode, privacy },
      { new: true }
    ).select("-password");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─── UPLOAD PHOTO ─────────────────────────────────────────────────────────────
router.post("/photo", auth, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const photoUrl = `/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user.id, { photo: photoUrl });
    res.json({ photo: photoUrl });
  } catch (err) {
    res.status(500).json({ message: "Upload failed" });
  }
});

// ─── UPDATE SETTINGS ─────────────────────────────────────────────────────────
router.put("/settings", auth, async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.user.id, req.body, { new: true }).select("-password");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
