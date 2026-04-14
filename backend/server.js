const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const cors       = require("cors");
const dotenv     = require("dotenv");
const path       = require("path");
const cron       = require("node-cron");
const connectDB  = require("./config/db");

dotenv.config();
connectDB();

const app    = express();
const server = http.createServer(app);

// ─── SOCKET.IO ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Make io accessible in routes
app.set("io", io);

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on("admin-broadcast", (data) => {
    // Admin sends a message → broadcast to everyone
    io.emit("notification", data);
  });

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
});

// ─── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded photos statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── ROUTES ────────────────────────────────────────────────────────────────────
app.use("/api/auth",        require("./routes/authRoutes"));
app.use("/api/user",        require("./routes/userRoutes"));
app.use("/api/progress",    require("./routes/progressRoutes"));
app.use("/api/admin",       require("./routes/adminRoutes"));
app.use("/api/certificate", require("./routes/certificateRoutes"));
app.use("/api/leaderboard", require("./routes/leaderboardRoutes"));
app.use("/api/ai",          require("./routes/chatbotRoutes"));

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ─── DAILY LEARNING REMINDER (cron) ───────────────────────────────────────────
// Fires every day at 9 AM — broadcasts a reminder to all connected users
cron.schedule("0 9 * * *", () => {
  io.emit("notification", {
    message: "📚 Good morning! Time for your daily DigiSakhi lesson. Keep your streak going! 🔥",
    type:    "info"
  });
  console.log("📢 Daily reminder sent at 9 AM");
});

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🌸 DigiSakhi backend running at http://localhost:${PORT}`);
  console.log(`🔌 Socket.io ready`);
  console.log(`📋 API Docs: http://localhost:${PORT}/api/health\n`);
});
