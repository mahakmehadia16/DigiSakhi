const express     = require("express");
const router      = express.Router();
const { v4: uuidv4 } = require("uuid");
const PDFDocument = require("pdfkit");
const nodemailer  = require("nodemailer");
const Certificate = require("../models/Certificate");
const User        = require("../models/User");
const auth        = require("../middleware/authMiddleware");

// ─── NODEMAILER TRANSPORTER ────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ─── GENERATE CERTIFICATE + EMAIL IT ──────────────────────────────────────────
router.post("/generate", auth, async (req, res) => {
  try {
    const { module } = req.body;
    if (!module) return res.status(400).json({ message: "module is required" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check for duplicate
    const existing = await Certificate.findOne({ userId: req.user.id, module });
    if (existing) return res.json({ certificateId: existing.certificateId, alreadyIssued: true });

    const certificateId = uuidv4();
    await Certificate.create({
      userId: req.user.id,
      module,
      certificateId,
      userName: user.name
    });

    // ── Build PDF in memory ──────────────────────────────────────────────────
    const pdfBuffer = await buildCertificatePDF(user.name, module, certificateId);

    // ── Send email if configured ─────────────────────────────────────────────
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_USER !== "your_gmail@gmail.com") {
      try {
        await transporter.sendMail({
          from:    `"DigiSakhi" <${process.env.EMAIL_USER}>`,
          to:      user.email,
          subject: `🎉 Your DigiSakhi Certificate — ${module}`,
          html: `
            <div style="font-family:Arial;max-width:600px;margin:auto;padding:20px">
              <h2 style="color:#ff6b81">Congratulations, ${user.name}! 🌸</h2>
              <p>You have successfully completed the <strong>${module}</strong> module on DigiSakhi.</p>
              <p>Your Certificate ID: <code>${certificateId}</code></p>
              <p>Please find your certificate attached as a PDF.</p>
              <hr>
              <p style="color:#999;font-size:12px">DigiSakhi — Digital Empowerment for Women</p>
            </div>
          `,
          attachments: [{
            filename:    `DigiSakhi_Certificate_${module.replace(/\s+/g,"_")}.pdf`,
            content:     pdfBuffer,
            contentType: "application/pdf"
          }]
        });
      } catch (mailErr) {
        console.warn("Email send failed (cert still issued):", mailErr.message);
      }
    }

    res.json({ certificateId, userName: user.name, module });
  } catch (err) {
    console.error("Certificate error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── DOWNLOAD CERTIFICATE AS PDF ─────────────────────────────────────────────
router.get("/download/:certificateId", async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certificateId });
    if (!cert) return res.status(404).json({ message: "Certificate not found" });

    const pdfBuffer = await buildCertificatePDF(cert.userName, cert.module, cert.certificateId);
    res.set({
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="DigiSakhi_Certificate.pdf"`
    });
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─── GET USER CERTIFICATES ────────────────────────────────────────────────────
router.get("/mine", auth, async (req, res) => {
  try {
    const certs = await Certificate.find({ userId: req.user.id }).sort({ issuedAt: -1 });
    res.json(certs);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─── VERIFY CERTIFICATE ───────────────────────────────────────────────────────
router.get("/verify/:id", async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.id });
    if (!cert) return res.json({ valid: false });
    res.json({ valid: true, userName: cert.userName, module: cert.module, issuedAt: cert.issuedAt });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─── PDF BUILDER HELPER ────────────────────────────────────────────────────────
function buildCertificatePDF(userName, moduleName, certId) {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ size: "A4", layout: "landscape", margin: 50 });
    const chunks = [];

    doc.on("data",  chunk => chunks.push(chunk));
    doc.on("end",   ()    => resolve(Buffer.concat(chunks)));
    doc.on("error", err   => reject(err));

    const W = doc.page.width;
    const H = doc.page.height;

    // Background gradient (simulated with rect)
    doc.rect(0, 0, W, H).fill("#fff8f5");

    // Pink border
    doc.rect(20, 20, W - 40, H - 40).lineWidth(4).stroke("#ff6b81");
    doc.rect(28, 28, W - 56, H - 56).lineWidth(1.5).stroke("#ffa94d");

    // Header
    doc.font("Helvetica-Bold").fontSize(38).fillColor("#ff6b81")
       .text("DigiSakhi", 0, 60, { align: "center" });
    doc.font("Helvetica").fontSize(14).fillColor("#888")
       .text("Digital Empowerment Platform for Women", 0, 105, { align: "center" });

    // Divider
    doc.moveTo(100, 135).lineTo(W - 100, 135).lineWidth(1).stroke("#ffd6de");

    // Certificate title
    doc.font("Helvetica-Bold").fontSize(26).fillColor("#2c3e50")
       .text("Certificate of Completion", 0, 155, { align: "center" });

    // Body
    doc.font("Helvetica").fontSize(14).fillColor("#555")
       .text("This is to certify that", 0, 210, { align: "center" });

    doc.font("Helvetica-Bold").fontSize(30).fillColor("#ff6b81")
       .text(userName, 0, 235, { align: "center" });

    doc.font("Helvetica").fontSize(14).fillColor("#555")
       .text("has successfully completed the module", 0, 285, { align: "center" });

    doc.font("Helvetica-Bold").fontSize(22).fillColor("#ffa94d")
       .text(moduleName, 0, 310, { align: "center" });

    doc.font("Helvetica").fontSize(12).fillColor("#999")
       .text(`Issued on: ${new Date().toLocaleDateString("en-IN", { year:"numeric", month:"long", day:"numeric" })}`, 0, 360, { align: "center" })
       .text(`Certificate ID: ${certId}`, 0, 380, { align: "center" });

    // Footer line
    doc.moveTo(100, H - 80).lineTo(W - 100, H - 80).lineWidth(1).stroke("#ffd6de");
    doc.font("Helvetica").fontSize(11).fillColor("#aaa")
       .text("DigiSakhi — Every woman deserves a digital friend 🌸", 0, H - 65, { align: "center" });

    doc.end();
  });
}

module.exports = router;
