const express  = require("express");
const router   = express.Router();
const Progress = require("../models/Progress");
const User     = require("../models/User");

router.get("/", async (req, res) => {
  try {
    // Aggregate average progress per user
    const raw = await Progress.aggregate([
      {
        $group: {
          _id:           "$userId",
          totalProgress: { $avg: "$percent" },
          modules:       { $sum: 1 }
        }
      },
      { $sort: { totalProgress: -1 } },
      { $limit: 10 }
    ]);

    // Populate user details
    const board = await Promise.all(raw.map(async (entry) => {
      const user = await User.findById(entry._id).select("name username xp badges photo");
      return {
        userId:        entry._id,
        name:          user?.name     || "Unknown",
        username:      user?.username || "unknown",
        xp:            user?.xp       || 0,
        badges:        user?.badges   || [],
        photo:         user?.photo    || "",
        totalProgress: Math.round(entry.totalProgress),
        modules:       entry.modules
      };
    }));

    res.json(board);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
