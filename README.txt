# T-SA - Technical Smart Assistant

<div align="center">

![T-SA Logo](https://via.placeholder.com/150?text=T-SA)

**AI Destekli Teknik Asistan Platformu**

[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?logo=google)](https://ai.google.dev/)

[Demo](#) • [Dokümantasyon](#) • [Kurulum](#kurulum) • [Özellikler](#özellikler)

</div>

---

## 📖 Hakkında

T-SA (Technical Smart Assistant), yapay zeka destekli teknik bir asistondır. Döküman analizi, proje sorgulama ve akıllı öneriler sunar. T-Ecosystem ailesinin AI uygulamasıdır.

### Neden T-SA?

- 🤖 **AI Destekli Analiz**: Google Gemini Pro ile güçlendirilmiş
- 📄 **Döküman Analizi**: PDF, DXF, datasheet parsing
- 🔍 **Akıllı Sorgulama**: Doğal dil ile sistem sorgulama
- 📊 **Pazar Analizi**: Fiyat ve tedarikçi karşılaştırma
- 🔗 **Ekosistem Entegrasyonu**: UPH, ENV-I, Weave ile bağlantı

---

## ✨ Özellikler

### Döküman Analizi

- **PDF Analizi**: Teknik döküman parsing
- **DXF Analizi**: CAD çizim yorumlama
- **OCR**: Görsel metin tanıma
- **BOM Çıkarımı**: Malzeme listesi oluşturma

### Datasheet Analizi

- Teknik spesifikasyon çıkarımı
- Parametre tablolaştırma
- Ürün karşılaştırma
- Uyumluluk kontrolü

### Pazar Analizi

- Fiyat karşılaştırma
- Tedarikçi listesi
- Alternatif ürün önerisi
- Lead time tahmini

### Proje Analizi (UPH)

- Proje durumu sorgulama
- Risk değerlendirme
- Kaynak optimizasyonu
- Timeline önerileri

### Envanter Analizi (ENV-I)

- Stok durumu sorgulama
- Düşük stok uyarıları
- Tüketim trendi analizi
- Sipariş önerileri

### Chat Arayüzü

- Doğal dil sorgulama
- Konuşma geçmişi
- Dosya yükleme
- Bağlam takibi

### Entegrasyonlar

- **UPH**: Proje analizi
- **ENV-I**: Stok sorgulama
- **Weave**: Şematik analiz

---

## 🛠️ Teknoloji Yığını

| Kategori   | Teknoloji         |
| ---------- | ----------------- |
| Build Tool | Vite 5            |
| Framework  | React 19          |
| Dil        | TypeScript 5      |
| AI Engine  | Google Gemini Pro |
| Storage    | IndexedDB         |
| Stil       | Tailwind CSS 4    |
| Animasyon  | Framer Motion     |

---

## 📦 Kurulum

### Gereksinimler

- Node.js 18+
- pnpm

### Adımlar

```bash
# Repo'yu klonla
git clone https://github.com/your-repo/T-SA.git
cd T-SA/code

# Bağımlılıkları yükle
pnpm install

# Geliştirme sunucusunu başlat
pnpm dev
```

### Ortam Değişkenleri

`.env` dosyası oluşturun:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
```

---

## 📁 Proje Yapısı

```
code/
├── components/
│   ├── ResultView.tsx             # Analiz sonuçları
│   ├── ProductCard.tsx            # Ürün kartı
│   ├── FileUpload.tsx             # Dosya yükleme
│   ├── DatasheetComparisonModal.tsx # Datasheet karşılaştırma
│   ├── MarketAnalysisModal.tsx    # Pazar analizi
│   ├── RFQModal.tsx               # Teklif talebi
│   ├── TutorialModal.tsx          # Kullanım kılavuzu
│   ├── WelcomeScreen.tsx          # Karşılama
│   ├── geminiService.ts           # AI servis
│   └── types.ts                   # Tip tanımları
├── App.tsx                        # Ana uygulama
└── main.tsx                       # Entry point
```

---

## 🤖 AI Yetenekleri

### Döküman Analizi

```
Girdi: PDF/DXF dosyası
Çıktı:
├── Özet
├── Ürün listesi (BOM)
├── Teknik spesifikasyonlar
├── Uyarılar
└── Öneriler
```

### Proje Sorgulama

```
Örnek Sorgular:
├── "Fabrika Otomasyon projesinin durumu nedir?"
├── "Bu ay hangi projeler teslim edilecek?"
├── "Bütçe aşımı olan projeler hangileri?"
└── "Risk skoru yüksek projeler?"
```

### Stok Sorgulama

```
Örnek Sorgular:
├── "10kΩ direnç stokta var mı?"
├── "Düşük stoklu ürünler hangileri?"
├── "LM7805 için alternatif öner"
└── "Bu ay sipariş edilmesi gereken ürünler?"
```

---

## 🎨 Ekran Görünümü

```
┌─────────────────────────────────────────────────────────┐
│  [T-SA Logo]                      [Tema] [Yeni Sohbet]  │
├─────────────┬───────────────────────────────────────────┤
│             │                                           │
│ Geçmiş      │  [AI] Merhaba! Nasıl yardımcı olabilirim? │
│             │                                           │
│ Bugün       │            [User] Bu PDF'i analiz et      │
│ ├─ Proje..  │                   📎 teknik.pdf           │
│ └─ BOM..    │                                           │
│             │  [AI] 47 ürün tespit ettim:               │
│ Dün         │       • 23 Direnç                         │
│ ├─ DXF..    │       • 12 Kondansatör                    │
│ └─ Stok..   │       • 8 IC                              │
│             │                                           │
│             │       [Detaylı Liste] [ENV-I Export]      │
├─────────────┼───────────────────────────────────────────┤
│             │ [📎 Dosya] [Mesajınızı yazın...    ] [➤] │
└─────────────┴───────────────────────────────────────────┘
```

---

## 📊 Analiz Sonuç Yapısı

```typescript
interface AnalysisResult {
  id: string;
  fileName: string;
  summary: string;
  products: ProductInfo[];
  warnings: string[];
  recommendations: string[];
  specifications?: Record<string, string>;
  analyzedAt: Date;
  processingTime: number;
}

interface ProductInfo {
  name: string;
  model?: string;
  manufacturer?: string;
  quantity: number;
  estimatedPrice?: number;
  inStock?: boolean;
  alternatives?: string[];
}
```

---

## 🔗 T-Ecosystem Entegrasyonu

```
┌─────────┐          ┌─────────┐
│   UPH   │◄────────►│  T-SA   │◄───── AI Analiz (Merkez)
└─────────┘          └────┬────┘
                          │
┌─────────┐          ┌────▼────┐
│  ENV-I  │◄────────►│ Sorgu   │
└─────────┘          └─────────┘
     │
┌────▼────┐
│  Weave  │◄───── Şematik analiz
└─────────┘
```

---

## 🎨 Tema Desteği

- **Dark Mode**: Koyu tema (varsayılan)
- **Light Mode**: Açık tema
- **High Contrast**: Yüksek kontrast

---

## 📄 Lisans

Bu proje özel lisans altındadır.

---

<div align="center">

**T-Ecosystem** tarafından ❤️ ile geliştirildi

</div>
