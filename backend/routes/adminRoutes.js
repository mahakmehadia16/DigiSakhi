const express  = require("express");
const router   = express.Router();
const User     = require("../models/User");
const Progress = require("../models/Progress");
const Certificate = require("../models/Certificate");
const auth     = require("../middleware/authMiddleware");

// Simple admin guard
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Admin access only" });
  next();
};

// ─── STATS ─────────────────────────────────────────────────────────────────────
router.get("/stats", auth, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalCerts = await Certificate.countDocuments();
    const blockedUsers = await User.countDocuments({ isBlocked: true });

    const moduleStats = await Progress.aggregate([
      {
        $group: {
          _id:         "$module",
          avgProgress: { $avg: "$percent" },
          userCount:   { $sum: 1 }
        }
      },
      { $sort: { avgProgress: -1 } }
    ]);

    // Daily signups last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailySignups = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id:   { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ totalUsers, totalCerts, blockedUsers, moduleStats, dailySignups });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─── GET ALL USERS ────────────────────────────────────────────────────────────
router.get("/users", auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─── BLOCK / UNBLOCK ─────────────────────────────────────────────────────────
router.put("/block/:id", auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ message: user.isBlocked ? "User blocked" : "User unblocked", isBlocked: user.isBlocked });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─── DELETE USER ─────────────────────────────────────────────────────────────
router.delete("/user/:id", auth, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Progress.deleteMany({ userId: req.params.id });
    await Certificate.deleteMany({ userId: req.params.id });
    res.json({ message: "User and associated data deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─── MAKE ADMIN ───────────────────────────────────────────────────────────────
router.put("/makeadmin/:id", auth, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { role: "admin" });
    res.json({ message: "User promoted to admin" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
