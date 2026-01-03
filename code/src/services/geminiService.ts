import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Product, SpecificationItem, MarketAnalysisResult, MarketSearchPreferences } from "../types";
import { ANALYSIS_SYSTEM_PROMPT, MARKET_SEARCH_PROMPT, DATASHEET_COMPARE_PROMPT, CONSENSUS_MERGE_PROMPT, RFQ_GENERATOR_PROMPT } from "./prompts";
import { extractTextFromDocx } from "./fileParsing";

// Mammoth.js global declaration
declare global {
  interface Window {
    mammoth: any;
  }
}

// Helper to convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Retry Logic Helper
async function withRetry<T>(
  operation: () => Promise<T>, 
  retries: number = 3, 
  baseDelay: number = 2000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      const isRetryable = 
        error.status === 503 || 
        error.status === 500 || 
        (error.message && (
          error.message.includes('Rpc failed') || 
          error.message.includes('xhr error') || 
          error.message.includes('fetch failed') ||
          error.message.includes('network') ||
          error.message.includes('Ambiguous request') // Retry on routing glitches too
        ));

      if (!isRetryable || i === retries - 1) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      console.warn(`API Attempt ${i + 1} failed. Retrying in ${delay}ms... Error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

const SPECIFICATION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    group: { type: Type.STRING, description: "Özellik kategorisi (örn: 'Mekanik', 'Elektriksel', 'Çevresel', 'Malzeme')" },
    parameter: { type: Type.STRING, description: "Teknik parametre adı (örn: 'Çekme Dayanımı', 'Giriş Voltajı')" },
    value: { type: Type.STRING, description: "İstenen tam değer. Sadeleştirme yapma. (örn: '500 +/- %5', 'Paslanmaz Çelik 316L')" },
    unit: { type: Type.STRING, description: "Ölçü birimi (örn: 'MPa', 'V', 'mm')", nullable: true },
    condition: { type: Type.STRING, description: "Koşul veya bağlam (örn: '@ 25°C', 'Maks', 'Min', 'Not 3')", nullable: true },
    criticality: { type: Type.STRING, description: "Önem derecesi", enum: ["Essential", "Desirable", "Optional"], nullable: true },
    sourceReference: { type: Type.STRING, description: "Belgede bu özelliğin geçtiği yer (örn: 'Madde 4.2.1', 'Tablo 3 Satır 2', 'Sayfa 4'). MUTLAKA DOLDURULMALI." }
  },
  required: ["parameter", "value", "group", "sourceReference"]
};

const PRODUCT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Ürün veya bileşenin tam adı" },
    partNumber: { type: Type.STRING, description: "Varsa Model Numarası veya Parça Kodu", nullable: true },
    quantity: { type: Type.STRING, description: "Varsa istenen miktar", nullable: true },
    category: { type: Type.STRING, description: "Genel kategori" },
    description: { type: Type.STRING, description: "Ürünün detaylı Türkçe açıklaması" },
    specifications: {
      type: Type.ARRAY,
      items: SPECIFICATION_SCHEMA,
      description: "Teknik özelliklerin son derece detaylı ve eksiksiz listesi."
    },
    complianceStandards: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "İlgili tüm standartlar (ISO, TSE, ASTM, DIN vb.)"
    },
    confidenceScore: {
       type: Type.INTEGER,
       description: "Analizin doğruluğuna dair 0-100 arası güven puanı. Eğer belge bulanıksa veya bilgiler eksikse düşük puan ver."
    }
  },
  required: ["name", "category", "specifications", "confidenceScore"]
};

const GENERAL_PROVISIONS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    warrantyConditions: { type: Type.STRING, description: "Garanti süresi, kapsamı ve şartları." },
    maintenanceRequirements: { type: Type.STRING, description: "Bakım, onarım ve servis gereksinimleri." },
    installationAndCommissioning: { type: Type.STRING, description: "Kurulum, montaj ve devreye alma şartları." },
    trainingRequirements: { type: Type.STRING, description: "Personel eğitimi ile ilgili şartlar." },
    deliveryAndLogistics: { type: Type.STRING, description: "Teslimat, paketleme ve lojistik şartları." },
    certificationRequirements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Genel firma veya proje sertifikasyonları (örn: ISO 9001)." },
    otherTerms: { type: Type.STRING, description: "Diğer idari veya teknik genel hükümler." }
  },
  required: ["warrantyConditions", "maintenanceRequirements"]
};

const REQUIREMENT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    reqId: { type: Type.STRING, description: "Gereksinim kimliği (örn: 'R-001', 'REQ-GÜV-02'). Sıralı ver." },
    description: { type: Type.STRING, description: "Gereksinimin tam metni. '...malı/meli' cümlelerini koru." },
    category: { type: Type.STRING, description: "Kategori (örn: 'Fonksiyonel', 'Performans', 'Arayüz', 'Güvenlik')" },
    criticality: { type: Type.STRING, description: "Önem derecesi", enum: ["Mandatory", "Desirable", "Optional"] },
    sourceReference: { type: Type.STRING, description: "Dökümandaki yeri (Madde No, Sayfa No)" }
  },
  required: ["reqId", "description", "category", "criticality", "sourceReference"]
};

const ANALYSIS_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "Teknik içeriğin Türkçe yönetici özeti." },
    products: {
      type: Type.ARRAY,
      items: PRODUCT_SCHEMA
    },
    requirements: {
      type: Type.ARRAY,
      items: REQUIREMENT_SCHEMA,
      description: "Dökümandaki tüm 'meli/malı' içeren teknik ve idari gereksinimlerin listesi."
    },
    generalProvisions: GENERAL_PROVISIONS_SCHEMA
  },
  required: ["products", "summary", "generalProvisions"]
};

const RFQ_RESPONSE_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        subject: { type: Type.STRING },
        body: { type: Type.STRING }
    },
    required: ["subject", "body"]
}

// Internal function to create the analysis request
const createAnalysisRequest = async (base64Data: string, mimeType: string, pageRange?: string, seed?: number) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelId = "gemini-3-pro-preview";

  const rangeInstruction = pageRange && pageRange.trim().length > 0
      ? `\n\nODAKLANILACAK KAPSAM/SAYFA: Sadece "${pageRange}" aralığındaki veya bölümlerindeki teknik verileri analiz et. Belgenin geri kalanını göz ardı et.`
      : "";

  const promptText = ANALYSIS_SYSTEM_PROMPT.replace('{{RANGE_INSTRUCTION}}', rangeInstruction);

  const parts: any[] = [];
  const isDocx = mimeType.includes('wordprocessingml') || mimeType.includes('docx');

  if (isDocx) {
      const extractedText = await extractTextFromDocx(base64Data);
      parts.push({ text: `BELGE İÇERİĞİ:\n${extractedText}` });
  } else {
      parts.push({
          inlineData: {
              mimeType: "application/pdf", 
              data: base64Data
          }
      });
  }

  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
          responseMimeType: "application/json",
          responseSchema: ANALYSIS_RESPONSE_SCHEMA,
          temperature: 0.2, // Slightly higher for variation if needed, or 0 for consistency
          seed: seed
      }
  });

  return response.text;
};

// Main Single Analysis Function
export const analyzeTechnicalPdf = async (base64Data: string, mimeType: string, pageRange?: string): Promise<any> => {
  try {
    const text = await withRetry(() => createAnalysisRequest(base64Data, mimeType, pageRange, 42));

    if (!text) {
      throw new Error("Modelden yanıt alınamadı.");
    }

    const json = JSON.parse(text);
    
    const products: Product[] = (json.products || []).map((p: any, index: number) => ({
      ...p,
      id: `prod-${Date.now()}-${index}`
    }));

    return {
      products,
      requirements: json.requirements || [],
      summary: json.summary || "Analiz tamamlandı.",
      generalProvisions: json.generalProvisions
    };

  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};

// Iterative Analysis with Consensus
export const performIterativeAnalysis = async (
  base64Data: string, 
  mimeType: string, 
  iterationCount: number, 
  pageRange?: string,
  onProgress?: (msg: string) => void
): Promise<any> => {
  const results: any[] = [];
  
  for (let i = 0; i < iterationCount; i++) {
    if (onProgress) onProgress(`Analiz çalıştırılıyor: ${i + 1} / ${iterationCount}`);
    
    // Use different seeds to encourage slight variations or error corrections in the model's stochastic process
    // Or keep them random if seed is optional. Here we use distinct seeds.
    const seed = 42 + i * 100; 
    try {
        const text = await withRetry(() => createAnalysisRequest(base64Data, mimeType, pageRange, seed));
        if (text) {
             results.push(JSON.parse(text));
        }
    } catch (e) {
        console.warn(`Iteration ${i+1} failed`, e);
        // Continue if we have at least one result
    }
  }

  if (results.length === 0) {
      throw new Error("Tüm analiz denemeleri başarısız oldu.");
  }

  if (results.length === 1) {
      if (onProgress) onProgress("Tek sonuç işleniyor...");
      // Just return the single result formatted
      const json = results[0];
      const products: Product[] = (json.products || []).map((p: any, index: number) => ({
        ...p,
        id: `prod-${Date.now()}-${index}`
      }));
      return {
        products,
        summary: json.summary || "Analiz tamamlandı.",
        generalProvisions: json.generalProvisions
      };
  }

  // Merge Phase
  if (onProgress) onProgress("Sonuçlar birleştiriliyor ve doğrulanıyor...");
  return await mergeAnalysisResults(base64Data, mimeType, results);
};

// Merging Logic
const mergeAnalysisResults = async (base64Data: string, mimeType: string, results: any[]): Promise<any> => {
   const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
   const modelId = "gemini-3-pro-preview"; // Use powerful model for merging

   const parts: any[] = [];
   const isDocx = mimeType.includes('wordprocessingml') || mimeType.includes('docx');

   // Add Original Document Context
   if (isDocx) {
       const extractedText = await extractTextFromDocx(base64Data);
       parts.push({ text: `--- ORİJİNAL DÖKÜMAN İÇERİĞİ ---\n${extractedText}\n--- DÖKÜMAN SONU ---` });
   } else {
       parts.push({
           inlineData: {
               mimeType: "application/pdf", 
               data: base64Data
           }
       });
   }

   // Add Analysis Drafts
   let draftsText = "";
   results.forEach((res, idx) => {
       draftsText += `\n\n--- ANALİZ TASLAĞI #${idx + 1} ---\n${JSON.stringify(res, null, 2)}`;
   });
   
   const prompt = CONSENSUS_MERGE_PROMPT.replace('{{COUNT}}', String(results.length));
   parts.push({ text: prompt + draftsText });

   const response = await withRetry(async () => {
       return await ai.models.generateContent({
           model: modelId,
           contents: { parts },
           config: {
               responseMimeType: "application/json",
               responseSchema: ANALYSIS_RESPONSE_SCHEMA,
               temperature: 0.0 // Strict merging
           }
       });
   });

   const text = response.text;
   if (!text) throw new Error("Birleştirme işlemi başarısız oldu.");

   const json = JSON.parse(text);
   const products: Product[] = (json.products || []).map((p: any, index: number) => ({
       ...p,
       id: `prod-merged-${Date.now()}-${index}`
   }));

   return {
       products,
       summary: json.summary,
       generalProvisions: json.generalProvisions
   };
}

// Streaming Market Search Function
export const performMarketSearchStream = async function* (product: Product, prefs?: MarketSearchPreferences) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Use gemini-2.5-flash for tool support stability (fixes Ambiguous Request 404 errors)
    const modelId = "gemini-2.5-flash"; 
    
    const specsText = product.specifications
      .filter(s => s.criticality !== 'Optional')
      .map(s => `[Ref: ${s.sourceReference || 'Genel'}] ${s.parameter}: ${s.value} ${s.unit || ''}`)
      .join('\n');

    const region = prefs?.region || "Global (Mümkünse Türkiye Distribütörü)";
    const priority = prefs?.priority || "Balanced";
    const notes = prefs?.additionalNotes || "Yok";

    const prompt = MARKET_SEARCH_PROMPT
      .replace('{{PRODUCT_NAME}}', product.name)
      .replace('{{PRODUCT_DESC}}', product.description)
      .replace('{{STANDARDS}}', product.complianceStandards.join(', ') || 'Belirtilmemiş')
      .replace('{{REGION}}', region)
      .replace('{{PRIORITY}}', priority)
      .replace('{{NOTES}}', notes)
      .replace('{{SPECS}}', specsText);

    const responseStream = await ai.models.generateContentStream({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    for await (const chunk of responseStream) {
      yield {
         text: chunk.text,
         groundingMetadata: chunk.candidates?.[0]?.groundingMetadata
      };
    }

  } catch (error) {
    console.error("Market Search Error:", error);
    throw new Error("Piyasa araştırması yapılamadı. " + error);
  }
};

// Streaming Datasheet Comparison Function
export const compareWithDatasheetsStream = async function* (product: Product, files: { name: string, base64: string, mimeType?: string }[]) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Keep gemini-3-pro-preview for deep reasoning capabilities required for comparison
    const modelId = "gemini-3-pro-preview";

    const specsText = product.specifications
      .filter(s => s.criticality !== 'Optional')
      .map(s => `[Ref: ${s.sourceReference || 'Genel'}] ${s.parameter}: ${s.value} ${s.unit || ''}`)
      .join('\n');

    const promptText = DATASHEET_COMPARE_PROMPT
      .replace('{{FILE_COUNT}}', String(files.length))
      .replace('{{PRODUCT_NAME}}', product.name)
      .replace('{{SPECS}}', specsText);

    const parts: any[] = [{ text: promptText }];
    
    for (const file of files) {
      const isDocx = file.mimeType?.includes('wordprocessingml') || file.name.endsWith('.docx');
      
      if (isDocx) {
        const text = await extractTextFromDocx(file.base64);
        parts.push({ text: `\n\n--- DOSYA BAŞLANGICI: ${file.name} ---\n${text}\n--- DOSYA SONU ---\n` });
      } else {
        parts.push({
          inlineData: {
            mimeType: "application/pdf",
            data: file.base64
          }
        });
      }
    }

    const responseStream = await ai.models.generateContentStream({
      model: modelId,
      contents: { parts }
    });

    for await (const chunk of responseStream) {
      yield chunk.text;
    }

  } catch (error: any) {
    console.error("Datasheet Analysis Error:", error);
    throw new Error("Datasheet analizi sırasında hata oluştu. " + (error.message || "Dosya okunamadı."));
  }
};

// RFQ Generation Function
export const generateRFQEmail = async (product: Product, language: string = "Türkçe") => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const modelId = "gemini-2.5-flash"; // Flash is good enough for email generation
        
        const specsText = product.specifications
        .filter(s => s.criticality === 'Essential') // Only essentials for RFQ
        .map(s => `- ${s.parameter}: ${s.value} ${s.unit || ''}`)
        .join('\n');

        const prompt = RFQ_GENERATOR_PROMPT
            .replace('{{PRODUCT_NAME}}', product.name)
            .replace('{{QUANTITY}}', product.quantity || "Belirlenecek")
            .replace('{{DESCRIPTION}}', product.description)
            .replace('{{SPECS}}', specsText)
            .replace('{{LANGUAGE}}', language);

        const response = await ai.models.generateContent({
            model: modelId,
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: RFQ_RESPONSE_SCHEMA
            }
        });

        const text = response.text;
        if(!text) throw new Error("E-posta oluşturulamadı.");
        return JSON.parse(text);

    } catch (e: any) {
        console.error("RFQ Error:", e);
        throw new Error("RFQ oluşturulamadı: " + e.message);
    }
}