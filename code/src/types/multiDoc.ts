/**
 * MultiDoc Types for T-SA
 * Multi-document analysis and summarization
 */

export type DocumentType = 'pdf' | 'docx' | 'txt' | 'md' | 'technical';
export type AnalysisType = 'summary' | 'comparison' | 'extraction' | 'qa';

export interface DocumentItem {
  id: string;
  name: string;
  type: DocumentType;
  url?: string;
  content: string;
  pageCount?: number;
  wordCount: number;
  language: string;
  uploadedAt: Date;
  
  // Extracted data
  metadata?: Record<string, string>;
  sections?: DocumentSection[];
  keywords?: string[];
}

export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  level: number; // Heading level (1-6)
  pageStart?: number;
  pageEnd?: number;
}

export interface MultiDocAnalysis {
  id: string;
  name: string;
  documents: DocumentItem[];
  analysisType: AnalysisType;
  
  // Results
  summary?: string;
  comparison?: DocumentComparison;
  extractions?: ExtractedData[];
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  
  // Timing
  createdAt: Date;
  completedAt?: Date;
}

export interface DocumentComparison {
  similarities: {
    topic: string;
    documents: string[]; // Document IDs
    similarity: number; // 0-100
    excerpts: { docId: string; text: string }[];
  }[];
  
  differences: {
    topic: string;
    documents: string[];
    description: string;
    excerpts: { docId: string; text: string }[];
  }[];
  
  uniquePoints: {
    docId: string;
    points: string[];
  }[];
  
  overallAlignment: number; // 0-100
}

export interface ExtractedData {
  docId: string;
  type: 'specification' | 'requirement' | 'parameter' | 'reference';
  key: string;
  value: string;
  confidence: number;
  location?: string;
}

// Analysis prompts
export const ANALYSIS_PROMPTS: Record<AnalysisType, string> = {
  summary: `Analyze the following documents and provide:
1. A comprehensive summary of all documents
2. Key findings and main points
3. Common themes across documents
4. Important details that stand out`,

  comparison: `Compare the following documents and identify:
1. Similarities in content, approach, or conclusions
2. Key differences and contradictions
3. Unique points in each document
4. Overall alignment between documents`,

  extraction: `Extract structured data from the following documents:
1. Technical specifications
2. Requirements and constraints
3. Key parameters and values
4. References and dependencies`,

  qa: `Based on the provided documents, answer questions accurately:
1. Cite sources for each answer
2. Indicate confidence level
3. Note any conflicting information
4. Suggest related topics`,
};

// Analysis config
export interface MultiDocConfig {
  maxDocuments: number;
  maxTokensPerDoc: number;
  chunkSize: number;
  overlapSize: number;
  language: 'tr' | 'en' | 'auto';
  includeMetadata: boolean;
  extractKeywords: boolean;
}

export const DEFAULT_MULTIDOC_CONFIG: MultiDocConfig = {
  maxDocuments: 10,
  maxTokensPerDoc: 50000,
  chunkSize: 4000,
  overlapSize: 200,
  language: 'auto',
  includeMetadata: true,
  extractKeywords: true,
};
