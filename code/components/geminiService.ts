import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Product, SpecificationItem, MarketAnalysisResult, MarketSearchPreferences } from "../types";

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

// Helper to extract text from DOCX
async function extractTextFromDocx(base64Data: string): Promise<string> {
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
    }
  },
  required: ["name", "category", "specifications"]
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

const ANALYSIS_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "Teknik içeriğin Türkçe yönetici özeti." },
    products: {
      type: Type.ARRAY,
      items: PRODUCT_SCHEMA
    },
    generalProvisions: GENERAL_PROVISIONS_SCHEMA
  },
  required: ["products", "summary", "generalProvisions"]
};

// Main PDF/DOCX Analysis Function
export const analyzeTechnicalPdf = async (base64Data: string, mimeType: string, pageRange?: string): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelId = "gemini-3-pro-preview";

    const rangeInstruction = pageRange && pageRange.trim().length > 0
      ? `\n\nODAKLANILACAK KAPSAM/SAYFA: Sadece "${pageRange}" aralığındaki veya bölümlerindeki teknik verileri analiz et. Belgenin geri kalanını göz ardı et.`
      : "";

    const promptText = `
      Sen uzman bir Teknik Şartname Analistisin.
      
      GÖREV:
      Sağlanan belgedeki teknik gereksinimleri ve genel şartları eksiksiz bir şekilde yapılandırılmış veriye dönüştür.
      ${rangeInstruction}

      KRİTİK TALİMATLAR:
      1. **TÜRKÇE ÇIKTI**: Ürün açıklamaları, özet ve kategoriler Türkçe olmalıdır.
      2. **Eksiksiz**: Hiçbir detayı atlama. Bir tabloda 100 satır varsa, 100 özellik çıkar.
      3. **Gizli Detaylar**: Dipnotlara, başlıklara ve çizim notlarına dikkat et.
      4. **Gruplama**: Özellikleri mantıklı gruplara ayır (Mekanik, Elektrik vb.).
      5. **Değerler**: Orijinal değerleri koru ("10 +/- 0.5" ise aynen yaz).
      6. **Genel Hükümler**: Ürün dışı şartları (Garanti, Kurulum, Eğitim vb.) "generalProvisions" altına topla.

      Belgedeki her bir farklı ürünü veya kalem grubunu ayrı ayrı çıkar.
    `;

    const parts: any[] = [];
    const isDocx = mimeType.includes('wordprocessingml') || mimeType.includes('docx');

    if (isDocx) {
      // Convert DOCX to text client-side
      const extractedText = await extractTextFromDocx(base64Data);
      parts.push({ text: `BELGE İÇERİĞİ:\n${extractedText}` });
    } else {
      // PDF handled by Gemini
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
        temperature: 0.0, // Strict deterministic output for stability
        seed: 42 // Seed for reproducibility
      }
    });

    const text = response.text;
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
      summary: json.summary || "Analiz tamamlandı.",
      generalProvisions: json.generalProvisions
    };

  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};

// Streaming Market Search Function
export const performMarketSearchStream = async function* (product: Product, prefs?: MarketSearchPreferences) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelId = "gemini-3-pro-preview";
    
    const specsText = product.specifications
      .filter(s => s.criticality !== 'Optional')
      .map(s => `[Ref: ${s.sourceReference || 'Genel'}] ${s.parameter}: ${s.value} ${s.unit || ''}`)
      .join('\n');

    const region = prefs?.region || "Global (Mümkünse Türkiye Distribütörü)";
    const priority = prefs?.priority || "Balanced";
    const notes = prefs?.additionalNotes || "Yok";

    const prompt = `
      Aşağıdaki teknik özelliklere sahip, piyasada bulunabilen gerçek ürünleri bulman gerekiyor.
      
      ÜRÜN: ${product.name}
      AÇIKLAMA: ${product.description}
      STANDARTLAR: ${product.complianceStandards.join(', ') || 'Belirtilmemiş'}
      
      ARAMA TERCİHLERİ:
      - Hedef Bölge: ${region}
      - Öncelik: ${priority} (Price=Uygun Fiyat, Quality=En Yüksek Kalite, Speed=Hızlı Temin)
      - Ek Notlar: ${notes}

      GEREKSİNİM LİSTESİ (Referanslı):
      ${specsText}
      
      ARAMA STRATEJİSİ:
      1. 🚨 **BİRİNCİL**: Resmi Web Siteleri ve Yetkili Distribütörler.
      2. **İKİNCİL**: Endüstriyel pazar yerleri.
      
      GÖREV:
      1. Şartnameye en uygun 3 REEL piyasa ürününü tespit et.
      2. Her ürün için REKABETÇİ FİYAT bilgisi bul.
      3. **TEKNİK NOT**: Eğer ürün bir özelliğe (Voltaj, Boyut, Kapasite vb.) tam uymuyorsa veya alternatif öneriliyorsa, bunu açıklayan kısmı **kırmızı ve altı çizili** olacak şekilde vurgula. (HTML style attribute kullanma, sadece metin içinde belirt <span class="tech-note">...</span>, UI bunu işleyecek).
      4. Uyumluluk Matrisi oluştur.
      5. Çıktı tamamen TÜRKÇE olmalıdır.
      
      FORMATLAMA:
      - Standart HTML etiketleri kullan. Markdown kullanma.
      - Her ürün için <h3>[Marka] - [Model]</h3> formatını kullan.
      - Hemen altına <div class="price-tag">🏷️ [Fiyat] | 🏭 [Kaynak/Üretici]</div> ekle.
      - Teknik açıklama kısmında, eğer bir uyumsuzluk veya önemli not varsa <span class="tech-note">BU KISIM ÖNEMLİDİR...</span> şeklinde işaretle.
      - Tablo: <th>Ref</th>, <th>Şartname</th>, <th>Ürün Değeri</th>, <th>Durum</th>
      
      TABLO MANTIĞI:
      - 'Durum': "✅ Uygun", "⚠️ Kısmi", veya "❌ Uygun Değil".

      Lütfen 3 farklı ürün için bu derinlemesine analizi yap.
    `;

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
    throw new Error("Piyasa araştırması yapılamadı.");
  }
};

// Streaming Datasheet Comparison Function
export const compareWithDatasheetsStream = async function* (product: Product, files: { name: string, base64: string, mimeType?: string }[]) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelId = "gemini-3-pro-preview";

    const specsText = product.specifications
      .filter(s => s.criticality !== 'Optional')
      .map(s => `[Ref: ${s.sourceReference || 'Genel'}] ${s.parameter}: ${s.value} ${s.unit || ''}`)
      .join('\n');

    const prompt = `
      Sen kıdemli bir Teknik Satın Alma Mühendisisin.
      
      GÖREV:
      Ekteki ${files.length} adet dosyayı (Datasheet), aşağıda belirtilen ŞARTNAME GEREKSİNİMLERİ ile kıyasla.
      
      ŞARTNAME ÜRÜNÜ: ${product.name}
      GEREKSİNİM LİSTESİ:
      ${specsText}
      
      İSTENEN ÇIKTI (TÜRKÇE):
      1. Yüklenen her bir dosya/ürün için detaylı bir "Teknik Uyumsuzluk Analizi" yap.
      2. Hangi dosyanın/ürünün şartnameye EN UYGUN olduğunu net bir şekilde belirt.
      3. Her dosya için bir HTML Tablosu (Uyumluluk Matrisi) oluştur.
      4. **Eğer daha önce bir piyasa araştırması raporu sunulduysa, o rapora atıfta bulunarak revizyon yap.**
      
      FORMATLAMA:
      - Her dosya için <h3>[Dosya Adı] Analizi</h3> başlığı at.
      - Altına genel bir değerlendirme yaz (Örn: "Bu ürün sıcaklık kriterini sağlamıyor.").
      - Sonra bir <table> oluştur: <th>Gereksinim (Ref)</th>, <th>Şartname Değeri</th>, <th>Datasheet Değeri</th>, <th>Durum</th>
      - 'Durum' sütunu için: "✅", "⚠️", "❌" kullan.
      
      SONUÇ:
      En sonda <h2>🏆 KAZANAN ÜRÜN & NEDENİ</h2> başlığı altında bir özet geç.
    `;

    const parts: any[] = [{ text: prompt }];
    
    // Process files sequentially
    for (const file of files) {
      const isDocx = file.mimeType?.includes('wordprocessingml') || file.name.endsWith('.docx');
      
      if (isDocx) {
        // Convert DOCX to text
        const text = await extractTextFromDocx(file.base64);
        parts.push({ text: `\n\n--- DOSYA BAŞLANGICI: ${file.name} ---\n${text}\n--- DOSYA SONU ---\n` });
      } else {
        // Assume PDF
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