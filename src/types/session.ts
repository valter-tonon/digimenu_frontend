/**
 * Tipos TypeScript para o sistema de sessões contextuais
 */

export interface ContextualSession {
  id: string;
  storeId: string;
  tableId?: string;
  isDelivery: boolean;
  fingerprint: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  orderCount: number;
  totalSpent: number;
  isAuthenticated: boolean;
  customerId?: string;
}

export interface SessionContext {
  storeId: string;
  tableId?: string;
  isDelivery: boolean;
  fingerprint: string;
  ipAddress: string;
  userAgent: string;
  customerId?: string;
}

export interface SessionValidationResult {
  isValid: boolean;
  isExpired: boolean;
  isActive: boolean;
  session?: ContextualSession;
  reason?: string;
}

export interface TableStatus {
  id: string;
  isActive: boolean;
  isOccupied: boolean;
  currentSessions: number;
  maxSessions: number;
  storeStatus: 'open' | 'closed' | 'busy';
}

export interface StoreStatus {
  id: string;
  isOpen: boolean;
  status: 'open' | 'closed' | 'busy';
  openingHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  currentTime: Date;
}

export interface SessionStorage {
  get(sessionId: string): Promise<ContextualSession | null>;
  set(session: ContextualSession): Promise<void>;
  update(sessionId: string, updates: Partial<ContextualSession>): Promise<void>;
  delete(sessionId: string): Promise<void>;
  getByFingerprint(fingerprint: string, storeId: string): Promise<ContextualSession | null>;
  getActiveSessionsByStore(storeId: string): Promise<ContextualSession[]>;
  getActiveSessionsByTable(tableId: string): Promise<ContextualSession[]>;
  cleanup(olderThan: Date): Promise<number>;
  clear(): Promise<void>;
}

export interface SessionService {
  createSession(context: SessionContext): Promise<ContextualSession>;
  validateSession(sessionId: string): Promise<SessionValidationResult>;
  updateActivity(sessionId: string): Promise<void>;
  expireSession(sessionId: string): Promise<void>;
  associateCustomer(sessionId: string, customerId: string): Promise<void>;
  getActiveSessions(storeId: string): Promise<ContextualSession[]>;
  cleanExpiredSessions(): Promise<number>;
  extendSession(sessionId: string, additionalMinutes: number): Promise<void>;
}

export interface SessionConfig {
  tableDurationMinutes: number;
  deliveryDurationMinutes: number;
  activityTimeoutMinutes: number;
  maxSessionsPerTable: number;
  maxSessionsPerFingerprint: number;
  enableAutoCleanup: boolean;
  cleanupIntervalMinutes: number;
}

export interface SessionAnalytics {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  authenticatedSessions: number;
  guestSessions: number;
  averageSessionDuration: number;
  topStores: Array<{ storeId: string; sessionCount: number }>;
  sessionsByHour: Array<{ hour: number; count: number }>;
  deviceTypes: Array<{ type: string; count: number }>;
}

// Eventos do sistema de sessões
export type SessionEvent = 
  | 'session_created'
  | 'session_validated'
  | 'session_expired'
  | 'session_extended'
  | 'customer_associated'
  | 'activity_updated'
  | 'session_cleanup';

export interface SessionEventData {
  type: SessionEvent;
  sessionId: string;
  storeId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SessionEventListener {
  (event: SessionEventData): void;
}

// Configurações padrão
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  tableDurationMinutes: 240, // 4 horas
  deliveryDurationMinutes: 120, // 2 horas
  activityTimeoutMinutes: 30, // 30 minutos sem atividade
  maxSessionsPerTable: 10,
  maxSessionsPerFingerprint: 3,
  enableAutoCleanup: true,
  cleanupIntervalMinutes: 60 // 1 hora
};

// Constantes
export const SESSION_CONSTANTS = {
  MIN_SESSION_DURATION: 15, // 15 minutos mínimo
  MAX_SESSION_DURATION: 480, // 8 horas máximo
  DEFAULT_ACTIVITY_TIMEOUT: 30, // 30 minutos
  MAX_SESSIONS_PER_STORE: 1000,
  CLEANUP_BATCH_SIZE: 50
} as const;

// Estados de sessão
export enum SessionState {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked'
}

// Tipos de acesso
export enum AccessType {
  QR_CODE = 'qr_code',
  WHATSAPP = 'whatsapp',
  DIRECT_LINK = 'direct_link',
  GUEST_REGISTRATION = 'guest_registration'
}