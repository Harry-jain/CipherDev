// ============================================================================
// HARDWARE TYPES
// ============================================================================

export type DeviceTier = 'high' | 'mid' | 'low' | 'minimal';

export interface DeviceProfile {
  hasWebGPU: boolean;
  gpuName: string;
  maxBufferSize: number;
  memoryTier: number;
  logicalCores: number;
  isMobile: boolean;
  tier: DeviceTier;
}

// ============================================================================
// CHAT TYPES
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokens?: number;
  speed?: number; // tokens per second
  reasoning?: string; // extracted from <reasoning> tags
}

// ============================================================================
// MODEL TYPES
// ============================================================================

export interface ModelSpec {
  id: string;
  name: string;
  huggingfaceId: string;
  size: number; // in MB
  tiers: DeviceTier[];
  description?: string;
}

export type ModelStatus = 'idle' | 'downloading' | 'compiling' | 'loaded' | 'error';

// ============================================================================
// AUDIT TYPES
// ============================================================================

export type AuditType = 'network' | 'storage' | 'system';

export interface AuditRecord {
  timestamp: number;
  type: AuditType;
  isSafe: boolean;
  description: string;
}

// ============================================================================
// UI TYPES
// ============================================================================

export interface ModalState {
  isOpen: boolean;
  type: 'export' | 'delete' | 'error' | null;
  data?: any;
}

// ============================================================================
// STORE STATE TYPES
// ============================================================================

export interface ChatState {
  messages: ChatMessage[];
  isGenerating: boolean;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateLastMessage: (content: string, partial?: boolean) => void;
  setGenerating: (isGenerating: boolean) => void;
  clearHistory: () => void;
}

export interface HardwareState {
  deviceProfile: DeviceProfile | null;
  setDeviceProfile: (profile: DeviceProfile) => void;
}

export interface DownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
  status?: string;
  currentShard?: number;
  totalShards?: number;
  completedShards?: number;
}

export interface ModelState {
  selectedModelId: string | null;
  loadedModelId: string | null;
  modelStatus: ModelStatus;
  downloadProgress: number;
  downloadDetails: DownloadProgress | null;
  compilingProgress: number;
  error: string | null;
  setSelectedModel: (modelId: string) => void;
  setModelStatus: (status: ModelStatus) => void;
  setDownloadProgress: (progress: number) => void;
  setDownloadDetails: (details: DownloadProgress | null) => void;
  setCompilingProgress: (progress: number) => void;
  setLoadedModel: (modelId: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export interface AuditState {
  auditLogs: AuditRecord[];
  isAuditing: boolean;
  setAuditLogs: (logs: AuditRecord[]) => void;
  setAuditing: (isAuditing: boolean) => void;
  addAuditLog: (log: AuditRecord) => void;
}

export interface UIState {
  sidebarOpen: boolean;
  modalState: ModalState;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (type: ModalState['type'], data?: any) => void;
  closeModal: () => void;
}

export type AppState = ChatState & HardwareState & ModelState & AuditState & UIState;

// Made with Bob
