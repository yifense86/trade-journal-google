
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("tradeForm");
  const entriesDiv = document.getElementById("entries");

  const createField = (label, name, type = "text", required = false, options = []) => {
    const wrapper = document.createElement("label");
    wrapper.textContent = label;
    let input;
    if (type === "select") {
      input = document.createElement("select");
      input.name = name;
      if (!required) input.innerHTML += '<option value="">(optional)</option>';
      options.forEach(opt => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        input.appendChild(o);
      });
    } else if (type === "textarea") {
      input = document.createElement("textarea");
      input.name = name;
    } else {
      input = document.createElement("input");
      input.type = type;
      input.name = name;
      if (type === "file") input.multiple = true;
    }
    if (required) input.required = true;
    wrapper.appendChild(input);
    form.appendChild(wrapper);
  };

  const fields = [
    ["Date", "date", "date", true],
    ["Direction", "direction", "select", true, ["Long", "Short"]],
    ["R/R", "rr", "select", false, ["1R", "1.5R", "2R", "2.5R", "3R", "3R+"]],
    ["Entry Price", "entry", "number", true],
    ["Entry Tag", "entryTag", "select", false, [
      "Good Entry - After Liquidity Sweep", "Good Entry - at OB", "Good Entry - at New High/Low",
      "Entered Early - Before New High/Low", "Entered Late - After High/Low",
      "Bull Momentum Trade + MAC", "Bull Momentum Trade + Spoofs", "Bear Momentum Trade + Spoofs"
    ]],
    ["Exit Price", "exit", "number", false],
    ["Exit Tag", "exitTag", "select", false, [
      "Premature Exit at Loss/Near Entry", "Stopped Out in Significant Profit",
      "Held to Target", "1R Breakeven", "Stop Loss Hit"
    ]],
    ["Taker Ratio", "takerRatio", "select", false, ["Strong Buy", "Strong Sell"]],
    ["Divergences", "divergences", "select", false, [
      "4H Bulldiv", "4H Bulldiv + 1D Bulldiv", "4H Beardiv", "4H Beardiv + 1D Beardiv"
    ]],
    ["MAC Eclipse", "macEclipse", "select", false, ["Yes", "No"]],
    ["Setup", "setup", "textarea", false],
    ["Opening Notes", "openingNotes", "textarea", false],
    ["Notes (Emotions, Mistakes, Outcome)", "notes", "textarea", false],
    ["Opening Screenshots", "openingScreenshotFiles", "file", false],
    ["Closing Screenshots", "closingScreenshotFiles", "file", false]
  ];

  fields.forEach(([label, name, type, required, options]) =>
    createField(label, name, type, required, options || [])
  );

  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "Save Entry";
  form.appendChild(button);

  const uploadScreenshot = async (file) => {
    const formData = new FormData();
    formData.append("screenshot", file);
    try {
      const res = await fetch("https://b56e62c0-ef1f-45ae-abac-92f2f04da756-00-q2xhkf1bhchx.picard.replit.dev/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      return data.link;
    } catch (e) {
      console.error("Upload failed", e);
      return "";
    }
  };

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

    const getLinks = async (inputName) => {
      const input = form.querySelector(`[name="${inputName}"]`);
      const files = input.files ? Array.from(input.files) : [];
      return await Promise.all(files.map(uploadScreenshot));
    };

    data.openingScreenshotLinks = await getLinks("openingScreenshotFiles");
    data.closingScreenshotLinks = await getLinks("closingScreenshotFiles");

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
