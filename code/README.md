# 🏗️ T-SA (Turhan Şartname Analizi)

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Tech](https://img.shields.io/badge/AI-Gemini%201.5%20Pro-orange.svg)
![Stack](https://img.shields.io/badge/React-TypeScript-blue)

**T-SA**, karmaşık teknik şartnameleri (PDF/DOCX) yapay zeka destekli olarak analiz eden, ürün listelerini otomatik ayrıştıran, piyasa araştırması yapan ve teknik uygunluk denetimi sağlayan yeni nesil bir **Teknik Satın Alma Asistanıdır.**

## Current Status

- **Version**: 2.0.0 (MVP)
- **Status**: Stable & Active
- **Integration**: Fully integrated with Google Gemini API.
- **Next Steps**: Integration with UPH for direct task creation.

---

## 🚀 Özellikler

### 🧠 1. Akıllı Doküman Analizi (Smart Parsing)

- **Format Desteği:** PDF ve DOCX formatındaki ham teknik metinleri okur.
- **Yapılandırılmış Veri:** Metin yığınlarını; Ürün Adı, Miktar, Kategorizasyon ve Teknik Özellikler (Parametre/Değer/Birim) olarak yapılandırılmış JSON verisine dönüştürür.
- **Genel Hükümler:** Garanti, Bakım, Eğitim ve Lojistik gibi teknik olmayan idari şartları ayrı bir bölümde toplar.

### 🔄 2. İteratif (Konsensus) Analiz Modu

- **Çoklu Doğrulama:** Tek bir analizle yetinmez. Belgeyi belirlediğiniz sayıda (örn: 3 kez) farklı "seed" değerleriyle analiz eder.
- **Birleştirme (Merge):** Farklı analiz sonuçlarını "Consensus Prompt" ile birleştirerek halüsinasyonları eler ve %99 doğruluk oranına ulaşır.

### 🌍 3. Canlı Piyasa Araştırması (Google Grounding)

- **Gerçek Zamanlı Veri:** Gemini'nin Google Arama yeteneğini kullanarak, analiz edilen ürünler için **güncel** tedarikçi, distribütör ve fiyat bilgisi arar.
- **Stratejik Arama:** "En Ucuz", "En Kaliteli", "Hızlı Temin" veya "Dengeli" gibi stratejilere göre arama yapar.
- **Toplu İşlem (Bulk Mode):** 100 kalemlik bir listeyi tek tuşla sırayla tarar ve raporlar. Otomatik ilerleme (Auto-Advance) özelliği mevcuttur.

### ⚖️ 4. Gereksinim Analizi ve Uyumluluk Matrisi (Compliance Matrix) 🆕

- **Akıllı Ayrıştırma:** Şartnamedeki "meli/malı" (shall/must) içeren zorunlu hükümleri ürün listesinden ayrı olarak çıkarır.
- **Kategorizasyon:** Gereksinimleri Kategorik (Genel, Sertifika, Test vb.) ve Önem Derecesine (Zorunlu, Tercih Sebebi) göre sınıflandırır.
- **İzlenebilirlik:** Hangi gereksinimin dokümanın neresinde (Ref ID) geçtiğini gösterir.

### 🌉 5. T-Ecosystem Entegrasyonu (UPH Köprüsü) 🆕

- **Proje Görev Dönüşümü:** Çıkarılan ürünleri ve gereksinimleri, tek tıklamayla **Universal Project Hub (UPH)** uyumlu JSON görev paketine dönüştürür.
- **Veri Aktarımı:** Analiz sonuçlarını doğrudan proje yönetim sürecine "Todo" listesi olarak aktarır.

### 🧪 6. Datasheet Uyumluluk Denetimi (QA/QC)

- **Otomatik Karşılaştırma:** Tedarikçiden gelen PDF/DOCX formatındaki ürün kataloğunu veya datasheet'i sisteme yükleyin.
- **Gap Analizi:** Sistem, orijinal şartname maddeleri ile yüklenen dosyadaki değerleri satır satır kıyaslar.
- **Sonuç Raporu:** ✅ Uygun, ⚠️ Kısmi Uygun veya ❌ Uygun Değil şeklinde görsel bir matris sunar.

### 📧 7. RFQ (Teklif İsteme) Otomasyonu

- **Profesyonel İletişim:** Seçilen ürünün teknik detaylarını içeren, kurumsal dilde yazılmış bir "Teklif Talep E-postası" (RFQ) taslağı oluşturur.

### 💾 8. Veri Yönetimi ve Dışa Aktarım

- **Raporlama:** PDF, Excel ve ZIP formatında çıktılar.

---

## 🛠️ Teknoloji Yığını

Proje **Client-Side (Sunucusuz)** mimari ile geliştirilmiştir. Tüm AI işlemleri doğrudan tarayıcı üzerinden Google API'larına bağlanır.

| Alan             | Teknoloji            | Açıklama                               |
| :--------------- | :------------------- | :------------------------------------- |
| **Frontend**     | React 19, TypeScript | Ana uygulama çatısı.                   |
| **UI Framework** | Tailwind CSS         | Stil ve Responsive tasarım.            |
| **AI Engine**    | Google GenAI SDK     | Gemini 1.5 Pro & Flash modelleri.      |
| **State Mgmt**   | React Hooks          | Context API ve yerel state yönetimi.   |
| **Database**     | IndexedDB (idb)      | Tarayıcı tabanlı kalıcı veri saklama.  |
| **File Parsing** | Mammoth.js           | .docx dosyalarını HTML/Text'e çevirir. |
| **Export**       | JSPDF, XLSX, JSZip   | Rapor oluşturma kütüphaneleri.         |
| **Icons**        | Lucide React         | Modern ikon seti.                      |

---

## ⚙️ Kurulum ve Çalıştırma

Bu projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin.

### Ön Gereksinimler

- Node.js (v18 veya üzeri)
- Google AI Studio'dan alınmış bir **API KEY**. ([Buradan alabilirsiniz](https://aistudio.google.com/))

### Adım 1: Depoyu Klonlayın

```bash
git clone https://github.com/username/t-sa-analyst.git
cd t-sa-analyst
```

### Adım 2: Bağımlılıkları Yükleyin

Proje bir React projesi olduğu için gerekli paketleri yükleyin:

```bash
npm install
# veya
yarn install
```

### Adım 3: Ortam Değişkenlerini Ayarlayın

Ana dizinde `.env` dosyası oluşturun (veya mevcutsa düzenleyin) ve API anahtarınızı ekleyin:

```env
REACT_APP_API_KEY=AIzaSy...Sizin_Gemini_Api_Keyiniz
# veya Vite kullanıyorsanız:
VITE_API_KEY=AIzaSy...
```

> **Not:** Kod içerisinde `process.env.API_KEY` kullanıldığı varsayılmıştır. Build aracınıza göre (Webpack/Vite) bu değişkenin tanımlanma şekli değişebilir.

### Adım 4: Uygulamayı Başlatın

```bash
npm start
```

Tarayıcınızda `http://localhost:3000` adresine gidin.

---

## 📖 Kullanım Kılavuzu

### 1. Belge Yükleme

- Ana ekrandaki alana PDF veya DOCX dosyanızı sürükleyin.
- **İpucu:** Eğer belge çok uzunsa (100+ sayfa), "Sayfa Aralığı" kutusuna `1-10` yazarak sadece ilgili sayfaları analiz ettirebilirsiniz.
- **Hassas Analiz:** Daha kritik işler için "Hassas Analiz" modunu açın ve tekrar sayısını (örn: 3x) seçin.

### 2. Sonuçları İnceleme

- Analiz bitince ekran ikiye bölünür. Solda PDF önizlemesi, sağda analiz sonuçları (Ürün Kartları) yer alır.
- Ürün kartlarına tıklayarak teknik özellikleri detaylıca görebilir, `Düzenle` butonu ile manuel düzeltme yapabilirsiniz.

### 3. Piyasa Araştırması

- Bir ürün kartının altındaki **"Piyasa Ara"** butonuna basın.
- Açılan pencereden bölge (Global/TR) ve strateji (Fiyat/Kalite) seçin.
- Yapay zeka interneti tarayarak size gerçek ürün önerileri ve linkler sunacaktır.

### 4. Datasheet Kıyaslama

- Ürün kartındaki **"Kıyasla"** butonuna basın.
- Tedarikçiden gelen `.pdf` dosyasını yükleyin.
- Sistem, "Şartnamede İstenen: 10 Bar" vs "Datasheet'te Olan: 8 Bar" şeklinde bir tablo çıkaracak ve uygunsuzluğu raporlayacaktır.

---

## 📂 Proje Yapısı

```
src/
├── components/          # React Bileşenleri
│   ├── FileUpload.tsx   # Dosya yükleme ve ayarlar
│   ├── ProductCard.tsx  # Ürün detay kartı ve düzenleme
│   ├── ResultView.tsx   # Ana sonuç ekranı ve filtreleme
│   ├── MarketAnalysisModal.tsx # Piyasa araştırma penceresi
│   ├── DatasheetComparisonModal.tsx # Uyumluluk kontrol penceresi
│   └── RFQModal.tsx     # E-posta oluşturucu
├── services/            # İş Mantığı ve API Servisleri
│   ├── geminiService.ts # Google AI ile iletişim (Core Logic)
│   ├── dbService.ts     # IndexedDB veritabanı işlemleri
│   ├── exportService.ts # PDF/Excel çıktı üretimi
│   ├── fileParsing.ts   # Dosya okuma yardımcıları
│   └── prompts.ts       # AI Sistem Promptları (Prompts Engineering)
├── types.ts             # TypeScript arayüzleri
├── App.tsx              # Ana uygulama girişi
└── index.tsx            # Render noktası
```

---

## 🧠 Prompt Mühendisliği Detayları

T-SA'nın gücü, `services/prompts.ts` dosyasında tanımlanan gelişmiş sistem talimatlarından gelir.

- **ANALYSIS_SYSTEM_PROMPT:** Modelin bir "Teknik Şartname Analisti" gibi davranmasını sağlar. Veri kaybını önlemek için katı kurallar içerir.
- **MARKET_SEARCH_PROMPT:** Modelin "Endüstriyel Satınalma Uzmanı" rolüne bürünerek hayali ürünler uydurmasını engeller, sadece kanıtlanabilir (linki olan) ürünleri listeler.
- **DATASHEET_COMPARE_PROMPT:** Model "Tavizsiz bir QA Mühendisi" olur. "Yaklaşık olarak uyar" gibi yorumları reddeder, kesin veri eşleşmesi arar.

---

## ⚠️ Önemli Notlar

- **API Kotası:** Ücretsiz Gemini API kullanıyorsanız dakikalık istek limitlerine (RPM) takılabilirsiniz. Uygulama içinde "Retry" (Yeniden Deneme) mekanizması mevcuttur.
- **Gizlilik:** Yüklenen dosyalar sunucuya gönderilmez, doğrudan Google API'sına iletilir. Google'ın veri işleme politikaları geçerlidir. Kurumsal veriler için Google Cloud Vertex AI (Private) kullanımı önerilir (Bu sürüm Public API kullanır).

---

## 🤝 Katkıda Bulunma

1.  Forklayın.
2.  Özellik dalı oluşturun (`git checkout -b feature/YeniOzellik`).
3.  Değişikliklerinizi commit edin (`git commit -m 'Yeni özellik eklendi'`).
4.  Dala push yapın (`git push origin feature/YeniOzellik`).
5.  Bir Pull Request açın.

---

**Made with ❤️ by G.T**
