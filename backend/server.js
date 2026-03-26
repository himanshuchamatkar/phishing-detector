const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const fetch = require("node-fetch"); // 🔥 REQUIRED for Render

// 🔥 MongoDB connection
mongoose.connect("mongodb+srv://admin:admin123@cluster0.5mdqavx.mongodb.net/phishingDB?retryWrites=true&w=majority")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

// 🔥 SCHEMA
const Scan = mongoose.model("Scan", {
  url: String,
  risk: String,
  score: Number,
  findings: Array,
  createdAt: { type: Date, default: Date.now }
});

const app = express();
app.use(cors());
app.use(express.json());

const cache = {};
const CACHE_TTL = 2 * 60 * 1000;

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// 🔥 DOMAIN AGE
async function getDomainAge(url) {
  try {
    const hostname = new URL(url).hostname;

    const response = await fetch(`https://rdap.org/domain/${hostname}`);
    const data = await response.json();

    let creationDate = null;

    if (data.events) {
      const regEvent = data.events.find(e =>
        e.eventAction === "registration" ||
        e.eventAction === "created"
      );
      if (regEvent) creationDate = regEvent.eventDate;
    }

    if (!creationDate && data.registrationDate) {
      creationDate = data.registrationDate;
    }

    if (!creationDate) return null;

    const created = new Date(creationDate);
    const now = new Date();

    return Math.floor((now - created) / (1000 * 60 * 60 * 24));

  } catch (err) {
    console.log("❌ Domain age error:", err.message);
    return null;
  }
}

// 🔥 SANDBOX
async function analyzeWithSandbox(url) {
  let findings = [];

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ]
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10000 });

    const pageDomain = new URL(url).hostname;

    // Password field
    if (await page.$("input[type='password']")) {
      findings.push({
        type: "password_field",
        message: "Login/password field detected",
        score: 3
      });
    }

    // Forms
    const forms = await page.$$eval("form", forms =>
      forms.map(f => f.getAttribute("action"))
    );

    if (forms.length > 0) {
      findings.push({
        type: "form",
        message: "Page contains form elements",
        score: 2
      });
    }

    // External form
    for (let action of forms) {
      if (!action) continue;

      try {
        const actionUrl = new URL(action, url);
        if (actionUrl.hostname !== pageDomain) {
          findings.push({
            type: "external_form",
            message: "Form submits to external domain",
            score: 5
          });
        }
      } catch {}
    }

    await browser.close();

  } catch (err) {
    console.log("⚠️ Sandbox failed:", err.message); // 🔥 better logging
  }

  return findings;
}

// 🔥 ANALYZE ROUTE
app.post("/analyze", async (req, res) => {
  const { url } = req.body;
  console.log("Received URL:", url);

  const bypassCache = req.query.bypass === "true";

  // 🔥 SEEN BEFORE (DB)
  try {
    const existing = await Scan.findOne({ url });

    if (existing) {
      console.log("♻️ Found in DB:", url);

      return res.json({
        risk: existing.risk,
        score: existing.score,
        findings: existing.findings,
        reasons: existing.findings.map(f => f.message),
        fromCache: true
      });
    }
  } catch (err) {
    console.log("❌ DB Read Error:", err.message);
  }

  // 🔥 MEMORY CACHE
  if (!bypassCache && cache[url]) {
    const { result, timestamp } = cache[url];

    if (Date.now() - timestamp < CACHE_TTL) {
      console.log("⚡ Using cache:", url);
      return res.json(result);
    } else {
      delete cache[url];
    }
  }

  let findings = [];
  let totalScore = 0;

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    // HTTP
    if (parsedUrl.protocol === "http:") {
      findings.push({
        type: "protocol",
        message: "Site is not using HTTPS",
        score: 2
      });
    }

    // Keywords
    const words = ["login", "verify", "update", "bank", "secure"];
    if (words.some(w => url.toLowerCase().includes(w))) {
      findings.push({
        type: "keyword",
        message: "Suspicious keywords in URL",
        score: 2
      });
    }

    // Subdomain
    if (hostname.split(".").length > 3) {
      findings.push({
        type: "subdomain",
        message: "Too many subdomains",
        score: 3
      });
    }

    // IP
    if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      findings.push({
        type: "ip",
        message: "Using IP address instead of domain",
        score: 5
      });
    }

    // Domain age
    if (!url.startsWith("file://")) {
      const age = await getDomainAge(url);
      console.log("🌐 Domain age:", age);

      if (age !== null) {
        if (age < 7) {
          findings.push({
            type: "domain_age",
            message: `Domain is very new (${age} days old)`,
            score: 5
          });
        } else if (age < 30) {
          findings.push({
            type: "domain_age",
            message: `Domain is new (${age} days old)`,
            score: 3
          });
        }
      }
    }

  } catch {
    findings.push({
      type: "invalid",
      message: "Invalid URL",
      score: 5
    });
  }

  // Sandbox
  if (findings.length > 0) {
    const sandboxFindings = await analyzeWithSandbox(url);
    findings.push(...sandboxFindings);
  }

  // Score
  for (let f of findings) totalScore += f.score || 0;

  let risk = "LOW";
  if (totalScore >= 8) risk = "HIGH";
  else if (totalScore >= 4) risk = "MEDIUM";

  const result = {
    risk,
    score: totalScore,
    reasons: findings.map(f => f.message),
    findings
  };

  // Cache
  if (risk !== "LOW") {
    cache[url] = { result, timestamp: Date.now() };
  }

  // 🔥 SAVE TO DB
  try {
    await Scan.create({
      url,
      risk: result.risk,
      score: result.score,
      findings: result.findings
    });
    console.log("💾 Saved to DB");
  } catch (err) {
    console.log("❌ DB Save Error:", err.message);
  }

  res.json(result);
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


