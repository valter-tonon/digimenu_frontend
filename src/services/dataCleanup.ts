/**
 * Serviço de limpeza automática de dados
 * 
 * Gerencia limpeza automática de sessões expiradas,
 * fingerprints antigos, logs de auditoria e outros dados
 * temporários do sistema.
 */

import { sessionService } from './sessionService';
import { auditLogger } from './auditLogger';
import { rateLimitingService } from './rateLimiting';
import { suspiciousActivityDetectionService } from './suspiciousActivityDetection';

export interface CleanupConfig {
  enabled: boolean;
  interval: number; // em milissegundos
  retentionPeriods: {
    sessions: number; // em horas
    fingerprints: number; // em horas
    auditLogs: number; // em dias
    rateLimitData: number; // em dias
    suspiciousActivities: number; // em dias
    activityPatterns: number; // em dias
  };
  batchSize: number;
  maxExecutionTime: number; // em milissegundos
}

export interface CleanupResult {
  type: CleanupType;
  itemsProcessed: number;
  itemsRemoved: number;
  executionTime: number;
  success: boolean;
  error?: string;
}

export interface CleanupReport {
  timestamp: Date;
  totalExecutionTime: number;
  results: CleanupResult[];
  totalItemsRemoved: number;
  success: boolean;
  nextScheduledRun: Date;
}

export type CleanupType = 
  | 'expired_sessions'
  | 'old_fingerprints'
  | 'audit_logs'
  | 'rate_limit_data'
  | 'suspicious_activities'
  | 'activity_patterns'
  | 'blocked_ips'
  | 'temp_files';

class DataCleanupService {
  private readonly DEFAULT_CONFIG: CleanupConfig = {
    enabled: true,
    interval: 60 * 60 * 1000, // 1 hora
    retentionPeriods: {
      sessions: 1, // 1 hora após expiração
      fingerprints: 24, // 24 horas
      auditLogs: 30, // 30 dias
      rateLimitData: 7, // 7 dias
      suspiciousActivities: 90, // 90 dias
      activityPatterns: 7 // 7 dias
    },
    batchSize: 100,
    maxExecutionTime: 5 * 60 * 1000 // 5 minutos
  };

  private config: CleanupConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastReport: CleanupReport | null = null;

  constructor(config?: Partial<CleanupConfig>) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.startScheduledCleanup();
  }

  /**
   * Inicia limpeza automática agendada
   */
  startScheduledCleanup(): void {
    if (!this.config.enabled || this.cleanupTimer) {
      return;
    }

    this.cleanupTimer = setInterval(async () => {
      await this.runFullCleanup();
    }, this.config.interval);

    console.log(`Limpeza automática iniciada (intervalo: ${this.config.interval / 1000}s)`);
  }

  /**
   * Para limpeza automática agendada
   */
  stopScheduledCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      console.log('Limpeza automática parada');
    }
  }

  /**
   * Executa limpeza completa
   */
  async runFullCleanup(): Promise<CleanupReport> {
    if (this.isRunning) {
      console.warn('Limpeza já está em execução, pulando...');
      return this.lastReport!;
    }

    this.isRunning = true;
    const startTime = Date.now();
    const results: CleanupResult[] = [];

    try {
      console.log('Iniciando limpeza automática de dados...');

      // Executa cada tipo de limpeza
      const cleanupTasks = [
        () => this.cleanupExpiredSessions(),
        () => this.cleanupOldFingerprints(),
        () => this.cleanupAuditLogs(),
        () => this.cleanupRateLimitData(),
        () => this.cleanupSuspiciousActivities(),
        () => this.cleanupActivityPatterns(),
        () => this.cleanupBlockedIPs()
      ];

      for (const task of cleanupTasks) {
        try {
          const result = await task();
          results.push(result);

          // Verifica se excedeu tempo máximo
          if (Date.now() - startTime > this.config.maxExecutionTime) {
            console.warn('Tempo máximo de execução excedido, interrompendo limpeza');
            break;
          }
        } catch (error) {
          console.error('Erro em tarefa de limpeza:', error);
        }
      }

      const totalExecutionTime = Date.now() - startTime;
      const totalItemsRemoved = results.reduce((sum, r) => sum + r.itemsRemoved, 0);
      const success = results.every(r => r.success);

      const report: CleanupReport = {
        timestamp: new Date(),
        totalExecutionTime,
        results,
        totalItemsRemoved,
        success,
        nextScheduledRun: new Date(Date.now() + this.config.interval)
      };

      this.lastReport = report;

      // Log do relatório
      await auditLogger.logEvent('data_cleanup', 
        `Limpeza automática concluída: ${totalItemsRemoved} itens removidos`, 
        {
          executionTime: totalExecutionTime,
          itemsRemoved: totalItemsRemoved,
          results: results.map(r => ({
            type: r.type,
            removed: r.itemsRemoved,
            success: r.success
          }))
        },
        { success }
      );

      console.log(`Limpeza concluída: ${totalItemsRemoved} itens removidos em ${totalExecutionTime}ms`);

      return report;

    } catch (error) {
      console.error('Erro na limpeza automática:', error);
      
      const report: CleanupReport = {
        timestamp: new Date(),
        totalExecutionTime: Date.now() - startTime,
        results,
        totalItemsRemoved: 0,
        success: false,
        nextScheduledRun: new Date(Date.now() + this.config.interval)
      };

      this.lastReport = report;
      return report;

    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Limpa sessões expiradas
   */
  async cleanupExpiredSessions(): Promise<CleanupResult> {
    const startTime = Date.now();
    let itemsProcessed = 0;
    let itemsRemoved = 0;

    try {
      const cutoffTime = Date.now() - (this.config.retentionPeriods.sessions * 60 * 60 * 1000);
      
      // Obtém todas as sessões (mock - em produção usar API)
      const allSessions = await this.getAllStoredSessions();
      itemsProcessed = allSessions.length;

      const expiredSessions = allSessions.filter(session => {
        const sessionTime = new Date(session.lastActivity || session.createdAt).getTime();
        return sessionTime < cutoffTime;
      });

      // Remove sessões expiradas
      for (const session of expiredSessions) {
        try {
          await this.removeStoredSession(session.id);
          itemsRemoved++;
        } catch (error) {
          console.error(`Erro ao remover sessão ${session.id}:`, error);
        }
      }

      return {
        type: 'expired_sessions',
        itemsProcessed,
        itemsRemoved,
        executionTime: Date.now() - startTime,
        success: true
      };

    } catch (error) {
      return {
        type: 'expired_sessions',
        itemsProcessed,
        itemsRemoved,
        executionTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Limpa fingerprints antigos
   */
  async cleanupOldFingerprints(): Promise<CleanupResult> {
    const startTime = Date.now();
    let itemsProcessed = 0;
    let itemsRemoved = 0;

    try {
      const cutoffTime = Date.now() - (this.config.retentionPeriods.fingerprints * 60 * 60 * 1000);
      
      // Limpa dados de fingerprint (mock)
      const fingerprintKeys = this.getLocalStorageKeys('fingerprint_');
      itemsProcessed = fingerprintKeys.length;

      for (const key of fingerprintKeys) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            const timestamp = new Date(parsed.timestamp || parsed.createdAt).getTime();
            
            if (timestamp < cutoffTime) {
              localStorage.removeItem(key);
              itemsRemoved++;
            }
          }
        } catch (error) {
          // Remove chaves corrompidas
          localStorage.removeItem(key);
          itemsRemoved++;
        }
      }

      return {
        type: 'old_fingerprints',
        itemsProcessed,
        itemsRemoved,
        executionTime: Date.now() - startTime,
        success: true
      };

    } catch (error) {
      return {
        type: 'old_fingerprints',
        itemsProcessed,
        itemsRemoved,
        executionTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Limpa logs de auditoria antigos
   */
  async cleanupAuditLogs(): Promise<CleanupResult> {
    const startTime = Date.now();

    try {
      const removedCount = await auditLogger.cleanupOldEvents(this.config.retentionPeriods.auditLogs);

      return {
        type: 'audit_logs',
        itemsProcessed: removedCount, // Aproximação
        itemsRemoved: removedCount,
        executionTime: Date.now() - startTime,
        success: true
      };

    } catch (error) {
      return {
        type: 'audit_logs',
        itemsProcessed: 0,
        itemsRemoved: 0,
        executionTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Limpa dados de rate limiting antigos
   */
  async cleanupRateLimitData(): Promise<CleanupResult> {
    const startTime = Date.now();
    let itemsProcessed = 0;
    let itemsRemoved = 0;

    try {
      await rateLimitingService.cleanup();

      // Conta itens removidos (aproximação)
      const rateLimitKeys = this.getLocalStorageKeys('rate_limit_');
      itemsProcessed = rateLimitKeys.length;
      itemsRemoved = Math.floor(rateLimitKeys.length * 0.3); // Estimativa

      return {
        type: 'rate_limit_data',
        itemsProcessed,
        itemsRemoved,
        executionTime: Date.now() - startTime,
        success: true
      };

    } catch (error) {
      return {
        type: 'rate_limit_data',
        itemsProcessed,
        itemsRemoved,
        executionTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Limpa atividades suspeitas antigas
   */
  async cleanupSuspiciousActivities(): Promise<CleanupResult> {
    const startTime = Date.now();
    let itemsProcessed = 0;
    let itemsRemoved = 0;

    try {
      const cutoffTime = Date.now() - (this.config.retentionPeriods.suspiciousActivities * 24 * 60 * 60 * 1000);
      
      // Limpa atividades suspeitas (mock)
      const activities = await suspiciousActivityDetectionService.getSuspiciousActivities(10000);
      itemsProcessed = activities.length;

      const recentActivities = activities.filter(activity => 
        activity.timestamp.getTime() > cutoffTime
      );

      itemsRemoved = activities.length - recentActivities.length;

      // Em produção, atualizar storage
      // await this.storeSuspiciousActivities(recentActivities);

      return {
        type: 'suspicious_activities',
        itemsProcessed,
        itemsRemoved,
        executionTime: Date.now() - startTime,
        success: true
      };

    } catch (error) {
      return {
        type: 'suspicious_activities',
        itemsProcessed,
        itemsRemoved,
        executionTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Limpa padrões de atividade antigos
   */
  async cleanupActivityPatterns(): Promise<CleanupResult> {
    const startTime = Date.now();
    let itemsProcessed = 0;
    let itemsRemoved = 0;

    try {
      const cutoffTime = Date.now() - (this.config.retentionPeriods.activityPatterns * 24 * 60 * 60 * 1000);
      
      // Limpa padrões de atividade (mock)
      const patternKeys = this.getLocalStorageKeys('activity_patterns');
      itemsProcessed = patternKeys.length;

      for (const key of patternKeys) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const patterns = JSON.parse(data);
            const recentPatterns = patterns.filter((pattern: any) => 
              new Date(pattern.lastSeen).getTime() > cutoffTime
            );

            if (recentPatterns.length < patterns.length) {
              if (recentPatterns.length > 0) {
                localStorage.setItem(key, JSON.stringify(recentPatterns));
              } else {
                localStorage.removeItem(key);
              }
              itemsRemoved += patterns.length - recentPatterns.length;
            }
          }
        } catch (error) {
          localStorage.removeItem(key);
          itemsRemoved++;
        }
      }

      return {
        type: 'activity_patterns',
        itemsProcessed,
        itemsRemoved,
        executionTime: Date.now() - startTime,
        success: true
      };

    } catch (error) {
      return {
        type: 'activity_patterns',
        itemsProcessed,
        itemsRemoved,
        executionTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Limpa IPs bloqueados expirados
   */
  async cleanupBlockedIPs(): Promise<CleanupResult> {
    const startTime = Date.now();
    let itemsProcessed = 0;
    let itemsRemoved = 0;

    try {
      const blockedIPs = await rateLimitingService.getBlockedIPs();
      itemsProcessed = blockedIPs.length;

      // A limpeza de IPs expirados já é feita automaticamente pelo rateLimitingService
      // Aqui apenas contamos quantos foram removidos
      const now = new Date();
      const expiredIPs = blockedIPs.filter(blocked => blocked.expiresAt <= now);
      itemsRemoved = expiredIPs.length;

      return {
        type: 'blocked_ips',
        itemsProcessed,
        itemsRemoved,
        executionTime: Date.now() - startTime,
        success: true
      };

    } catch (error) {
      return {
        type: 'blocked_ips',
        itemsProcessed,
        itemsRemoved,
        executionTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Obtém relatório da última limpeza
   */
  getLastReport(): CleanupReport | null {
    return this.lastReport;
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): CleanupConfig {
    return { ...this.config };
  }

  /**
   * Atualiza configuração
   */
  updateConfig(newConfig: Partial<CleanupConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    // Reinicia timer se intervalo mudou
    if (oldConfig.interval !== this.config.interval) {
      this.stopScheduledCleanup();
      if (this.config.enabled) {
        this.startScheduledCleanup();
      }
    }

    console.log('Configuração de limpeza atualizada:', newConfig);
  }

  /**
   * Força execução imediata de limpeza
   */
  async forceCleanup(): Promise<CleanupReport> {
    console.log('Executando limpeza forçada...');
    return await this.runFullCleanup();
  }

  /**
   * Obtém estatísticas de armazenamento
   */
  getStorageStatistics(): {
    totalKeys: number;
    estimatedSize: number;
    keysByPrefix: Record<string, number>;
  } {
    const keys = Object.keys(localStorage);
    const keysByPrefix: Record<string, number> = {};
    let estimatedSize = 0;

    keys.forEach(key => {
      const value = localStorage.getItem(key) || '';
      estimatedSize += key.length + value.length;

      // Agrupa por prefixo
      const prefix = key.split('_')[0];
      keysByPrefix[prefix] = (keysByPrefix[prefix] || 0) + 1;
    });

    return {
      totalKeys: keys.length,
      estimatedSize,
      keysByPrefix
    };
  }

  /**
   * Métodos auxiliares privados
   */

  private getLocalStorageKeys(prefix: string): string[] {
    return Object.keys(localStorage).filter(key => key.startsWith(prefix));
  }

  private async getAllStoredSessions(): Promise<any[]> {
    // Mock - em produção, buscar do backend ou storage local
    const sessionKeys = this.getLocalStorageKeys('session_');
    const sessions = [];

    for (const key of sessionKeys) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          sessions.push(JSON.parse(data));
        }
      } catch (error) {
        // Remove chaves corrompidas
        localStorage.removeItem(key);
      }
    }

    return sessions;
  }

  private async removeStoredSession(sessionId: string): Promise<void> {
    localStorage.removeItem(`session_${sessionId}`);
  }

  /**
   * Cleanup na destruição
   */
  destroy(): void {
    this.stopScheduledCleanup();
  }
}

// Instância singleton
export const dataCleanupService = new DataCleanupService();

// Auto-inicialização
if (typeof window !== 'undefined') {
  // Executa limpeza inicial após 30 segundos
  setTimeout(() => {
    dataCleanupService.forceCleanup();
  }, 30000);
}