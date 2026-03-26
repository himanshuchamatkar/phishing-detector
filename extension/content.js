let banner = document.createElement("div");

banner.style.position = "fixed";
banner.style.top = "0";
banner.style.left = "0";
banner.style.width = "100%";
banner.style.color = "white";
banner.style.textAlign = "left";
banner.style.padding = "10px";
banner.style.zIndex = "9999";
banner.style.fontSize = "14px";
banner.style.lineHeight = "1.4";

banner.textContent = "⚠️ Initializing...";

document.body.appendChild(banner);

// Listen for URL updates
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "URL_UPDATE") {
    const url = message.url;

    banner.textContent = "Analyzing...";
    banner.style.backgroundColor = "gray";

    chrome.runtime.sendMessage(
      { type: "ANALYZE_URL", url },
      (response) => {
        if (response.error) {
          banner.textContent = "Error connecting to backend";
          banner.style.backgroundColor = "black";
        } else {

          // 🔥 Color based on risk
          if (response.risk === "LOW") {
            banner.style.backgroundColor = "green";
          } else if (response.risk === "MEDIUM") {
            banner.style.backgroundColor = "orange";
          } else {
            banner.style.backgroundColor = "red";
          }

          // 🔥 Build explainable breakdown
          let breakdown = "";

          if (response.findings && response.findings.length > 0) {
            breakdown = response.findings
              .map(f => `+${f.score} ${f.message}`)
              .join("\n");
          } else {
            breakdown = "No issues detected";
          }

          banner.textContent =
            `Risk: ${response.risk} (Score: ${response.score})\n` +
            breakdown;
        }
      }
    );
  }
});