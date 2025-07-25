/**
 * Serviço de logs de auditoria
 * 
 * Registra eventos importantes do sistema para auditoria,
 * segurança e conformidade com regulamentações.
 */

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  category: AuditCategory;
  severity: AuditSeverity;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  fingerprint?: string;
  ip: string;
  userAgent?: string;
  storeId?: string;
  description: string;
  details: any;
  source: string;
  success: boolean;
  errorMessage?: string;
  metadata?: any;
}

export type AuditEventType = 
  // Autenticação
  | 'session_created'
  | 'session_expired'
  | 'session_invalidated'
  | 'customer_associated'
  | 'whatsapp_auth_requested'
  | 'whatsapp_auth_validated'
  | 'quick_registration'
  | 'qr_code_access'
  
  // Segurança
  | 'suspicious_activity_detected'
  | 'ip_blocked'
  | 'ip_unblocked'
  | 'fingerprint_blocked'
  | 'rate_limit_exceeded'
  | 'bot_behavior_detected'
  
  // Sistema
  | 'configuration_changed'
  | 'data_cleanup'
  | 'system_error'
  | 'privacy_consent_given'
  | 'privacy_opt_out'
  
  // Pedidos
  | 'order_created'
  | 'order_cancelled'
  | 'cart_updated';

export type AuditCategory = 
  | 'authentication'
  | 'security'
  | 'privacy'
  | 'system'
  | 'orders'
  | 'configuration';

export type AuditSeverity = 
  | 'info'
  | 'warning'
  | 'error'
  | 'critical';

export interface AuditQuery {
  startDate?: Date;
  endDate?: Date;
  types?: AuditEventType[];
  categories?: AuditCategory[];
  severities?: AuditSeverity[];
  userId?: string;
  sessionId?: string;
  fingerprint?: string;
  ip?: string;
  storeId?: string;
  success?: boolean;
  limit?: number;
  offset?: number;
}

export interface AuditStatistics {
  totalEvents: number;
  eventsByType: Record<AuditEventType, number>;
  eventsByCategory: Record<AuditCategory, number>;
  eventsBySeverity: Record<AuditSeverity, number>;
  successRate: number;
  topIPs: Array<{ ip: string; count: number }>;
  topUsers: Array<{ userId: string; count: number }>;
  recentErrors: AuditEvent[];
}

class AuditLoggerService {
  private readonly STORAGE_KEY = 'audit_logs';
  private readonly MAX_EVENTS = 10000; // Máximo de eventos em memória
  private readonly BATCH_SIZE = 100; // Tamanho do lote para envio ao backend
  private readonly SYNC_INTERVAL = 30000; // 30 segundos
  
  private pendingEvents: AuditEvent[] = [];
  private syncTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startAutoSync();
  }

  /**
   * Registra um evento de auditoria
   */
  async logEvent(
    type: AuditEventType,
    description: string,
    details: any = {},
    options: {
      userId?: string;
      sessionId?: string;
      fingerprint?: string;
      ip?: string;
      userAgent?: string;
      storeId?: string;
      success?: boolean;
      errorMessage?: string;
      metadata?: any;
      source?: string;
    } = {}
  ): Promise<void> {
    try {
      const event: AuditEvent = {
        id: this.generateEventId(),
        type,
        category: this.getCategoryForType(type),
        severity: this.getSeverityForType(type, options.success),
        timestamp: new Date(),
        userId: options.userId,
        sessionId: options.sessionId,
        fingerprint: options.fingerprint,
        ip: options.ip || await this.getClientIP(),
        userAgent: options.userAgent || this.getUserAgent(),
        storeId: options.storeId,
        description,
        details,
        source: options.source || 'frontend',
        success: options.success !== false, // Default true
        errorMessage: options.errorMessage,
        metadata: options.metadata
      };

      // Armazena evento localmente
      await this.storeEvent(event);

      // Adiciona à fila de sincronização
      this.pendingEvents.push(event);

      // Log no console para desenvolvimento
      this.logToConsole(event);

      // Envia eventos críticos imediatamente
      if (event.severity === 'critical') {
        await this.syncEvents();
      }

    } catch (error) {
      console.error('Erro ao registrar evento de auditoria:', error);
    }
  }

  /**
   * Métodos de conveniência para diferentes tipos de eventos
   */

  async logSessionCreated(sessionId: string, storeId: string, fingerprint: string, ip: string): Promise<void> {
    await this.logEvent('session_created', 'Nova sessão criada', {
      sessionId,
      storeId,
      fingerprint
    }, {
      sessionId,
      fingerprint,
      ip,
      storeId,
      success: true
    });
  }

  async logSessionExpired(sessionId: string, reason: string): Promise<void> {
    await this.logEvent('session_expired', `Sessão expirada: ${reason}`, {
      sessionId,
      reason
    }, {
      sessionId,
      success: true
    });
  }

  async logCustomerAssociated(sessionId: string, customerId: string): Promise<void> {
    await this.logEvent('customer_associated', 'Cliente associado à sessão', {
      sessionId,
      customerId
    }, {
      sessionId,
      userId: customerId,
      success: true
    });
  }

  async logWhatsAppAuthRequested(phone: string, storeId: string, fingerprint: string, ip: string): Promise<void> {
    await this.logEvent('whatsapp_auth_requested', 'Solicitação de autenticação WhatsApp', {
      phone: this.maskPhone(phone),
      storeId
    }, {
      fingerprint,
      ip,
      storeId,
      success: true
    });
  }

  async logWhatsAppAuthValidated(phone: string, sessionId: string, success: boolean, error?: string): Promise<void> {
    await this.logEvent('whatsapp_auth_validated', 
      success ? 'Autenticação WhatsApp validada' : 'Falha na validação WhatsApp', 
      {
        phone: this.maskPhone(phone),
        sessionId
      }, {
        sessionId,
        success,
        errorMessage: error
      }
    );
  }

  async logQuickRegistration(customerId: string, phone: string, storeId: string, fingerprint: string): Promise<void> {
    await this.logEvent('quick_registration', 'Cadastro rápido realizado', {
      customerId,
      phone: this.maskPhone(phone),
      storeId
    }, {
      userId: customerId,
      fingerprint,
      storeId,
      success: true
    });
  }

  async logQRCodeAccess(storeId: string, tableId: string, fingerprint: string, ip: string, success: boolean, error?: string): Promise<void> {
    await this.logEvent('qr_code_access', 
      success ? 'Acesso via QR Code realizado' : 'Falha no acesso via QR Code', 
      {
        storeId,
        tableId
      }, {
        fingerprint,
        ip,
        storeId,
        success,
        errorMessage: error
      }
    );
  }

  async logSuspiciousActivity(
    activityType: string, 
    description: string, 
    evidence: any, 
    ip: string, 
    fingerprint?: string
  ): Promise<void> {
    await this.logEvent('suspicious_activity_detected', description, {
      activityType,
      evidence
    }, {
      fingerprint,
      ip,
      success: false,
      metadata: { severity: 'high' }
    });
  }

  async logIPBlocked(ip: string, reason: string, duration: number): Promise<void> {
    await this.logEvent('ip_blocked', `IP bloqueado: ${reason}`, {
      ip,
      reason,
      duration
    }, {
      ip,
      success: true,
      metadata: { autoAction: true }
    });
  }

  async logRateLimitExceeded(type: string, ip: string, fingerprint?: string): Promise<void> {
    await this.logEvent('rate_limit_exceeded', `Rate limit excedido: ${type}`, {
      type,
      ip
    }, {
      fingerprint,
      ip,
      success: false
    });
  }

  async logConfigurationChanged(setting: string, oldValue: any, newValue: any, userId?: string): Promise<void> {
    await this.logEvent('configuration_changed', `Configuração alterada: ${setting}`, {
      setting,
      oldValue,
      newValue
    }, {
      userId,
      success: true
    });
  }

  async logSystemError(error: string, details: any, source: string): Promise<void> {
    await this.logEvent('system_error', `Erro do sistema: ${error}`, details, {
      success: false,
      errorMessage: error,
      source
    });
  }

  async logPrivacyConsent(fingerprint: string, ip: string, consentType: string): Promise<void> {
    await this.logEvent('privacy_consent_given', `Consentimento de privacidade: ${consentType}`, {
      consentType
    }, {
      fingerprint,
      ip,
      success: true
    });
  }

  async logPrivacyOptOut(fingerprint: string, ip: string): Promise<void> {
    await this.logEvent('privacy_opt_out', 'Usuário optou por sair do rastreamento', {}, {
      fingerprint,
      ip,
      success: true
    });
  }

  /**
   * Consulta eventos de auditoria
   */
  async queryEvents(query: AuditQuery = {}): Promise<{
    events: AuditEvent[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const allEvents = await this.getAllEvents();
      let filteredEvents = allEvents;

      // Aplica filtros
      if (query.startDate) {
        filteredEvents = filteredEvents.filter(e => e.timestamp >= query.startDate!);
      }

      if (query.endDate) {
        filteredEvents = filteredEvents.filter(e => e.timestamp <= query.endDate!);
      }

      if (query.types && query.types.length > 0) {
        filteredEvents = filteredEvents.filter(e => query.types!.includes(e.type));
      }

      if (query.categories && query.categories.length > 0) {
        filteredEvents = filteredEvents.filter(e => query.categories!.includes(e.category));
      }

      if (query.severities && query.severities.length > 0) {
        filteredEvents = filteredEvents.filter(e => query.severities!.includes(e.severity));
      }

      if (query.userId) {
        filteredEvents = filteredEvents.filter(e => e.userId === query.userId);
      }

      if (query.sessionId) {
        filteredEvents = filteredEvents.filter(e => e.sessionId === query.sessionId);
      }

      if (query.fingerprint) {
        filteredEvents = filteredEvents.filter(e => e.fingerprint === query.fingerprint);
      }

      if (query.ip) {
        filteredEvents = filteredEvents.filter(e => e.ip === query.ip);
      }

      if (query.storeId) {
        filteredEvents = filteredEvents.filter(e => e.storeId === query.storeId);
      }

      if (query.success !== undefined) {
        filteredEvents = filteredEvents.filter(e => e.success === query.success);
      }

      // Ordena por timestamp (mais recente primeiro)
      filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Aplica paginação
      const offset = query.offset || 0;
      const limit = query.limit || 100;
      const paginatedEvents = filteredEvents.slice(offset, offset + limit);

      return {
        events: paginatedEvents,
        total: filteredEvents.length,
        hasMore: offset + limit < filteredEvents.length
      };

    } catch (error) {
      console.error('Erro ao consultar eventos de auditoria:', error);
      return { events: [], total: 0, hasMore: false };
    }
  }

  /**
   * Obtém estatísticas de auditoria
   */
  async getStatistics(days = 30): Promise<AuditStatistics> {
    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const { events } = await this.queryEvents({ startDate: cutoff });

      const stats: AuditStatistics = {
        totalEvents: events.length,
        eventsByType: {} as Record<AuditEventType, number>,
        eventsByCategory: {} as Record<AuditCategory, number>,
        eventsBySeverity: {} as Record<AuditSeverity, number>,
        successRate: 0,
        topIPs: [],
        topUsers: [],
        recentErrors: []
      };

      // Conta eventos por tipo, categoria e severidade
      const ipCounts: Record<string, number> = {};
      const userCounts: Record<string, number> = {};
      let successCount = 0;

      events.forEach(event => {
        // Por tipo
        stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;
        
        // Por categoria
        stats.eventsByCategory[event.category] = (stats.eventsByCategory[event.category] || 0) + 1;
        
        // Por severidade
        stats.eventsBySeverity[event.severity] = (stats.eventsBySeverity[event.severity] || 0) + 1;

        // Taxa de sucesso
        if (event.success) successCount++;

        // Contagem por IP
        ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;

        // Contagem por usuário
        if (event.userId) {
          userCounts[event.userId] = (userCounts[event.userId] || 0) + 1;
        }
      });

      // Taxa de sucesso
      stats.successRate = events.length > 0 ? (successCount / events.length) * 100 : 0;

      // Top IPs
      stats.topIPs = Object.entries(ipCounts)
        .map(([ip, count]) => ({ ip, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top usuários
      stats.topUsers = Object.entries(userCounts)
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Erros recentes
      stats.recentErrors = events
        .filter(e => !e.success || e.severity === 'error' || e.severity === 'critical')
        .slice(0, 20);

      return stats;

    } catch (error) {
      console.error('Erro ao obter estatísticas de auditoria:', error);
      return {
        totalEvents: 0,
        eventsByType: {} as Record<AuditEventType, number>,
        eventsByCategory: {} as Record<AuditCategory, number>,
        eventsBySeverity: {} as Record<AuditSeverity, number>,
        successRate: 0,
        topIPs: [],
        topUsers: [],
        recentErrors: []
      };
    }
  }

  /**
   * Limpa eventos antigos
   */
  async cleanupOldEvents(days = 30): Promise<number> {
    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const allEvents = await this.getAllEvents();
      
      const recentEvents = allEvents.filter(event => event.timestamp >= cutoff);
      const removedCount = allEvents.length - recentEvents.length;

      await this.storeAllEvents(recentEvents);

      console.log(`Limpeza de auditoria: ${removedCount} eventos removidos`);
      return removedCount;

    } catch (error) {
      console.error('Erro na limpeza de eventos de auditoria:', error);
      return 0;
    }
  }

  /**
   * Sincroniza eventos com backend
   */
  async syncEvents(): Promise<void> {
    if (this.pendingEvents.length === 0) return;

    try {
      const eventsToSync = this.pendingEvents.splice(0, this.BATCH_SIZE);

      // Em produção, enviar para backend
      // await fetch('/api/audit/events', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ events: eventsToSync })
      // });

      console.log(`${eventsToSync.length} eventos de auditoria sincronizados (mock)`);

    } catch (error) {
      console.error('Erro ao sincronizar eventos de auditoria:', error);
      // Recoloca eventos na fila em caso de erro
      this.pendingEvents.unshift(...this.pendingEvents);
    }
  }

  /**
   * Métodos privados
   */

  private startAutoSync(): void {
    this.syncTimer = setInterval(() => {
      this.syncEvents();
    }, this.SYNC_INTERVAL);
  }

  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  private async storeEvent(event: AuditEvent): Promise<void> {
    try {
      const events = await this.getAllEvents();
      events.push(event);

      // Mantém apenas os últimos MAX_EVENTS
      if (events.length > this.MAX_EVENTS) {
        events.splice(0, events.length - this.MAX_EVENTS);
      }

      await this.storeAllEvents(events);
    } catch (error) {
      console.error('Erro ao armazenar evento de auditoria:', error);
    }
  }

  private async getAllEvents(): Promise<AuditEvent[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      return JSON.parse(stored).map((event: any) => ({
        ...event,
        timestamp: new Date(event.timestamp)
      }));
    } catch (error) {
      console.error('Erro ao obter eventos de auditoria:', error);
      return [];
    }
  }

  private async storeAllEvents(events: AuditEvent[]): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
    } catch (error) {
      console.error('Erro ao armazenar eventos de auditoria:', error);
    }
  }

  private getCategoryForType(type: AuditEventType): AuditCategory {
    const categoryMap: Record<AuditEventType, AuditCategory> = {
      'session_created': 'authentication',
      'session_expired': 'authentication',
      'session_invalidated': 'authentication',
      'customer_associated': 'authentication',
      'whatsapp_auth_requested': 'authentication',
      'whatsapp_auth_validated': 'authentication',
      'quick_registration': 'authentication',
      'qr_code_access': 'authentication',
      'suspicious_activity_detected': 'security',
      'ip_blocked': 'security',
      'ip_unblocked': 'security',
      'fingerprint_blocked': 'security',
      'rate_limit_exceeded': 'security',
      'bot_behavior_detected': 'security',
      'configuration_changed': 'system',
      'data_cleanup': 'system',
      'system_error': 'system',
      'privacy_consent_given': 'privacy',
      'privacy_opt_out': 'privacy',
      'order_created': 'orders',
      'order_cancelled': 'orders',
      'cart_updated': 'orders'
    };

    return categoryMap[type] || 'system';
  }

  private getSeverityForType(type: AuditEventType, success?: boolean): AuditSeverity {
    if (success === false) {
      const criticalTypes: AuditEventType[] = [
        'suspicious_activity_detected',
        'bot_behavior_detected',
        'system_error'
      ];
      
      if (criticalTypes.includes(type)) {
        return 'critical';
      }
      
      return 'error';
    }

    const warningTypes: AuditEventType[] = [
      'session_expired',
      'ip_blocked',
      'rate_limit_exceeded'
    ];

    if (warningTypes.includes(type)) {
      return 'warning';
    }

    return 'info';
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private async getClientIP(): Promise<string> {
    try {
      // Em produção, usar serviço real
      return '127.0.0.1';
    } catch {
      return 'unknown';
    }
  }

  private getUserAgent(): string {
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  }

  private maskPhone(phone: string): string {
    if (phone.length <= 4) return phone;
    return phone.substring(0, 2) + '*'.repeat(phone.length - 4) + phone.substring(phone.length - 2);
  }

  private logToConsole(event: AuditEvent): void {
    const color = {
      'info': '\x1b[36m',      // Cyan
      'warning': '\x1b[33m',   // Yellow
      'error': '\x1b[31m',     // Red
      'critical': '\x1b[35m'   // Magenta
    }[event.severity];

    console.log(
      `${color}[AUDIT]${'\x1b[0m'} ${event.type} - ${event.description}`,
      { id: event.id, timestamp: event.timestamp, details: event.details }
    );
  }

  /**
   * Cleanup na destruição
   */
  destroy(): void {
    this.stopAutoSync();
    this.syncEvents(); // Última sincronização
  }
}

export const auditLogger = new AuditLoggerService();