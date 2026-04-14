const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const https   = require("https");

// ─── DIGIDIDI AI CHATBOT ───────────────────────────────────────────────────────
// Uses Google Gemini API (free tier)
router.post("/chat", auth, async (req, res) => {
  try {
    const { message, language = "en" } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required" });

    const apiKey = process.env.GEMINI_API_KEY;

    // If no API key, use smart rule-based fallback
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return res.json({ reply: getRuleBasedReply(message, language) });
    }

    const systemPrompt = getSystemPrompt(language);
    const payload = JSON.stringify({
      contents: [{
        parts: [{ text: `${systemPrompt}\n\nUser: ${message}` }]
      }]
    });

    const options = {
      hostname: "generativelanguage.googleapis.com",
      path:     `/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      method:   "POST",
      headers: {
        "Content-Type":   "application/json",
        "Content-Length": Buffer.byteLength(payload)
      }
    };

    const geminiReq = https.request(options, (geminiRes) => {
      let data = "";
      geminiRes.on("data", chunk => data += chunk);
      geminiRes.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          const reply  = parsed.candidates?.[0]?.content?.parts?.[0]?.text
                         || "Sorry, I could not understand that. Please try again.";
          res.json({ reply });
        } catch {
          res.json({ reply: getRuleBasedReply(message, language) });
        }
      });
    });

    geminiReq.on("error", () => {
      res.json({ reply: getRuleBasedReply(message, language) });
    });

    geminiReq.write(payload);
    geminiReq.end();

  } catch (err) {
    res.status(500).json({ message: "Chatbot error" });
  }
});

function getSystemPrompt(lang) {
  if (lang === "hi") {
    return `आप DigiSakhi के AI सहायक "DigiDidi" हैं। आप भारतीय महिलाओं को डिजिटल साक्षरता, 
    सरकारी योजनाओं, वित्तीय जानकारी, कानूनी अधिकारों और स्वास्थ्य के बारे में मदद करती हैं। 
    हमेशा सरल, दयालु और सहायक भाषा में उत्तर दें। उत्तर 3-4 वाक्यों में दें।`;
  }
  return `You are DigiDidi, the friendly AI assistant for DigiSakhi — a digital empowerment platform for women in India.
    Help users with: digital literacy, government schemes (PM Jan Dhan, Beti Bachao, Mudra loans, etc.), 
    financial literacy, legal rights, health info, scam detection, and WhatsApp/internet safety.
    Always be warm, simple, encouraging. Keep answers to 3-4 sentences. If asked about scams, warn clearly.`;
}

// Smart rule-based replies when no API key is set
function getRuleBasedReply(msg, lang) {
  const lower = msg.toLowerCase();

  const rules = [
    { keys: ["scam","fraud","fake","cheat"], reply: "⚠️ Be careful! Never share your OTP, Aadhaar number, or bank details with anyone on phone or WhatsApp. Legitimate banks and government offices never ask for these. If you suspect a scam, report it to 1930 (Cyber Crime helpline)." },
    { keys: ["upi","payment","gpay","phonepe","paytm"], reply: "💳 UPI is safe to use! Always check the receiver's name before confirming payment. Never enter your UPI PIN to 'receive' money — you only need PIN to send. Enable transaction limits in your UPI app for safety." },
    { keys: ["pm jan dhan","jan dhan","bank account"], reply: "🏦 PM Jan Dhan Yojana gives every Indian a free bank account with zero balance, a RuPay debit card, and ₹1 lakh accident insurance. Visit your nearest bank or post office with Aadhaar + PAN to open one." },
    { keys: ["mudra","loan","business loan"], reply: "💰 PM Mudra Yojana gives loans up to ₹10 lakh for small businesses without collateral. Apply through any bank or NBFC. For women entrepreneurs, many banks offer preferential rates. Visit mudra.org.in for details." },
    { keys: ["beti bachao","girl child","daughter"], reply: "🌸 Beti Bachao Beti Padhao scheme promotes education and welfare of the girl child. The Sukanya Samriddhi Yojana lets you open a savings account for your daughter with great interest rates (currently ~8% p.a.)." },
    { keys: ["whatsapp","message","forward"], reply: "📱 WhatsApp tips: Never forward messages marked 'FORWARD' without verifying. Don't click links from unknown numbers. Enable two-step verification in WhatsApp Settings > Account > Two-step verification." },
    { keys: ["health","doctor","hospital","medicine"], reply: "🏥 For free healthcare, visit your nearest Ayushman Bharat Health & Wellness Centre. The PM Ayushman Bharat scheme gives ₹5 lakh annual health cover to eligible families. Use the Aarogya Setu app to find nearby facilities." },
    { keys: ["legal","rights","police","complaint","violence"], reply: "⚖️ Every woman has the right to file a police complaint for free. Call 100 for police emergencies or 181 for Women Helpline. The Protection of Women from Domestic Violence Act, 2005 protects you at home. Legal aid is free at any District Legal Services Authority." },
    { keys: ["internet","wifi","online","safe"], reply: "🔒 Stay safe online: Use strong passwords (mix letters, numbers, symbols). Don't use public WiFi for banking. Check if a website is safe by looking for 'https://' and a padlock icon. Never save passwords in public computers." },
  ];

  for (const rule of rules) {
    if (rule.keys.some(k => lower.includes(k))) return rule.reply;
  }

  if (lang === "hi") {
    return "नमस्ते! मैं DigiDidi हूं। आप मुझसे सरकारी योजनाओं, डिजिटल सुरक्षा, वित्तीय जानकारी, कानूनी अधिकारों या स्वास्थ्य के बारे में पूछ सकती हैं। मैं आपकी मदद करने के लिए यहां हूं! 🌸";
  }
  return "Hello! I'm DigiDidi, your digital friend 🌸. You can ask me about government schemes, digital safety, financial tips, legal rights, health info, or how to spot scams. How can I help you today?";
}

module.exports = router;
