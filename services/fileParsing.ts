// Mammoth.js global declaration
declare global {
  interface Window {
    mammoth: any;
  }
}

// Helper to convert base64 to ArrayBuffer
export function base64ToArrayBuffer(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper to extract text from DOCX
export async function extractTextFromDocx(base64Data: string): Promise<string> {
  if (!window.mammoth) {
    throw new Error("DOCX işleyici (Mammoth.js) yüklenemedi. Lütfen sayfayı yenileyin.");
  }
  try {
    const arrayBuffer = base64ToArrayBuffer(base64Data);
    const result = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
  } catch (e: any) {
    console.error("DOCX Parsing Error:", e);
    throw new Error("DOCX dosyası okunamadı: " + e.message);
  }
}