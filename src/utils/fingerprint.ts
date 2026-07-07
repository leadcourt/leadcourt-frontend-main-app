export const getDeviceFingerprint = (): string => {
  try {
    // 1. Check if a device ID already exists in LocalStorage
    const KEY = "lc_device_id";
    const existing = localStorage.getItem(KEY);
    if (existing && existing.length >= 16) {
      return existing;
    }

    // 2. Generate a new fingerprint by hashing canvas + browser characteristics
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    let canvasData = "canvas-unsupported";
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("LeadCourt, <canvas> fingerprinting", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("LeadCourt, <canvas> fingerprinting", 4, 17);
      canvasData = canvas.toDataURL();
    }

    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const rawFingerprint = `${navigator.userAgent}||${navigator.language}||${timeZone}||${screenInfo}||${canvasData}`;

    // Cyrb53 fast hash algorithm (53-bit hash)
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0, ch; i < rawFingerprint.length; i++) {
      ch = rawFingerprint.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const hash = ((h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0'));

    // 3. Fallback UUID generation to combine with hash for maximum uniqueness
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    const hexParts: string[] = [];
    array.forEach((b) => hexParts.push(b.toString(16).padStart(2, '0')));
    const uuid = hexParts.join("");

    const finalFingerprint = `dev_${hash}_${uuid.substring(0, 16)}`;
    
    // Save to LocalStorage
    localStorage.setItem(KEY, finalFingerprint);
    return finalFingerprint;
  } catch (e) {
    console.error("Device fingerprinting failed:", e);
    // Simple random fallback
    return "dev_error_" + Math.random().toString(36).substring(2, 18);
  }
};
