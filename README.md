<<<<<<< HEAD
# 🌸 DigiSakhi – Digital Literacy Platform

DigiSakhi is an AI-powered digital literacy platform designed to empower users (especially women and beginners) with essential digital skills through interactive learning, gamification, and real-time engagement.

---

## 🚀 Features

### 🎓 Learning & Progress

* Interactive modules (Digital Skills, Banking, Safety, etc.)
* Progress tracking with XP system
* Streak tracking for daily learning
* Auto badge rewards 🏆

### 🤖 AI & Smart Features

* AI Chatbot (DigiDidi) for guidance
* Voice Learning (Text-to-Speech + Speech Recognition)
* Multi-language support (Hindi, English, Marathi ready)

### 📊 Gamification

* Leaderboard system 🥇
* Badges & achievements
* Confetti rewards on completion 🎉

### 📄 Certificates

* Auto-generated certificates (PDF)
* Email delivery via Nodemailer
* Certificate verification system

### 🔔 Real-Time Features

* Live notifications using Socket.io
* Admin broadcast messages

### 👤 User Features

* Authentication (JWT-based)
* Profile with photo upload (Multer)
* Settings (dark mode, language, notifications)

### 🛠️ Admin Panel

* User management (block/delete)
* Analytics dashboard (Chart.js)
* Platform statistics

### 📱 PWA Support

* Installable as mobile app
* Offline support using Service Workers

---

## 🛠️ Tech Stack

### Frontend

* HTML, CSS, JavaScript
* Chart.js
* Web Speech API

### Backend

* Node.js
* Express.js
* MongoDB (Mongoose)

### Other Tools

* Socket.io (real-time)
* Multer (file upload)
* Nodemailer (emails)
* PDFKit (certificate generation)
* bcryptjs (password security)
* JWT (authentication)

---

## 📁 Project Structure

```
digisakhi/
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── server.js
│   └── .env
│
├── frontend/
│   ├── *.html
│   ├── shared.css
│   ├── shared.js
│   ├── manifest.json
│   └── sw.js
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone / Extract Project

```bash
unzip DigiSakhi_College_Final_Project.zip
cd digisakhi
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```
MONGO_URI=mongodb://127.0.0.1:27017/digisakhi
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
GEMINI_API_KEY=your_api_key (optional)
```

---

### 3️⃣ Start Backend

```bash
node server.js
```

✅ Runs at: `http://localhost:5000`

---

### 4️⃣ Start Frontend

```bash
cd ../frontend
npx live-server
```

✅ Opens at: `http://localhost:8080`

---

## 🔥 Advanced Features Setup

### 📧 Email Certificates

* Enable Gmail App Password
* Add credentials in `.env`

### 🤖 AI Chatbot

* Add Gemini/OpenAI API key
* Works without API using fallback mode

### 📸 Image Upload

* Uses Multer
* Stored in `/uploads`

---

## 🔐 Security Improvements

* Passwords hashed using bcrypt
* JWT authentication implemented
* Protected routes via middleware

---

## 🐞 Known Fixes (Already Improved)

* ❌ Plain text passwords → ✅ bcrypt hashing
* ❌ Hardcoded JWT → ✅ Environment variables
* ❌ Missing error handling → ✅ try/catch added

---

## 🌟 Future Enhancements

* Mobile app (React Native)
* AI-based personalized learning
* Offline downloadable courses
* Voice assistant in regional languages

---

## 👩‍💻 Author

**Mahak Mehadia and Rashi Pande**

* B.Tech Computer Engineering
* Developer | AI Enthusiast | Problem Solver

---

## 💡 Vision

To bridge the digital divide by making technology accessible, understandable, and empowering for everyone.

---

✨ *“Learn. Empower. Grow.”*

