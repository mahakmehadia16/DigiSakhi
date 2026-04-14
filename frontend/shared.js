/* ─── DigiSakhi shared.js ─────────────────────────────────────────────────── */
const API = "http://localhost:5000";

// ─── Auth helpers ─────────────────────────────────────────────────────────────
function getToken()   { return localStorage.getItem("token"); }
function getUserId()  { return localStorage.getItem("userId"); }
function getUser()    { try { return JSON.parse(localStorage.getItem("user")) || {}; } catch { return {}; } }
function saveUser(u)  { localStorage.setItem("user", JSON.stringify(u)); }

function authHeaders() {
  return { "Content-Type": "application/json", "Authorization": "Bearer " + getToken() };
}

function requireLogin() {
  if (!getToken()) { window.location.href = "login.html"; return false; }
  return true;
}

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

// ─── API fetch wrapper ────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    headers: authHeaders(),
    ...options
  });
  if (res.status === 401) { logout(); return null; }
  return res.json();
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function toast(msg, type = "success", duration = 3500) {
  let el = document.getElementById("ds-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "ds-toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className   = `show ${type}`;
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => { el.className = ""; }, duration);
}

// ─── Badge Popup + Confetti ───────────────────────────────────────────────────
function showBadgePopup(badge) {
  let popup = document.getElementById("badge-popup");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "badge-popup";
    popup.innerHTML = `
      <div class="badge-icon">🏆</div>
      <h2>New Badge Earned!</h2>
      <p id="badge-name"></p>
      <p style="margin-top:8px;color:#999;font-size:13px">Keep learning to earn more!</p>
      <button onclick="document.getElementById('badge-popup').classList.remove('show')">Awesome! 🎉</button>
    `;
    document.body.appendChild(popup);
  }
  document.getElementById("badge-name").textContent = badge;
  popup.classList.add("show");
  launchConfetti();
  setTimeout(() => popup.classList.remove("show"), 5000);
}

function launchConfetti() {
  let canvas = document.getElementById("confetti-canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "confetti-canvas";
    document.body.appendChild(canvas);
  }
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d");
  const pieces = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    r: Math.random() * 8 + 4,
    d: Math.random() * 10 + 5,
    color: ["#ff6b81","#ffa94d","#ffd43b","#74c0fc","#b197fc"][Math.floor(Math.random()*5)],
    tilt: Math.random() * 10 - 10,
    tiltAngleIncr: 0.07 * (Math.random() + 0.05),
    tiltAngle: 0
  }));

  let frame;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.tiltAngle += p.tiltAngleIncr;
      p.y += (Math.cos(p.d) + 2);
      p.tilt = Math.sin(p.tiltAngle) * 12;
      if (p.y > canvas.height) { p.x = Math.random() * canvas.width; p.y = -20; }
      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
      ctx.stroke();
    });
    frame = requestAnimationFrame(draw);
  }
  draw();
  setTimeout(() => { cancelAnimationFrame(frame); ctx.clearRect(0, 0, canvas.width, canvas.height); }, 3500);
}

// ─── Dark Mode ────────────────────────────────────────────────────────────────
function applyDarkMode() {
  const user = getUser();
  if (user.darkMode || localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
  }
}

// ─── Voice TTS ────────────────────────────────────────────────────────────────
function speak(text, lang = "en-IN") {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang  = lang;
  u.rate  = 0.9;
  window.speechSynthesis.speak(u);
}

function stopSpeaking() { window.speechSynthesis?.cancel(); }

// Voice input (Speech Recognition)
function startVoiceInput(onResult, lang = "en-IN") {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast("Voice input not supported in this browser", "warning"); return null; }
  const rec    = new SR();
  rec.lang     = lang;
  rec.interimResults = false;
  rec.onresult = (e) => onResult(e.results[0][0].transcript);
  rec.onerror  = ()  => toast("Voice input error", "warning");
  rec.start();
  return rec;
}

// ─── Socket.io Live Notifications ────────────────────────────────────────────
function initSocket() {
  if (typeof io === "undefined") return;
  const socket = io(API);
  const uid    = getUserId();
  if (uid) socket.emit("join", uid);

  socket.on("notification", (data) => {
    toast(data.message, data.type || "info", 5000);
  });
}

// ─── Progress helpers ─────────────────────────────────────────────────────────
async function saveProgress(module, percent) {
  const data = await apiFetch("/api/progress", {
    method: "POST",
    body:   JSON.stringify({ module, percent })
  });
  if (data?.newBadge) showBadgePopup(data.newBadge);
  if (data?.xp !== undefined) {
    const user = getUser();
    user.xp = data.xp;
    user.badges = data.badges;
    saveUser(user);
  }
  return data;
}

async function loadMyProgress() {
  return apiFetch("/api/progress");
}

// ─── Streak display ───────────────────────────────────────────────────────────
function renderStreak(streak) {
  const el = document.getElementById("streak-display");
  if (!el) return;
  el.innerHTML = `<span class="streak-pill">🔥 ${streak} day streak</span>`;
}

// ─── Profile icon ─────────────────────────────────────────────────────────────
function renderProfileIcon() {
  const user  = getUser();
  const el    = document.getElementById("profileIcon");
  const init  = document.getElementById("profileInitial");
  if (!el) return;
  if (user.photo) {
    const img = document.createElement("img");
    img.src   = API + user.photo;
    img.style.cssText = "width:40px;height:40px;border-radius:50%;object-fit:cover;";
    el.innerHTML = "";
    el.appendChild(img);
  } else if (init) {
    init.textContent = (user.name || user.username || "U")[0].toUpperCase();
  }
}

// ─── Chatbot ──────────────────────────────────────────────────────────────────
function initChatbot() {
  if (document.getElementById("chatbot-btn")) return; // already init

  const btn = document.createElement("button");
  btn.id        = "chatbot-btn";
  btn.title     = "Chat with DigiDidi";
  btn.innerHTML = "🤖";
  document.body.appendChild(btn);

  const win = document.createElement("div");
  win.id        = "chatbot-window";
  win.innerHTML = `
    <div id="chatbot-header">
      <span>🌸</span> DigiDidi — Your AI Friend
      <button id="chatbot-close">✕</button>
    </div>
    <div id="chatbot-messages">
      <div class="chat-msg bot">Hello! I'm DigiDidi 🌸 Ask me about government schemes, digital safety, scams, finance, or health!</div>
    </div>
    <div id="chatbot-input-row">
      <input id="chatbot-input" placeholder="Type your question..." />
      <button id="chatbot-mic" class="voice-btn" title="Speak">🎙️</button>
      <button id="chatbot-send">➤</button>
    </div>
  `;
  document.body.appendChild(win);

  btn.addEventListener("click", () => win.classList.toggle("open"));
  document.getElementById("chatbot-close").addEventListener("click", () => win.classList.remove("open"));
  document.getElementById("chatbot-send").addEventListener("click", sendChatMessage);
  document.getElementById("chatbot-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendChatMessage();
  });

  // Voice input for chatbot
  const micBtn = document.getElementById("chatbot-mic");
  let micRec   = null;
  micBtn.addEventListener("click", () => {
    if (micRec) { micRec.stop(); micRec = null; micBtn.classList.remove("listening"); return; }
    micBtn.classList.add("listening");
    micRec = startVoiceInput((text) => {
      document.getElementById("chatbot-input").value = text;
      micBtn.classList.remove("listening");
      micRec = null;
      sendChatMessage();
    }, getLang());
  });
}

async function sendChatMessage() {
  const input = document.getElementById("chatbot-input");
  const msg   = input.value.trim();
  if (!msg) return;

  appendChatMsg(msg, "user");
  input.value = "";

  const lang = getLang();
  appendChatMsg("...", "bot", "typing-indicator");

  try {
    const data = await apiFetch("/api/ai/chat", {
      method: "POST",
      body:   JSON.stringify({ message: msg, language: lang })
    });
    removeTyping();
    const reply = data?.reply || "Sorry, I could not get a response.";
    appendChatMsg(reply, "bot");
    speak(reply, lang === "hi" ? "hi-IN" : "en-IN");
  } catch {
    removeTyping();
    appendChatMsg("Network error. Please try again.", "bot");
  }
}

function appendChatMsg(text, role, id = "") {
  const msgs = document.getElementById("chatbot-messages");
  const div  = document.createElement("div");
  div.className   = `chat-msg ${role}`;
  div.textContent = text;
  if (id) div.id  = id;
  msgs.appendChild(div);
  msgs.scrollTop  = msgs.scrollHeight;
}

function removeTyping() {
  document.getElementById("typing-indicator")?.remove();
}

function getLang() {
  return document.getElementById("lang")?.value || localStorage.getItem("lang") || "en";
}

// ─── Language switcher ────────────────────────────────────────────────────────
function initLangSwitcher(translations) {
  const sel = document.getElementById("lang");
  if (!sel) return;
  const saved = localStorage.getItem("lang") || "en";
  sel.value = saved;
  applyTranslations(translations, saved);

  sel.addEventListener("change", (e) => {
    localStorage.setItem("lang", e.target.value);
    applyTranslations(translations, e.target.value);
  });
}

function applyTranslations(translations, lang) {
  const t = translations[lang];
  if (!t) return;
  for (const [id, text] of Object.entries(t)) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
}

// ─── On page load ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  applyDarkMode();
  renderProfileIcon();
  renderStreak(getUser().streak || 0);
  initChatbot();
  initSocket();
});

function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

function toggleDropdown() {
  const menu = document.getElementById("dropdownMenu");
  menu.classList.toggle("show");
}

// Close when clicking outside
window.addEventListener("click", function(e) {
  if (!e.target.closest(".profile-container")) {
    const menu = document.getElementById("dropdownMenu");
    if (menu) menu.classList.remove("show");
  }
});

let currentSpeech = null;

function toggleVoice(btn, text) {
  // If already speaking → STOP
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    btn.innerText = "🔊 Listen";
    return;
  }

  // Start speaking
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-IN";
  u.rate = 0.9;

  currentSpeech = u;

  u.onend = () => {
    btn.innerText = "🔊 Listen";
  };

  window.speechSynthesis.speak(u);
  btn.innerText = "⏹ Stop";
}