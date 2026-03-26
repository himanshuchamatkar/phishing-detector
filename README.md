# 🔐 Phishing Detection Chrome Extension

A real-time phishing detection system that analyzes websites and warns users about potential threats using explainable risk scoring.

---

## 🚀 Features

* 🔍 Real-time URL analysis
* ⚠️ Explainable risk scoring (LOW / MEDIUM / HIGH)
* 🌐 Domain age detection
* 🧾 Form & login detection
* 🔗 External form submission detection
* 🧠 Seen-before detection using MongoDB
* ⚡ Fast response using caching

---

## 🧠 How It Works

1. User opens a website
2. Chrome extension sends URL to backend
3. Backend analyzes:

   * HTTPS usage
   * Suspicious keywords
   * Domain age
   * Forms & login fields
4. Risk score is calculated
5. Result is stored in MongoDB
6. Future visits use stored data (faster detection)

---

## 📊 Example Output

Risk: HIGH (Score: 10)
+5 Form submits to external domain
+3 Login/password field detected
+2 Suspicious keywords

---

## 🌐 Live Backend

https://phishing-backend-73bb.onrender.com

---

## 🧪 Try the Extension

1. Download `extension.zip`
2. Extract it
3. Open Chrome → `chrome://extensions`
4. Enable **Developer Mode**
5. Click **Load unpacked**
6. Select extracted folder
<img width="1011" height="522" alt="Screenshot 2026-03-26 235939" src="https://github.com/user-attachments/assets/4edadf10-483a-4766-8964-5b78c65385f6" />
 
---

## 📸 Screenshots
<img width="1918" height="401" alt="Screenshot 2026-03-26 234911" src="https://github.com/user-attachments/assets/1a774c7e-efa3-48cf-b941-4df0626624e9" />
<img width="602" height="211" alt="Screenshot 2026-03-26 235021" src="https://github.com/user-attachments/assets/2dabb96c-9613-48ac-90ec-b08f4081d254" />
<img width="1441" height="692" alt="Screenshot 2026-03-26 235129" src="https://github.com/user-attachments/assets/15b5be5c-b284-47b4-9dd4-7692e7537da2" />
<img width="885" height="720" alt="Screenshot 2026-03-26 235214" src="https://github.com/user-attachments/assets/6bfcb228-79e8-4018-9913-21f54203a3dc" />

* Extension showing risk banner
* Render logs showing DB detection
* MongoDB collection data

---

## 🗂️ Tech Stack

* Node.js + Express
* MongoDB Atlas
* Puppeteer
* Chrome Extension API
* Render (deployment)

---

## ⚡ Key Highlight

✔ Detects phishing patterns
✔ Stores and reuses previous results
✔ Works in real-time via browser extension
✔ Fully deployed backend + database

---

## 📌 Future Improvements

* Better UI warnings
* ML-based detection
* Browser store deployment

---
