/**
 * Serviço de gerenciamento de sessões contextuais
 * 
 * Implementa criação, validação e gerenciamento de sessões
 * vinculadas a contexto de mesa/loja com expiração automática.
 */

import { 
  ContextualSession, 
  SessionContext, 
  SessionValidationResult,
  SessionService,
  SessionConfig,
  SessionEventData,
  SessionEventListener,
  DEFAULT_SESSION_CONFIG,
  SESSION_CONSTANTS,
  SessionState,
  AccessType
} from '../types/session';
import { sessionStorage } from './sessionStorage';
import { fingerprintDetectionService } from './fingerprintDetection';

export class BrowserSessionService implements SessionService {
  private static instance: BrowserSessionService;
  private config: SessionConfig = DEFAULT_SESSION_CONFIG;
  private eventListeners: Map<string, SessionEventListener[]> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  public static getInstance(): BrowserSessionService {
    if (!BrowserSessionService.instance) {
      BrowserSessionService.instance = new BrowserSessionService();
    }
    return BrowserSessionService.instance;
  }

  constructor() {
    this.initializeCleanup();
  }

  /**
   * Configura o serviço de sessões
   */
  configure(config: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Reinicia cleanup se o intervalo mudou
    if (config.cleanupIntervalMinutes && this.cleanupInterval) {
      this.initializeCleanup();
    }
  }

  /**
   * Cria nova sessão contextual
   */
  async createSession(context: SessionContext): Promise<ContextualSession> {
    // Valida contexto
    await this.validateContext(context);

    // Verifica se já existe sessão ativa para este fingerprint/loja
    const existingSession = await sessionStorage.getByFingerprint(
      context.fingerprint, 
      context.storeId
    );

    if (existingSession && !this.isExpired(existingSession)) {
      // Atualiza sessão existente
      await this.updateActivity(existingSession.id);
      return existingSession;
    }

    // Calcula duração da sessão
    const durationMinutes = context.isDelivery 
      ? this.config.deliveryDurationMinutes 
      : this.config.tableDurationMinutes;

    // Cria nova sessão
    const session: ContextualSession = {
      id: this.generateSessionId(),
      storeId: context.storeId,
      tableId: context.tableId,
      isDelivery: context.isDelivery,
      fingerprint: context.fingerprint,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + durationMinutes * 60 * 1000),
      lastActivity: new Date(),
      orderCount: 0,
      totalSpent: 0,
      isAuthenticated: !!context.customerId,
      customerId: context.customerId
    };

    // Armazena sessão
    await sessionStorage.set(session);

    // Emite evento
    this.emitEvent('session_created', {
      type: 'session_created',
      sessionId: session.id,
      storeId: session.storeId,
      timestamp: new Date(),
      metadata: {
        isDelivery: session.isDelivery,
        tableId: session.tableId,
        fingerprint: session.fingerprint,
        isAuthenticated: session.isAuthenticated
      }
    });

    console.log(`Sessão criada: ${session.id} para loja ${session.storeId}`);
    return session;
  }

  /**
   * Valida sessão existente
   */
  async validateSession(sessionId: string): Promise<SessionValidationResult> {
    const session = await sessionStorage.get(sessionId);

    if (!session) {
      return {
        isValid: false,
        isExpired: false,
        isActive: false,
        reason: 'Sessão não encontrada'
      };
    }

    const isExpired = this.isExpired(session);
    const isActive = this.isActive(session);

    if (isExpired) {
      // Remove sessão expirada
      await this.expireSession(sessionId);
      return {
        isValid: false,
        isExpired: true,
        isActive: false,
        session,
        reason: 'Sessão expirada'
      };
    }

    // Valida fingerprint se necessário
    const fingerprintValidation = await fingerprintDetectionService.validateFingerprint(
      session.fingerprint
    );

    if (fingerprintValidation.isBlocked) {
      await this.expireSession(sessionId);
      return {
        isValid: false,
        isExpired: false,
        isActive: false,
        session,
        reason: 'Fingerprint bloqueado'
      };
    }

    // Atualiza atividade se sessão está ativa
    if (isActive) {
      await this.updateActivity(sessionId);
    }

    this.emitEvent('session_validated', {
      type: 'session_validated',
      sessionId: session.id,
      storeId: session.storeId,
      timestamp: new Date(),
      metadata: {
        isValid: true,
        isActive,
        fingerprintValid: !fingerprintValidation.isSuspicious
      }
    });

    return {
      isValid: true,
      isExpired: false,
      isActive,
      session
    };
  }

  /**
   * Atualiza última atividade da sessão
   */
  async updateActivity(sessionId: string): Promise<void> {
    const session = await sessionStorage.get(sessionId);
    if (!session || this.isExpired(session)) {
      return;
    }

    await sessionStorage.update(sessionId, {
      lastActivity: new Date()
    });

    this.emitEvent('activity_updated', {
      type: 'activity_updated',
      sessionId,
      storeId: session.storeId,
      timestamp: new Date()
    });
  }

  /**
   * Expira sessão manualmente
   */
  async expireSession(sessionId: string): Promise<void> {
    const session = await sessionStorage.get(sessionId);
    if (!session) return;

    await sessionStorage.delete(sessionId);

    this.emitEvent('session_expired', {
      type: 'session_expired',
      sessionId,
      storeId: session.storeId,
      timestamp: new Date(),
      metadata: {
        duration: Date.now() - session.createdAt.getTime(),
        orderCount: session.orderCount,
        totalSpent: session.totalSpent
      }
    });

    console.log(`Sessão expirada: ${sessionId}`);
  }

  /**
   * Associa cliente à sessão
   */
  async associateCustomer(sessionId: string, customerId: string): Promise<void> {
    const session = await sessionStorage.get(sessionId);
    if (!session || this.isExpired(session)) {
      throw new Error('Sessão inválida ou expirada');
    }

    await sessionStorage.update(sessionId, {
      customerId,
      isAuthenticated: true,
      lastActivity: new Date()
    });

    this.emitEvent('customer_associated', {
      type: 'customer_associated',
      sessionId,
      storeId: session.storeId,
      timestamp: new Date(),
      metadata: { 
        customerId,
        previousAuthState: session.isAuthenticated
      }
    });

    console.log(`Cliente ${customerId} associado à sessão ${sessionId}`);
  }

  /**
   * Atualiza dados do cliente na sessão
   */
  async updateCustomerData(sessionId: string, customerData: {
    name?: string;
    phone?: string;
    email?: string;
  }): Promise<void> {
    const session = await sessionStorage.get(sessionId);
    if (!session || this.isExpired(session)) {
      throw new Error('Sessão inválida ou expirada');
    }

    await sessionStorage.update(sessionId, {
      customerData: {
        ...session.customerData,
        ...customerData
      },
      lastActivity: new Date()
    });

    this.emitEvent('customer_data_updated', {
      type: 'customer_data_updated',
      sessionId,
      storeId: session.storeId,
      timestamp: new Date(),
      metadata: { customerData }
    });

    console.log('Dados do cliente atualizados na sessão:', { sessionId, customerData });
  }

  /**
   * Obtém histórico de pedidos da sessão
   */
  async getSessionOrderHistory(sessionId: string): Promise<any[]> {
    try {
      const session = await sessionStorage.get(sessionId);
      if (!session) {
        return [];
      }

      // Em produção, buscar pedidos do backend
      // const response = await fetch(`/api/sessions/${sessionId}/orders`);
      // return response.json();

      // Mock para desenvolvimento
      return [];
      
    } catch (error) {
      console.error('Erro ao obter histórico de pedidos:', error);
      return [];
    }
  }

  /**
   * Retorna sessões ativas de uma loja
   */
  async getActiveSessions(storeId: string): Promise<ContextualSession[]> {
    const sessions = await sessionStorage.getActiveSessionsByStore(storeId);
    return sessions.filter(session => !this.isExpired(session));
  }

  /**
   * Limpa sessões expiradas
   */
  async cleanExpiredSessions(): Promise<number> {
    const cutoffTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hora atrás
    const cleanedCount = await sessionStorage.cleanup(cutoffTime);

    if (cleanedCount > 0) {
      this.emitEvent('session_cleanup', {
        type: 'session_cleanup',
        sessionId: 'system',
        storeId: 'system',
        timestamp: new Date(),
        metadata: { cleanedCount }
      });

      console.log(`Limpeza de sessões: ${cleanedCount} sessões removidas`);
    }

    return cleanedCount;
  }

  /**
   * Estende duração da sessão
   */
  async extendSession(sessionId: string, additionalMinutes: number): Promise<void> {
    const session = await sessionStorage.get(sessionId);
    if (!session || this.isExpired(session)) {
      throw new Error('Sessão inválida ou expirada');
    }

    // Limita extensão máxima
    const maxExtension = SESSION_CONSTANTS.MAX_SESSION_DURATION;
    const currentDuration = (session.expiresAt.getTime() - session.createdAt.getTime()) / (1000 * 60);
    const newDuration = Math.min(currentDuration + additionalMinutes, maxExtension);
    
    const newExpiresAt = new Date(session.createdAt.getTime() + newDuration * 60 * 1000);

    await sessionStorage.update(sessionId, {
      expiresAt: newExpiresAt
    });

    this.emitEvent('session_extended', {
      type: 'session_extended',
      sessionId,
      storeId: session.storeId,
      timestamp: new Date(),
      metadata: { 
        additionalMinutes,
        newExpiresAt: newExpiresAt.toISOString()
      }
    });

    console.log(`Sessão ${sessionId} estendida por ${additionalMinutes} minutos`);
  }

  /**
   * Incrementa contador de pedidos
   */
  async incrementOrderCount(sessionId: string, orderValue: number = 0): Promise<void> {
    const session = await sessionStorage.get(sessionId);
    if (!session || this.isExpired(session)) {
      return;
    }

    await sessionStorage.update(sessionId, {
      orderCount: session.orderCount + 1,
      totalSpent: session.totalSpent + orderValue,
      lastActivity: new Date()
    });
  }

  /**
   * Verifica se sessão está expirada
   */
  private isExpired(session: ContextualSession): boolean {
    return session.expiresAt < new Date();
  }

  /**
   * Verifica se sessão está ativa (não expirada e com atividade recente)
   */
  private isActive(session: ContextualSession): boolean {
    if (this.isExpired(session)) {
      return false;
    }

    const inactivityThreshold = new Date(
      Date.now() - this.config.activityTimeoutMinutes * 60 * 1000
    );

    return session.lastActivity > inactivityThreshold;
  }

  /**
   * Valida contexto da sessão
   */
  private async validateContext(context: SessionContext): Promise<void> {
    // Valida fingerprint
    const fingerprintValidation = await fingerprintDetectionService.validateFingerprint(
      context.fingerprint
    );

    if (!fingerprintValidation.isValid) {
      throw new Error('Fingerprint inválido');
    }

    if (fingerprintValidation.isBlocked) {
      throw new Error('Fingerprint bloqueado por atividade suspeita');
    }

    // Verifica limite de sessões por fingerprint
    const existingSessions = await this.getSessionsByFingerprint(context.fingerprint);
    if (existingSessions.length >= this.config.maxSessionsPerFingerprint) {
      throw new Error('Limite de sessões por dispositivo excedido');
    }

    // Valida mesa se especificada
    if (context.tableId) {
      const tableSessions = await sessionStorage.getActiveSessionsByTable(context.tableId);
      const activeSessions = tableSessions.filter(s => !this.isExpired(s));
      
      if (activeSessions.length >= this.config.maxSessionsPerTable) {
        throw new Error('Limite de sessões por mesa excedido');
      }
    }

    // TODO: Validar se loja está aberta (integração com backend)
    // TODO: Validar se mesa existe e está ativa (integração com backend)
  }

  /**
   * Retorna sessões por fingerprint
   */
  private async getSessionsByFingerprint(fingerprint: string): Promise<ContextualSession[]> {
    // Implementação simplificada - na prática, seria uma query mais eficiente
    const allSessions = await sessionStorage.getActiveSessionsByStore('all');
    return allSessions.filter(s => s.fingerprint === fingerprint && !this.isExpired(s));
  }

  /**
   * Gera ID único para sessão
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Inicializa limpeza automática
   */
  private initializeCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    if (this.config.enableAutoCleanup) {
      this.cleanupInterval = setInterval(
        () => this.cleanExpiredSessions(),
        this.config.cleanupIntervalMinutes * 60 * 1000
      );
    }
  }

  /**
   * Adiciona listener de eventos
   */
  addEventListener(event: string, listener: SessionEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * Remove listener de eventos
   */
  removeEventListener(event: string, listener: SessionEventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emite evento
   */
  private emitEvent(event: string, data: SessionEventData): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Erro ao executar listener de evento:', error);
        }
      });
    }
  }

  /**
   * Obtém estatísticas das sessões
   */
  async getSessionStats(storeId?: string): Promise<{
    total: number;
    active: number;
    expired: number;
    authenticated: number;
    guest: number;
    averageDuration: number;
  }> {
    const sessions = storeId 
      ? await sessionStorage.getActiveSessionsByStore(storeId)
      : await sessionStorage.getActiveSessionsByStore('all');

    const now = new Date();
    let totalDuration = 0;
    let active = 0;
    let expired = 0;
    let authenticated = 0;
    let guest = 0;

    sessions.forEach(session => {
      const duration = now.getTime() - session.createdAt.getTime();
      totalDuration += duration;

      if (this.isExpired(session)) {
        expired++;
      } else {
        active++;
      }

      if (session.isAuthenticated) {
        authenticated++;
      } else {
        guest++;
      }
    });

    return {
      total: sessions.length,
      active,
      expired,
      authenticated,
      guest,
      averageDuration: sessions.length > 0 ? totalDuration / sessions.length / (1000 * 60) : 0
    };
  }

  /**
   * Limpa todas as sessões (para desenvolvimento/testes)
   */
  async clearAllSessions(): Promise<void> {
    await sessionStorage.clear();
    console.log('Todas as sessões foram limpas');
  }

  /**
   * Finaliza o serviço
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.eventListeners.clear();
  }
}

// Instância singleton
export const sessionService = BrowserSessionService.getInstance();