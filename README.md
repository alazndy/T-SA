# T-SA - Teknik Şartname Analiz Platformu

<div align="center">

![T-SA Logo](https://via.placeholder.com/150?text=T-SA)

**AI Destekli Şartname Analizi ve Ürün Kıyaslama Platformu**

[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?logo=google)](https://ai.google.dev/)

[Demo](#) • [Dokümantasyon](#) • [Kurulum](#kurulum) • [Özellikler](#özellikler)

</div>

---

## 📖 Hakkında

T-SA (Technical Specification Analyzer), **teknik şartname analiz platformudur**. İhale şartnameleri, teknik dökümanlar ve proje gereksinimlerini analiz ederek:

- Gereksinim listesi çıkarır
- Uygun ürünleri belirler
- Alternatif ürünleri kıyaslar
- Maliyet analizi yapar

### Neden T-SA?

- 📋 **Şartname Analizi**: PDF/DOCX döküman parsing
- 🔍 **Gereksinim Çıkarma**: Teknik gereksinimleri listele
- ⚖️ **Ürün Kıyaslama**: ENV-I ile eşleştirme ve alternatif önerme
- 📊 **Datasheet Karşılaştırma**: Yan yana spesifikasyon analizi
- 🔗 **Ekosistem Entegrasyonu**: ENV-I stok, UPH proje

---

## 🎯 Ne Yapıyor?

```
┌─────────────────────────────────────────────────────────────┐
│  1. ŞARTNAME ANALİZİ                                       │
│     • İhale şartnamesi PDF yükle                           │
│     • Teknik gereksinimleri çıkar                          │
│     • Standart/norm referanslarını tespit et               │
│                                                             │
│  2. GEREKSİNİM LİSTESİ                                     │
│     • Ürün/malzeme listesi oluştur                         │
│     • Miktar hesapla                                       │
│     • Teknik spesifikasyonları belirle                     │
│                                                             │
│  3. ÜRÜN KILASLAMA                                         │
│     • ENV-I'den uygun ürünleri eşleştir                    │
│     • Alternatif ürün öner                                 │
│     • Fiyat/performans karşılaştır                         │
│                                                             │
│  4. RAPORLAMA                                              │
│     • Gereksinim tablosu                                   │
│     • Ürün eşleştirme raporu                               │
│     • Stok durumu analizi                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Özellikler

### Şartname Analizi

- PDF, DOCX, DXF format desteği
- Görsel dosyalar için OCR
- Sayfa aralığı seçimi
- İteratif analiz (çoklu geçiş)

### Gereksinim Çıkarma

- Teknik spesifikasyon tespiti
- Miktar ve birim çıkarma
- Standart referansları bulma
- Kaynak sayfa numarası

### Ürün Kıyaslama

- ENV-I envanteri ile eşleştirme
- Uyumluluk yüzdesi hesaplama
- Alternatif ürün önerileri
- Fiyat karşılaştırma

### Datasheet Karşılaştırma

- Yan yana spesifikasyon tablosu
- Fark vurgulama
- Güçlü/zayıf yön analizi

### Entegrasyonlar

- **ENV-I**: Stok sorgulama, ürün eşleştirme
- **UPH**: Proje dosya analizi
- **Weave**: Şematik dosya analizi

---

## 🔍 Örnek Sorgulamalar

```
"Bu şartnameyi analiz et ve gerekli ürünleri listele"
"IP67 gereksinimine uygun hangi kameralarımız var?"
"HK-DS2CD2185 ile DH-IPC-HDBW2 karşılaştır"
"Bu ürünün özellikleri şartnameye uyuyor mu?"
"24 port PoE switch stokta var mı?"
```

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

---

## 📦 Kurulum

```bash
cd T-SA/code
pnpm install
pnpm dev
```

### Ortam Değişkenleri

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
```

**Port**: 5173

---

## 🎨 Örnek Kullanım

**Senaryo**: Fabrika güvenlik sistemi ihalesi

1. İhale şartnamesini (PDF) yükle
2. T-SA gereksinimleri analiz eder:
   - Full HD çözünürlük
   - IR gece görüşü 30m
   - IP67 koruma sınıfı
3. ENV-I'den uygun ürünleri eşleştirir
4. Alternatifler ve fiyat karşılaştırması sunar
5. Stok durumu uyarıları verir

---

## 🔗 T-Ecosystem Entegrasyonu

```
UPH (Proje) ──► T-SA (Analiz) ◄── ENV-I (Stok)
                    │
                    └──► Rapor/BOM
```

---

<div align="center">

**T-Ecosystem** tarafından ❤️ ile geliştirildi

</div>
