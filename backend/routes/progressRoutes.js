const express  = require("express");
const router   = express.Router();
const Progress = require("../models/Progress");
const User     = require("../models/User");
const auth     = require("../middleware/authMiddleware");

// Badge definitions: earned when a module hits 100%
const MODULE_BADGES = {
  "Digital Skills":     "💻 Digital Expert",
  "Financial Literacy": "💰 Finance Pro",
  "Legal Rights":       "⚖️ Rights Champion",
  "Health & Wellness":  "🌸 Wellness Star",
  "Entrepreneurship":   "🚀 Entrepreneur",
  "WhatsApp Safety":    "📱 Safety Guard",
  "Scam Awareness":     "🛡️ Scam Buster",
  "Govt Schemes":       "🏛️ Scheme Scholar"
};

// ─── SAVE / UPDATE PROGRESS ────────────────────────────────────────────────────
router.post("/", auth, async (req, res) => {
  try {
    const { module, percent } = req.body;
    const userId = req.user.id;

    if (!module || percent === undefined)
      return res.status(400).json({ message: "module and percent are required" });

    await Progress.findOneAndUpdate(
      { userId, module },
      { percent, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    // Award XP: each save gives XP proportional to progress
    const xpGain = Math.floor(percent / 10);
    let updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { xp: xpGain } },
      { new: true }
    );

    // Award badge if module completed (100%)
    let newBadge = null;
    if (percent >= 100 && MODULE_BADGES[module]) {
      const badge = MODULE_BADGES[module];
      if (!updatedUser.badges.includes(badge)) {
        updatedUser = await User.findByIdAndUpdate(
          userId,
          { $addToSet: { badges: badge } },
          { new: true }
        );
        newBadge = badge;
      }
    }

    res.json({
      message: "Progress saved",
      xp:      updatedUser.xp,
      badges:  updatedUser.badges,
      newBadge
    });
  } catch (err) {
    console.error("Progress save error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── GET USER PROGRESS ────────────────────────────────────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const progress = await Progress.find({ userId: req.user.id });
    const overall = progress.length
      ? Math.round(progress.reduce((sum, p) => sum + p.percent, 0) / progress.length)
      : 0;
    res.json({ progress, overall });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
