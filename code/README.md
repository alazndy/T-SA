# T-SA: Technical Specification Analysis

![Status](https://img.shields.io/badge/Status-Beta-amber) ![License](https://img.shields.io/badge/License-MIT-green) ![Tech](https://img.shields.io/badge/Tech-React%20%7C%20Gemini%20AI%20%7C%20Vite-F59E0B)

**T-SA** (Technical Specification Analysis) is an intelligent document processing tool powered by **Google Gemini 1.5**. It automates the tedious task of reading, parsing, and verifying complex technical specifications, bidding documents, and compliance sheets.

## 🚀 Capabilities & Features

### 🤖 AI-Powered Analysis

- **Gemini 1.5 Pro Integration**: Uses advanced LLMs to "read" technical documents as a human engineer would.
- **Requirement Extraction**: Automatically identifies and lists "Must-Haves", "Should-Haves", and strict compliance clauses.
- **Context Awareness**: Understands engineering terminology and specification hierarchies.

### 📄 Multi-Format Ingestion

- **PDF Processing**: OCR-like text extraction and structural parsing of PDF spec sheets.
- **Excel/Word Support**: Native handling of `.xlsx` and `.docx` files commonly used in bidding.
- **Bulk Analysis**: Upload multiple related documents (e.g., "General Specs", "Electrical Specs", "Mechanical Specs") for a holistic review.

### 🔍 Compliance Matrix Generation

- **Auto-Matrix**: Generates a line-by-line compliance table (Excel exportable) ready for bid submission.
- **Gap Analysis**: Highlights missing or vague requirements in your current proposal vs. the client's spec.
- **Confidence Scoring**: AI assigns a confidence score to each extracted requirement.

### 📊 Reporting & Export

- **PDF Reports**: Detailed analysis summaries with executive highlights.
- **Excel Export**: Clean, structured data exports for integration with UPH or ENV-I.

## 🛠️ Technology Architecture

- **Frontend**: **React 19** + **Vite**.
- **AI Engine**: **Google Generative AI SDK** (Gemini Pro/Flash models).
- **Document Processing**:
  - `pdfjs-dist` for PDF rendering and text parsing.
  - `xlsx` (SheetJS) for spreadsheet manipulation.
- **Styling**: Tailwind CSS.

## 📂 Project Structure

```bash
code/src/
├── components/
│   ├── Upload/      # Drag-and-drop file handlers
│   ├── Results/     # Analysis visualization
│   └── Diff/        # Compare multiple specs (diffing)
├── services/
│   ├── geminiService.ts # AI prompt engineering & API calls
│   └── parser.ts        # File type specific parsers
└── types/           # Spec & Requirement data models
```

## 🏁 Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm
- Google Gemini API Key

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/alazndy/T-SA.git
    cd T-SA/code
    ```

2.  **Install Dependencies**

    ```bash
    pnpm install
    ```

3.  **Configuration**
    Create a `.env` file:

    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run Development Server**

    ```bash
    pnpm dev
    ```

    Open [http://localhost:5173](http://localhost:5173) to use the analyzer.

---

Part of the **T-Ecosystem**.
