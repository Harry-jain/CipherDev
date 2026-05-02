// ============================================================================
// LLM ENGINE TYPES
// ============================================================================

export interface ProgressDetails {
  currentShard?: number;
  totalShards?: number;
  completedShards?: number;
}

export interface LoadProgress {
  loaded: number;
  total: number;
  status: string;
  details?: ProgressDetails;
}

export interface InferenceEngine {
  loadModel(
    modelId: string,
    onProgress: (progress: LoadProgress) => void
  ): Promise<void>;
  
  generate(
    messages: Array<{ role: string; content: string }>,
    onUpdate: (chunk: string, tokenSpeed?: number) => void,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<void>;
  
  unload(): Promise<void>;
}

export interface ProgressCallback {
  (progress: LoadProgress): void;
}

export interface StreamCallback {
  (chunk: string, tokenSpeed?: number): void;
}

// ============================================================================
// RISK ASSESSMENT TYPES
// ============================================================================

export interface RiskInput {
  age: number;
  location: string;
  healthCondition: string;
  temperature: number; // in Celsius
  humidity?: number;
  heartRate?: number;
}

export type RiskLevel = 'low' | 'medium' | 'high';
export type RiskAction = 'none' | 'medical_kit' | 'rescue';

export interface RiskResult {
  risk: RiskLevel;
  action: RiskAction;
  reason: string;
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ParsedResponse {
  answer: string;
  reasoning?: string;
}

// Made with Bob
