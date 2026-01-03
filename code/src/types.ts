
export interface SpecificationItem {
  parameter: string;
  value: string;
  unit?: string;
  condition?: string;
  group?: string; // e.g., "Mechanical", "Electrical", "Environmental"
  criticality?: 'Essential' | 'Desirable' | 'Optional';
  sourceReference?: string; // e.g., "Clause 4.1.2", "Item 5", "Table 1"
}

export interface GeneralProvisions {
  warrantyConditions: string;
  maintenanceRequirements: string;
  installationAndCommissioning: string;
  trainingRequirements: string;
  deliveryAndLogistics: string;
  certificationRequirements: string[];
  otherTerms: string;
}

export interface Requirement {
  reqId: string; // e.g. "R-001", "REQ-1.2"
  description: string; // Full text of the requirement
  category: string; // "Functional", "Performance", "Safety", "Interface"
  criticality: 'Mandatory' | 'Desirable' | 'Optional';
  sourceReference: string; // e.g. "Section 4.1"
}

export interface MarketAnalysisResult {
  content: string; // Rich text analysis from Gemini
  sources: { title: string; uri: string }[]; // Links from Google Search grounding
}

export interface Product {
  id: string; // Generated ID for UI keying
  name: string;
  partNumber?: string;
  quantity?: string;
  category: string;
  description: string;
  specifications: SpecificationItem[];
  complianceStandards: string[];
  confidenceScore?: number; // 0-100 score indicating AI certainty
  marketAnalysis?: MarketAnalysisResult; // Cache for bulk actions
}

export interface AnalysisResult {
  id: string; // Unique ID for history
  version?: number; // Version number for stability checks
  fileName: string;
  timestamp: string;
  products: Product[];
  requirements?: Requirement[];
  generalProvisions?: GeneralProvisions;
  summary: string;
}

export interface MarketSearchPreferences {
  region: string;
  priority: 'Price' | 'Quality' | 'Speed' | 'Balanced';
  additionalNotes?: string;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}