
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("tradeForm");
  const entriesDiv = document.getElementById("entries");

  const createInput = (labelText, name, type = "text", isOptional = false) => {
    const label = document.createElement("label");
    label.textContent = labelText;

    const input = document.createElement("input");
    input.type = type;
    input.name = name;
    if (!isOptional) input.required = true;

    label.appendChild(input);
    return label;
  };

  const createSelect = (labelText, name, options = [], isOptional = false) => {
    const label = document.createElement("label");
    label.textContent = labelText;

    const select = document.createElement("select");
    select.name = name;
    if (!isOptional) select.required = true;

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = isOptional ? "(optional)" : "Select";
    select.appendChild(defaultOption);

    options.forEach(opt => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      select.appendChild(option);
    });

    label.appendChild(select);
    return label;
  };

  const createTextArea = (labelText, name) => {
    const label = document.createElement("label");
    label.textContent = labelText;

    const textarea = document.createElement("textarea");
    textarea.name = name;

    label.appendChild(textarea);
    return label;
  };

  const createFileInput = (labelText, name) => {
    const label = document.createElement("label");
    label.textContent = labelText;

    const input = document.createElement("input");
    input.type = "file";
    input.name = name;
    input.multiple = true;

    label.appendChild(input);
    return label;
  };

  const formElements = [
    createInput("Date", "date", "date"),
    createSelect("Direction", "direction", ["Long", "Short"]),
    createSelect("R/R", "rr", ["1R", "1.5R", "2R", "2.5R", "3R", "3R+"], true),
    createInput("Entry Price", "entry", "number"),
    createSelect("Entry Tag", "entryTag", [
      "Good Entry - After Liquidity Sweep", "Good Entry - at OB", "Good Entry - at New High/Low",
      "Entered Early - Before New High/Low", "Entered Late - After High/Low",
      "Bull Momentum Trade + MAC", "Bull Momentum Trade + Spoofs", "Bear Momentum Trade + Spoofs"
    ], true),
    createInput("Exit Price", "exit", "number", true),
    createSelect("Exit Tag", "exitTag", [
      "Premature Exit at Loss/Near Entry", "Stopped Out in Significant Profit", "Held to Target",
      "1R Breakeven", "Stop Loss Hit"
    ], true),
    createSelect("Taker Ratio", "takerRatio", ["Strong Buy", "Strong Sell"], true),
    createSelect("Divergences", "divergences", [
      "4H Bulldiv", "4H Bulldiv + 1D Bulldiv", "4H Beardiv", "4H Beardiv + 1D Beardiv"
    ], true),
    createSelect("MAC Eclipse", "macEclipse", ["Yes", "No"], true),
    createTextArea("Setup Description (optional):", "setup"),
    createTextArea("Opening Notes:", "openingNotes"),
    createTextArea("Notes (Emotions, Mistakes, Outcome):", "notes"),
    createFileInput("Upload Opening Screenshots:", "openingScreenshotFiles"),
    createFileInput("Upload Closing Screenshots:", "closingScreenshotFiles")
  ];

  formElements.forEach(el => form.appendChild(el));

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = "Save Entry";
  form.appendChild(submitBtn);
});
