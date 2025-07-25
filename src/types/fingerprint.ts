/**
 * Tipos TypeScript para o sistema de fingerprint
 */

export interface DeviceInfo {
  userAgent: string;
  screenResolution: string;
  timeZone: string;
  language: string;
  canvasHash: string;
  webglHash: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  colorDepth: number;
  pixelRatio: number;
}

export interface FingerprintResult {
  hash: string;
  deviceInfo: DeviceInfo;
  confidence: number; // 0-1, confiança na unicidade
  timestamp: Date;
}

export interface StoredFingerprint {
  hash: string;
  deviceInfo: DeviceInfo;
  confidence: number;
  createdAt: Date;
  lastSeen: Date;
  usageCount: number;
  isBlocked: boolean;
  suspiciousActivity: number;
}

export interface FingerprintValidationResult {
  isValid: boolean;
  isSuspicious: boolean;
  isBlocked: boolean;
  similarity?: number;
  reason?: string;
}

export interface FingerprintChangeDetection {
  hasChanged: boolean;
  similarity: number;
  suspiciousChanges: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface FingerprintServiceConfig {
  enableCanvas: boolean;
  enableWebGL: boolean;
  enableDeviceMemory: boolean;
  suspiciousThreshold: number;
  blockThreshold: number;
  maxUsageCount: number;
  cleanupInterval: number; // em horas
}

export interface FingerprintStorage {
  get(hash: string): Promise<StoredFingerprint | null>;
  set(fingerprint: StoredFingerprint): Promise<void>;
  update(hash: string, updates: Partial<StoredFingerprint>): Promise<void>;
  delete(hash: string): Promise<void>;
  cleanup(olderThan: Date): Promise<number>;
  getAll(): Promise<StoredFingerprint[]>;
  block(hash: string, reason: string): Promise<void>;
  unblock(hash: string): Promise<void>;
}

export interface FingerprintAnalytics {
  totalFingerprints: number;
  uniqueFingerprints: number;
  blockedFingerprints: number;
  suspiciousActivity: number;
  averageConfidence: number;
  topUserAgents: Array<{ userAgent: string; count: number }>;
  topResolutions: Array<{ resolution: string; count: number }>;
  topTimeZones: Array<{ timeZone: string; count: number }>;
}

// Eventos do sistema de fingerprint
export type FingerprintEvent = 
  | 'fingerprint_generated'
  | 'fingerprint_validated'
  | 'suspicious_activity_detected'
  | 'fingerprint_blocked'
  | 'fingerprint_unblocked'
  | 'fingerprint_cleanup';

export interface FingerprintEventData {
  type: FingerprintEvent;
  fingerprint: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface FingerprintEventListener {
  (event: FingerprintEventData): void;
}

// Configurações padrão
export const DEFAULT_FINGERPRINT_CONFIG: FingerprintServiceConfig = {
  enableCanvas: true,
  enableWebGL: true,
  enableDeviceMemory: true,
  suspiciousThreshold: 0.3,
  blockThreshold: 5,
  maxUsageCount: 1000,
  cleanupInterval: 24
};

// Constantes
export const FINGERPRINT_CONSTANTS = {
  MIN_HASH_LENGTH: 8,
  MAX_HASH_LENGTH: 64,
  MAX_SUSPICIOUS_ACTIVITY: 10,
  DEFAULT_CONFIDENCE: 0.5,
  FALLBACK_CONFIDENCE: 0.3,
  CLEANUP_BATCH_SIZE: 100
} as const;