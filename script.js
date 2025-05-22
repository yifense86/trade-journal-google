// Convert a file to base64
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve({ name: file.name, type: file.type, data: base64 });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Upload a single file to Google Apps Script
async function uploadToDrive(fileObj) {
  const form = new URLSearchParams();
  form.append("file", fileObj.data);
  form.append("name", fileObj.name);
  form.append("type", fileObj.type);

  try {
    const res = await fetch(UPLOAD_URL, {
      method: "POST",
      body: form
    });
    const json = await res.json();
    return json.link;
  } catch (err) {
    console.error("Upload error:", err);
    return "";
  }
}

// Handle multiple file uploads
async function handleScreenshotUpload(inputElement) {
  const files = Array.from(inputElement.files || []);
  const base64Files = await Promise.all(files.map(fileToBase64));
  const links = await Promise.all(base64Files.map(uploadToDrive));
  return links;
}

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("tradeForm");
  const entriesDiv = document.getElementById("entries");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {};
    new FormData(form).forEach((value, key) => {
      if (data[key]) {
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    });

    // Upload screenshots to Drive
    data.openingScreenshotLinks = await handleScreenshotUpload(document.querySelector('[name="openingScreenshotFiles"]'));
    data.closingScreenshotLinks = await handleScreenshotUpload(document.querySelector('[name="closingScreenshotFiles"]'));

    // AI tag generation
    const aiTags = [data.entryTag, data.rr, data.exitTag, data.takerRatio, data.divergences, data.macEclipse].filter(Boolean);
    const textBlob = `${data.setup || ""} ${data.openingNotes || ""} ${data.notes || ""}`.toLowerCase();
    if (textBlob.includes("exit") && textBlob.includes("profit")) aiTags.push("Premature Exit in Profit");
    if (textBlob.includes("exit") && textBlob.includes("loss")) aiTags.push("Premature Exit in Loss");
    if (textBlob.includes("1r") && textBlob.includes("breakeven")) aiTags.push("1R Breakeven");
    if (textBlob.includes("held") && textBlob.includes("target")) aiTags.push("Held to Target");
    if (textBlob.includes("solid") && textBlob.includes("entry")) aiTags.push("Solid Entry");

    const pnl = data.entry && data.exit
      ? (data.direction === "Long"
          ? parseFloat(data.exit) - parseFloat(data.entry)
          : parseFloat(data.entry) - parseFloat(data.exit))
      : null;

    const payload = {
      tradeId: Date.now().toString(),
      ...data,
      aiTags,
      pnl
    };

    try {
      await fetch("https://script.google.com/macros/s/AKfycbyEizdDJ_a7h9UsmQ11AgXjQUawkddKg9q1876-0-T0JPg1NK9ABBVSYuMCn0APyOLV/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        mode: "no-cors"
      });
    } catch (err) {
      console.error("Google Sheet error", err);
    }

    form.reset();
    entriesDiv.innerHTML = `<div class="entry"><strong>${data.date}</strong> — ${data.direction} | Entry: ${data.entry} | Exit: ${data.exit || '(open)'}</div>` + entriesDiv.innerHTML;
  });
});
