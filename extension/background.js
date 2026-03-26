let lastAnalyzedUrl = {};

// 🔥 CHANGE THIS WHEN DEPLOYED
const BACKEND_URL = "https://phishing-backend-73bb.onrender.com";

// 🔹 Trigger when page loads / refresh
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {

    chrome.tabs.sendMessage(tabId, {
      type: "URL_UPDATE",
      url: tab.url
    });

    lastAnalyzedUrl[tabId] = tab.url;
  }
});

// 🔹 Trigger on tab switch
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {

      // Avoid duplicate analysis
      if (lastAnalyzedUrl[activeInfo.tabId] === tab.url) return;

      lastAnalyzedUrl[activeInfo.tabId] = tab.url;

      chrome.tabs.sendMessage(activeInfo.tabId, {
        type: "URL_UPDATE",
        url: tab.url
      });
    }
  });
});

// 🔹 API call to backend
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ANALYZE_URL") {

    console.log("📡 Sending URL to backend:", message.url);

    fetch(`${BACKEND_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: message.url })
    })
      .then(res => res.json())
      .then(data => {

        // 🔥 Detect DB hit (seen-before logic)
        if (data.fromCache) {
          console.log("♻️ Loaded from DB (seen before):", message.url);
        } else {
          console.log("🆕 Fresh analysis:", message.url);
        }

        sendResponse(data);
      })
      .catch((err) => {
        console.error("❌ Backend error:", err);
        sendResponse({ error: true });
      });

    return true; // keep async alive
  }
});