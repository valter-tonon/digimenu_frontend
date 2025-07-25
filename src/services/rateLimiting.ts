/**
 * Serviço de rate limiting
 * 
 * Implementa controle de taxa de requisições para diferentes tipos
 * de operações (QR Code, WhatsApp, fingerprint) com bloqueio
 * temporário de IPs suspeitos.
 */

export interface RateLimitConfig {
  windowMs: number; // Janela de tempo em milissegundos
  maxRequests: number; // Máximo de requisições na janela
  blockDurationMs: number; // Duração do bloqueio em milissegundos
  skipSuccessfulRequests?: boolean; // Se deve pular requisições bem-sucedidas
  skipFailedRequests?: boolean; // Se deve pular requisições falhadas
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number; // Segundos até poder tentar novamente
  reason?: string;
}

export interface BlockedIP {
  ip: string;
  reason: string;
  blockedAt: Date;
  expiresAt: Date;
  attempts: number;
  type: RateLimitType;
}

export type RateLimitType = 'qr_code' | 'whatsapp' | 'fingerprint' | 'general';

export interface RateLimitAttempt {
  ip: string;
  fingerprint?: string;
  type: RateLimitType;
  success: boolean;
  timestamp: Date;
  userAgent?: string;
  metadata?: any;
}

class RateLimitingService {
  private readonly configs: Record<RateLimitType, RateLimitConfig> = {
    qr_code: {
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 10,
      blockDurationMs: 60 * 60 * 1000, // 1 hora de bloqueio
      skipSuccessfulRequests: false
    },
    whatsapp: {
      windowMs: 24 * 60 * 60 * 1000, // 24 horas
      maxRequests: 3,
      blockDurationMs: 24 * 60 * 60 * 1000, // 24 horas de bloqueio
      skipFailedRequests: false
    },
    fingerprint: {
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 100,
      blockDurationMs: 2 * 60 * 60 * 1000, // 2 horas de bloqueio
      skipSuccessfulRequests: true
    },
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 50,
      blockDurationMs: 30 * 60 * 1000, // 30 minutos de bloqueio
      skipSuccessfulRequests: false
    }
  };

  private readonly STORAGE_PREFIX = 'rate_limit_';
  private readonly BLOCKED_IPS_KEY = 'blocked_ips';
  private readonly ATTEMPTS_KEY = 'rate_limit_attempts';

  /**
   * Verifica se uma requisição é permitida
   */
  async checkRateLimit(
    identifier: string,
    type: RateLimitType,
    metadata?: any
  ): Promise<RateLimitResult> {
    try {
      // Verifica se IP está bloqueado
      const isBlocked = await this.isIPBlocked(identifier);
      if (isBlocked.blocked) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: isBlocked.expiresAt!,
          retryAfter: Math.ceil((isBlocked.expiresAt!.getTime() - Date.now()) / 1000),
          reason: `IP bloqueado: ${isBlocked.reason}`
        };
      }

      const config = this.configs[type];
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Obtém tentativas na janela de tempo
      const attempts = await this.getAttemptsInWindow(identifier, type, windowStart);
      
      // Filtra tentativas baseado na configuração
      let relevantAttempts = attempts;
      if (config.skipSuccessfulRequests) {
        relevantAttempts = attempts.filter(a => !a.success);
      }
      if (config.skipFailedRequests) {
        relevantAttempts = attempts.filter(a => a.success);
      }

      const requestCount = relevantAttempts.length;
      const remaining = Math.max(0, config.maxRequests - requestCount);
      const resetTime = new Date(now + config.windowMs);

      // Verifica se excedeu o limite
      if (requestCount >= config.maxRequests) {
        // Bloqueia IP se muitas tentativas falhadas
        if (this.shouldBlockIP(attempts, type)) {
          await this.blockIP(identifier, type, 'Excesso de tentativas');
        }

        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter: Math.ceil(config.windowMs / 1000),
          reason: `Limite de ${config.maxRequests} requisições por ${this.formatDuration(config.windowMs)} excedido`
        };
      }

      return {
        allowed: true,
        remaining,
        resetTime
      };

    } catch (error) {
      console.error('Erro ao verificar rate limit:', error);
      
      // Em caso de erro, permite a requisição mas registra o problema
      return {
        allowed: true,
        remaining: 1,
        resetTime: new Date(Date.now() + 60000), // 1 minuto
        reason: 'Erro interno no rate limiting'
      };
    }
  }

  /**
   * Registra uma tentativa de requisição
   */
  async recordAttempt(
    identifier: string,
    type: RateLimitType,
    success: boolean,
    metadata?: any
  ): Promise<void> {
    try {
      const attempt: RateLimitAttempt = {
        ip: identifier,
        fingerprint: metadata?.fingerprint,
        type,
        success,
        timestamp: new Date(),
        userAgent: metadata?.userAgent,
        metadata
      };

      // Armazena tentativa
      await this.storeAttempt(attempt);

      // Limpa tentativas antigas
      await this.cleanupOldAttempts(identifier, type);

    } catch (error) {
      console.error('Erro ao registrar tentativa:', error);
    }
  }

  /**
   * Verifica se IP está bloqueado
   */
  async isIPBlocked(ip: string): Promise<{
    blocked: boolean;
    reason?: string;
    expiresAt?: Date;
    blockedAt?: Date;
  }> {
    try {
      const blockedIPs = await this.getBlockedIPs();
      const blockedIP = blockedIPs.find(blocked => blocked.ip === ip);

      if (!blockedIP) {
        return { blocked: false };
      }

      // Verifica se bloqueio expirou
      if (new Date() > blockedIP.expiresAt) {
        await this.unblockIP(ip);
        return { blocked: false };
      }

      return {
        blocked: true,
        reason: blockedIP.reason,
        expiresAt: blockedIP.expiresAt,
        blockedAt: blockedIP.blockedAt
      };

    } catch (error) {
      console.error('Erro ao verificar IP bloqueado:', error);
      return { blocked: false };
    }
  }

  /**
   * Bloqueia um IP
   */
  async blockIP(
    ip: string,
    type: RateLimitType,
    reason: string,
    customDuration?: number
  ): Promise<void> {
    try {
      const config = this.configs[type];
      const duration = customDuration || config.blockDurationMs;
      const now = new Date();

      const blockedIP: BlockedIP = {
        ip,
        reason,
        blockedAt: now,
        expiresAt: new Date(now.getTime() + duration),
        attempts: await this.getAttemptCount(ip, type),
        type
      };

      const blockedIPs = await this.getBlockedIPs();
      
      // Remove bloqueio anterior se existir
      const filteredIPs = blockedIPs.filter(blocked => blocked.ip !== ip);
      filteredIPs.push(blockedIP);

      await this.storeBlockedIPs(filteredIPs);

      console.log(`IP ${ip} bloqueado por ${reason} até ${blockedIP.expiresAt}`);

      // Registra evento de bloqueio
      await this.logSecurityEvent('ip_blocked', {
        ip,
        type,
        reason,
        duration: duration / 1000,
        expiresAt: blockedIP.expiresAt
      });

    } catch (error) {
      console.error('Erro ao bloquear IP:', error);
    }
  }

  /**
   * Desbloqueia um IP
   */
  async unblockIP(ip: string): Promise<void> {
    try {
      const blockedIPs = await this.getBlockedIPs();
      const filteredIPs = blockedIPs.filter(blocked => blocked.ip !== ip);
      
      await this.storeBlockedIPs(filteredIPs);

      console.log(`IP ${ip} desbloqueado`);

      // Registra evento de desbloqueio
      await this.logSecurityEvent('ip_unblocked', { ip });

    } catch (error) {
      console.error('Erro ao desbloquear IP:', error);
    }
  }

  /**
   * Lista IPs bloqueados
   */
  async getBlockedIPs(): Promise<BlockedIP[]> {
    try {
      const stored = localStorage.getItem(this.BLOCKED_IPS_KEY);
      if (!stored) return [];

      const blockedIPs: BlockedIP[] = JSON.parse(stored).map((blocked: any) => ({
        ...blocked,
        blockedAt: new Date(blocked.blockedAt),
        expiresAt: new Date(blocked.expiresAt)
      }));

      // Remove bloqueios expirados
      const now = new Date();
      const activeBlocks = blockedIPs.filter(blocked => blocked.expiresAt > now);
      
      if (activeBlocks.length !== blockedIPs.length) {
        await this.storeBlockedIPs(activeBlocks);
      }

      return activeBlocks;

    } catch (error) {
      console.error('Erro ao obter IPs bloqueados:', error);
      return [];
    }
  }

  /**
   * Obtém estatísticas de rate limiting
   */
  async getStatistics(type?: RateLimitType): Promise<{
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    blockedIPs: number;
    topIPs: Array<{ ip: string; attempts: number }>;
  }> {
    try {
      const attempts = await this.getAllAttempts(type);
      const blockedIPs = await this.getBlockedIPs();

      // Conta tentativas por IP
      const ipCounts: Record<string, number> = {};
      attempts.forEach(attempt => {
        ipCounts[attempt.ip] = (ipCounts[attempt.ip] || 0) + 1;
      });

      // Top 10 IPs com mais tentativas
      const topIPs = Object.entries(ipCounts)
        .map(([ip, attempts]) => ({ ip, attempts }))
        .sort((a, b) => b.attempts - a.attempts)
        .slice(0, 10);

      return {
        totalAttempts: attempts.length,
        successfulAttempts: attempts.filter(a => a.success).length,
        failedAttempts: attempts.filter(a => !a.success).length,
        blockedIPs: type ? blockedIPs.filter(b => b.type === type).length : blockedIPs.length,
        topIPs
      };

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        blockedIPs: 0,
        topIPs: []
      };
    }
  }

  /**
   * Limpa dados antigos
   */
  async cleanup(): Promise<void> {
    try {
      // Remove IPs bloqueados expirados
      await this.getBlockedIPs(); // Já remove expirados

      // Remove tentativas antigas (mais de 7 dias)
      const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      for (const type of Object.keys(this.configs) as RateLimitType[]) {
        await this.cleanupOldAttempts('*', type, cutoff);
      }

      console.log('Limpeza de rate limiting concluída');

    } catch (error) {
      console.error('Erro na limpeza de rate limiting:', error);
    }
  }

  /**
   * Métodos privados
   */

  private async getAttemptsInWindow(
    identifier: string,
    type: RateLimitType,
    windowStart: number
  ): Promise<RateLimitAttempt[]> {
    const key = `${this.ATTEMPTS_KEY}_${identifier}_${type}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) return [];

    const attempts: RateLimitAttempt[] = JSON.parse(stored).map((attempt: any) => ({
      ...attempt,
      timestamp: new Date(attempt.timestamp)
    }));

    return attempts.filter(attempt => attempt.timestamp.getTime() >= windowStart);
  }

  private async storeAttempt(attempt: RateLimitAttempt): Promise<void> {
    const key = `${this.ATTEMPTS_KEY}_${attempt.ip}_${attempt.type}`;
    const stored = localStorage.getItem(key);
    const attempts = stored ? JSON.parse(stored) : [];
    
    attempts.push(attempt);
    
    // Mantém apenas últimas 100 tentativas
    const recentAttempts = attempts.slice(-100);
    
    localStorage.setItem(key, JSON.stringify(recentAttempts));
  }

  private async cleanupOldAttempts(
    identifier: string,
    type: RateLimitType,
    cutoff?: number
  ): Promise<void> {
    const key = identifier === '*' 
      ? `${this.ATTEMPTS_KEY}_*_${type}`
      : `${this.ATTEMPTS_KEY}_${identifier}_${type}`;
    
    if (identifier === '*') {
      // Limpa todas as chaves do tipo
      const keys = Object.keys(localStorage).filter(k => 
        k.includes(`${this.ATTEMPTS_KEY}_`) && k.endsWith(`_${type}`)
      );
      
      keys.forEach(k => {
        const stored = localStorage.getItem(k);
        if (stored) {
          const attempts = JSON.parse(stored).filter((attempt: any) => 
            new Date(attempt.timestamp).getTime() > (cutoff || Date.now() - 24 * 60 * 60 * 1000)
          );
          
          if (attempts.length > 0) {
            localStorage.setItem(k, JSON.stringify(attempts));
          } else {
            localStorage.removeItem(k);
          }
        }
      });
    } else {
      const stored = localStorage.getItem(key);
      if (stored) {
        const attempts = JSON.parse(stored).filter((attempt: any) => 
          new Date(attempt.timestamp).getTime() > (cutoff || Date.now() - 24 * 60 * 60 * 1000)
        );
        
        if (attempts.length > 0) {
          localStorage.setItem(key, JSON.stringify(attempts));
        } else {
          localStorage.removeItem(key);
        }
      }
    }
  }

  private async getAllAttempts(type?: RateLimitType): Promise<RateLimitAttempt[]> {
    const allAttempts: RateLimitAttempt[] = [];
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith(this.ATTEMPTS_KEY) && (!type || key.endsWith(`_${type}`))
    );

    keys.forEach(key => {
      const stored = localStorage.getItem(key);
      if (stored) {
        const attempts = JSON.parse(stored).map((attempt: any) => ({
          ...attempt,
          timestamp: new Date(attempt.timestamp)
        }));
        allAttempts.push(...attempts);
      }
    });

    return allAttempts;
  }

  private async getAttemptCount(ip: string, type: RateLimitType): Promise<number> {
    const attempts = await this.getAllAttempts(type);
    return attempts.filter(attempt => attempt.ip === ip).length;
  }

  private shouldBlockIP(attempts: RateLimitAttempt[], type: RateLimitType): boolean {
    const recentFailures = attempts.filter(a => 
      !a.success && 
      a.timestamp.getTime() > Date.now() - (15 * 60 * 1000) // Últimos 15 minutos
    );

    // Bloqueia se muitas falhas recentes
    switch (type) {
      case 'whatsapp':
        return recentFailures.length >= 5;
      case 'qr_code':
        return recentFailures.length >= 10;
      case 'fingerprint':
        return recentFailures.length >= 20;
      default:
        return recentFailures.length >= 15;
    }
  }

  private async storeBlockedIPs(blockedIPs: BlockedIP[]): Promise<void> {
    localStorage.setItem(this.BLOCKED_IPS_KEY, JSON.stringify(blockedIPs));
  }

  private async logSecurityEvent(event: string, data: any): Promise<void> {
    const logEntry = {
      event,
      data,
      timestamp: new Date(),
      source: 'rate_limiting'
    };

    console.log('Security event:', logEntry);
    
    // Em produção, enviar para serviço de auditoria
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} dia(s)`;
    if (hours > 0) return `${hours} hora(s)`;
    if (minutes > 0) return `${minutes} minuto(s)`;
    return `${seconds} segundo(s)`;
  }
}

export const rateLimitingService = new RateLimitingService();