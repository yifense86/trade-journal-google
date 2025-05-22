// Utility: convert file to base64
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

// Usage inside your form handler:
async function handleScreenshotUpload(inputElement) {
  const files = Array.from(inputElement.files || []);
  const base64Files = await Promise.all(files.map(fileToBase64));
  const links = await Promise.all(base64Files.map(uploadToDrive));
  return links;
}
