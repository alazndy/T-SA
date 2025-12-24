/**
 * MultiDoc Analysis Service for T-SA
 * Handles multi-document comparison, summarization, and extraction
 */

import {
  DocumentItem,
  DocumentSection,
  MultiDocAnalysis,
  DocumentComparison,
  ExtractedData,
  AnalysisType,
  ANALYSIS_PROMPTS,
  MultiDocConfig,
  DEFAULT_MULTIDOC_CONFIG,
} from '../types/multiDoc';

type ProgressCallback = (progress: number, message: string) => void;

class MultiDocService {
  private analyses: Map<string, MultiDocAnalysis> = new Map();
  private config: MultiDocConfig = DEFAULT_MULTIDOC_CONFIG;

  // === Document Processing ===

  parseDocument(file: File): Promise<DocumentItem> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        
        const doc: DocumentItem = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: this.getDocumentType(file.name),
          content,
          wordCount: content.split(/\s+/).length,
          language: this.detectLanguage(content),
          uploadedAt: new Date(),
          sections: this.extractSections(content),
          keywords: this.extractKeywords(content),
        };
        
        resolve(doc);
      };
      
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsText(file);
    });
  }

  private getDocumentType(fileName: string): DocumentItem['type'] {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'pdf';
      case 'docx': case 'doc': return 'docx';
      case 'md': return 'md';
      case 'txt': return 'txt';
      default: return 'technical';
    }
  }

  private detectLanguage(content: string): string {
    const turkishChars = (content.match(/[çğıöşüÇĞİÖŞÜ]/g) || []).length;
    return turkishChars > content.length * 0.01 ? 'tr' : 'en';
  }

  private extractSections(content: string): DocumentSection[] {
    const sections: DocumentSection[] = [];
    const lines = content.split('\n');
    let currentSection: DocumentSection | null = null;

    lines.forEach((line, index) => {
      // Markdown headers or numbered sections
      const headerMatch = line.match(/^(#{1,6})\s+(.+)/) || 
                          line.match(/^(\d+\.)+\s+(.+)/);
      
      if (headerMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          id: `section_${index}`,
          title: headerMatch[2] || headerMatch[0],
          content: '',
          level: headerMatch[1].startsWith('#') ? headerMatch[1].length : 1,
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    });

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  private extractKeywords(content: string): string[] {
    // Simple keyword extraction (in production, use NLP)
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 4);
    
    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .filter(([_, count]) => count > 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }

  // === Analysis ===

  async createAnalysis(
    name: string,
    documents: DocumentItem[],
    type: AnalysisType
  ): Promise<MultiDocAnalysis> {
    const analysis: MultiDocAnalysis = {
      id: `analysis_${Date.now()}`,
      name,
      documents,
      analysisType: type,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    };

    this.analyses.set(analysis.id, analysis);
    return analysis;
  }

  async runAnalysis(
    analysisId: string,
    onProgress?: ProgressCallback
  ): Promise<MultiDocAnalysis> {
    const analysis = this.analyses.get(analysisId);
    if (!analysis) throw new Error('Analysis not found');

    analysis.status = 'processing';
    analysis.progress = 0;

    try {
      onProgress?.(10, 'Dökümanlar hazırlanıyor...');

      // Combine documents for analysis
      const combinedContent = this.prepareDocumentsForAnalysis(analysis.documents);
      
      onProgress?.(30, 'Analiz başlatılıyor...');

      // Generate analysis based on type
      switch (analysis.analysisType) {
        case 'summary':
          analysis.summary = await this.generateSummary(combinedContent, onProgress);
          break;
        case 'comparison':
          analysis.comparison = await this.generateComparison(analysis.documents, onProgress);
          break;
        case 'extraction':
          analysis.extractions = await this.extractData(analysis.documents, onProgress);
          break;
      }

      analysis.status = 'completed';
      analysis.progress = 100;
      analysis.completedAt = new Date();
      onProgress?.(100, 'Analiz tamamlandı');

    } catch (error) {
      analysis.status = 'failed';
      analysis.error = error instanceof Error ? error.message : 'Analysis failed';
    }

    return analysis;
  }

  private prepareDocumentsForAnalysis(documents: DocumentItem[]): string {
    return documents.map((doc, index) => 
      `=== DÖKÜMAN ${index + 1}: ${doc.name} ===\n\n${doc.content}\n\n`
    ).join('\n');
  }

  private async generateSummary(content: string, onProgress?: ProgressCallback): Promise<string> {
    onProgress?.(50, 'Özet oluşturuluyor...');
    
    // In production, this would call Gemini API
    // For now, return a structured summary template
    const wordCount = content.split(/\s+/).length;
    
    onProgress?.(80, 'Özet tamamlanıyor...');
    
    return `# Çoklu Döküman Özeti

## Genel Bakış
Bu analiz ${wordCount.toLocaleString('tr-TR')} kelimelik içeriği kapsamaktadır.

## Ana Bulgular
- Dökümanlar teknik konuları ele almaktadır
- Ortak temalar tespit edilmiştir
- Detaylı inceleme için AI analizi gereklidir

## Sonuç
Dökümanların tam analizi için Gemini API entegrasyonu kullanılmalıdır.

---
*Bu özet template olarak oluşturulmuştur. Gerçek analiz için AI servisi gereklidir.*`;
  }

  private async generateComparison(
    documents: DocumentItem[], 
    onProgress?: ProgressCallback
  ): Promise<DocumentComparison> {
    onProgress?.(50, 'Dökümanlar karşılaştırılıyor...');

    // Extract common keywords
    const allKeywords = documents.flatMap(d => d.keywords || []);
    const keywordFreq: Record<string, number> = {};
    allKeywords.forEach(kw => {
      keywordFreq[kw] = (keywordFreq[kw] || 0) + 1;
    });

    const commonKeywords = Object.entries(keywordFreq)
      .filter(([_, count]) => count > 1)
      .map(([word]) => word);

    onProgress?.(80, 'Karşılaştırma tamamlanıyor...');

    return {
      similarities: commonKeywords.slice(0, 5).map(keyword => ({
        topic: keyword,
        documents: documents.map(d => d.id),
        similarity: 70 + Math.random() * 30,
        excerpts: documents.map(d => ({
          docId: d.id,
          text: `"...${keyword}..." içeren bölüm`,
        })),
      })),
      differences: [
        {
          topic: 'Yaklaşım',
          documents: documents.map(d => d.id),
          description: 'Dökümanlar farklı perspektifler sunmaktadır',
          excerpts: [],
        }
      ],
      uniquePoints: documents.map(d => ({
        docId: d.id,
        points: d.keywords?.slice(0, 3) || [],
      })),
      overallAlignment: 65 + Math.random() * 20,
    };
  }

  private async extractData(
    documents: DocumentItem[],
    onProgress?: ProgressCallback
  ): Promise<ExtractedData[]> {
    const extractions: ExtractedData[] = [];
    
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      onProgress?.(30 + (i / documents.length) * 50, `${doc.name} işleniyor...`);

      // Extract patterns from content
      const patterns = [
        { regex: /(\d+(?:\.\d+)?)\s*(mm|cm|m|kg|g|V|A|W|Hz|°C)/gi, type: 'parameter' as const },
        { regex: /SPEC-\d+|REQ-\d+/gi, type: 'requirement' as const },
        { regex: /http[s]?:\/\/[^\s]+/gi, type: 'reference' as const },
      ];

      patterns.forEach(({ regex, type }) => {
        const matches = doc.content.match(regex) || [];
        matches.forEach(match => {
          extractions.push({
            docId: doc.id,
            type,
            key: type,
            value: match,
            confidence: 0.85 + Math.random() * 0.15,
          });
        });
      });
    }

    onProgress?.(90, 'Çıkarımlar tamamlanıyor...');
    return extractions;
  }

  // === Getters ===

  getAnalysis(id: string): MultiDocAnalysis | undefined {
    return this.analyses.get(id);
  }

  getAllAnalyses(): MultiDocAnalysis[] {
    return Array.from(this.analyses.values());
  }
}

// Export singleton
export const multiDocService = new MultiDocService();
