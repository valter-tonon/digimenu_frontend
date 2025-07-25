/**
 * Serviço de detecção de atividade suspeita
 * 
 * Analisa padrões de comportamento para detectar atividades
 * maliciosas, bots e tentativas de abuso do sistema.
 */

import { rateLimitingService } from './rateLimiting';
import { fingerprintDetectionService } from './fingerprintDetection';

export interface SuspiciousActivity {
  id: string;
  type: SuspiciousActivityType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: any;
  timestamp: Date;
  ip: string;
  fingerprint?: string;
  userAgent?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  actions: string[];
}

export type SuspiciousActivityType = 
  | 'rapid_requests'
  | 'fingerprint_spoofing'
  | 'multiple_sessions'
  | 'unusual_patterns'
  | 'bot_behavior'
  | 'ip_rotation'
  | 'session_hijacking'
  | 'data_scraping';

export interface DetectionRule {
  type: SuspiciousActivityType;
  enabled: boolean;
  threshold: number;
  timeWindow: number; // em milissegundos
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoBlock: boolean;
  description: string;
}

export interface ActivityPattern {
  ip: string;
  fingerprint?: string;
  userAgent?: string;
  requests: ActivityRequest[];
  sessions: string[];
  firstSeen: Date;
  lastSeen: Date;
  totalRequests: number;
  suspiciousScore: number;
}

export interface ActivityRequest {
  timestamp: Date;
  url: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  fingerprint?: string;
}

class SuspiciousActivityDetectionService {
  private readonly STORAGE_KEY = 'suspicious_activities';
  private readonly PATTERNS_KEY = 'activity_patterns';
  private readonly WHITELIST_KEY = 'ip_whitelist';

  private readonly detectionRules: DetectionRule[] = [
    {
      type: 'rapid_requests',
      enabled: true,
      threshold: 50, // 50 requisições
      timeWindow: 60 * 1000, // em 1 minuto
      severity: 'high',
      autoBlock: true,
      description: 'Muitas requisições em pouco tempo'
    },
    {
      type: 'fingerprint_spoofing',
      enabled: true,
      threshold: 5, // 5 fingerprints diferentes
      timeWindow: 10 * 60 * 1000, // em 10 minutos
      severity: 'critical',
      autoBlock: true,
      description: 'Múltiplos fingerprints do mesmo IP'
    },
    {
      type: 'multiple_sessions',
      enabled: true,
      threshold: 10, // 10 sessões simultâneas
      timeWindow: 60 * 60 * 1000, // em 1 hora
      severity: 'medium',
      autoBlock: false,
      description: 'Muitas sessões simultâneas'
    },
    {
      type: 'bot_behavior',
      enabled: true,
      threshold: 3, // 3 indicadores de bot
      timeWindow: 5 * 60 * 1000, // em 5 minutos
      severity: 'high',
      autoBlock: true,
      description: 'Comportamento típico de bot'
    },
    {
      type: 'ip_rotation',
      enabled: true,
      threshold: 20, // 20 IPs diferentes
      timeWindow: 30 * 60 * 1000, // em 30 minutos
      severity: 'medium',
      autoBlock: false,
      description: 'Rotação suspeita de IPs'
    }
  ];

  /**
   * Analisa atividade e detecta comportamentos suspeitos
   */
  async analyzeActivity(
    ip: string,
    fingerprint?: string,
    userAgent?: string,
    requestData?: {
      url: string;
      method: string;
      statusCode: number;
      responseTime: number;
    }
  ): Promise<{
    isSuspicious: boolean;
    suspiciousActivities: SuspiciousActivity[];
    riskScore: number;
    recommendedActions: string[];
  }> {
    try {
      // Verifica se IP está na whitelist
      if (await this.isWhitelisted(ip)) {
        return {
          isSuspicious: false,
          suspiciousActivities: [],
          riskScore: 0,
          recommendedActions: []
        };
      }

      // Atualiza padrão de atividade
      await this.updateActivityPattern(ip, fingerprint, userAgent, requestData);

      // Obtém padrão atual
      const pattern = await this.getActivityPattern(ip);
      if (!pattern) {
        return {
          isSuspicious: false,
          suspiciousActivities: [],
          riskScore: 0,
          recommendedActions: []
        };
      }

      // Executa regras de detecção
      const detectedActivities: SuspiciousActivity[] = [];
      
      for (const rule of this.detectionRules.filter(r => r.enabled)) {
        const activity = await this.checkRule(rule, pattern);
        if (activity) {
          detectedActivities.push(activity);
        }
      }

      // Calcula score de risco
      const riskScore = this.calculateRiskScore(pattern, detectedActivities);

      // Determina ações recomendadas
      const recommendedActions = this.getRecommendedActions(detectedActivities, riskScore);

      // Executa ações automáticas
      await this.executeAutoActions(detectedActivities, ip, fingerprint);

      // Armazena atividades suspeitas
      if (detectedActivities.length > 0) {
        await this.storeSuspiciousActivities(detectedActivities);
      }

      return {
        isSuspicious: detectedActivities.length > 0,
        suspiciousActivities: detectedActivities,
        riskScore,
        recommendedActions
      };

    } catch (error) {
      console.error('Erro na análise de atividade suspeita:', error);
      return {
        isSuspicious: false,
        suspiciousActivities: [],
        riskScore: 0,
        recommendedActions: []
      };
    }
  }

  /**
   * Verifica regra específica de detecção
   */
  private async checkRule(rule: DetectionRule, pattern: ActivityPattern): Promise<SuspiciousActivity | null> {
    const now = Date.now();
    const windowStart = now - rule.timeWindow;

    switch (rule.type) {
      case 'rapid_requests':
        return this.checkRapidRequests(rule, pattern, windowStart);
      
      case 'fingerprint_spoofing':
        return this.checkFingerprintSpoofing(rule, pattern, windowStart);
      
      case 'multiple_sessions':
        return this.checkMultipleSessions(rule, pattern, windowStart);
      
      case 'bot_behavior':
        return this.checkBotBehavior(rule, pattern, windowStart);
      
      case 'ip_rotation':
        return this.checkIPRotation(rule, pattern, windowStart);
      
      default:
        return null;
    }
  }

  /**
   * Verifica requisições rápidas demais
   */
  private async checkRapidRequests(
    rule: DetectionRule,
    pattern: ActivityPattern,
    windowStart: number
  ): Promise<SuspiciousActivity | null> {
    const recentRequests = pattern.requests.filter(
      req => req.timestamp.getTime() >= windowStart
    );

    if (recentRequests.length >= rule.threshold) {
      return {
        id: this.generateId(),
        type: 'rapid_requests',
        severity: rule.severity,
        description: `${recentRequests.length} requisições em ${rule.timeWindow / 1000} segundos`,
        evidence: {
          requestCount: recentRequests.length,
          timeWindow: rule.timeWindow,
          requests: recentRequests.slice(-10) // Últimas 10 requisições
        },
        timestamp: new Date(),
        ip: pattern.ip,
        fingerprint: pattern.fingerprint,
        userAgent: pattern.userAgent,
        resolved: false,
        actions: rule.autoBlock ? ['block_ip'] : ['monitor']
      };
    }

    return null;
  }

  /**
   * Verifica spoofing de fingerprint
   */
  private async checkFingerprintSpoofing(
    rule: DetectionRule,
    pattern: ActivityPattern,
    windowStart: number
  ): Promise<SuspiciousActivity | null> {
    const recentRequests = pattern.requests.filter(
      req => req.timestamp.getTime() >= windowStart
    );

    const uniqueFingerprints = new Set(
      recentRequests
        .map(req => req.fingerprint)
        .filter(fp => fp)
    );

    if (uniqueFingerprints.size >= rule.threshold) {
      return {
        id: this.generateId(),
        type: 'fingerprint_spoofing',
        severity: rule.severity,
        description: `${uniqueFingerprints.size} fingerprints diferentes do mesmo IP`,
        evidence: {
          fingerprintCount: uniqueFingerprints.size,
          fingerprints: Array.from(uniqueFingerprints),
          timeWindow: rule.timeWindow
        },
        timestamp: new Date(),
        ip: pattern.ip,
        fingerprint: pattern.fingerprint,
        userAgent: pattern.userAgent,
        resolved: false,
        actions: rule.autoBlock ? ['block_ip', 'invalidate_sessions'] : ['monitor']
      };
    }

    return null;
  }

  /**
   * Verifica múltiplas sessões
   */
  private async checkMultipleSessions(
    rule: DetectionRule,
    pattern: ActivityPattern,
    windowStart: number
  ): Promise<SuspiciousActivity | null> {
    if (pattern.sessions.length >= rule.threshold) {
      return {
        id: this.generateId(),
        type: 'multiple_sessions',
        severity: rule.severity,
        description: `${pattern.sessions.length} sessões simultâneas`,
        evidence: {
          sessionCount: pattern.sessions.length,
          sessions: pattern.sessions
        },
        timestamp: new Date(),
        ip: pattern.ip,
        fingerprint: pattern.fingerprint,
        userAgent: pattern.userAgent,
        resolved: false,
        actions: rule.autoBlock ? ['limit_sessions'] : ['monitor']
      };
    }

    return null;
  }

  /**
   * Verifica comportamento de bot
   */
  private async checkBotBehavior(
    rule: DetectionRule,
    pattern: ActivityPattern,
    windowStart: number
  ): Promise<SuspiciousActivity | null> {
    const recentRequests = pattern.requests.filter(
      req => req.timestamp.getTime() >= windowStart
    );

    let botIndicators = 0;
    const evidence: any = {};

    // Indicador 1: Requisições muito regulares (mesmo intervalo)
    if (recentRequests.length >= 5) {
      const intervals = [];
      for (let i = 1; i < recentRequests.length; i++) {
        intervals.push(
          recentRequests[i].timestamp.getTime() - recentRequests[i-1].timestamp.getTime()
        );
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, interval) => 
        sum + Math.pow(interval - avgInterval, 2), 0
      ) / intervals.length;
      
      if (variance < 1000) { // Variância muito baixa (< 1 segundo)
        botIndicators++;
        evidence.regularIntervals = { avgInterval, variance };
      }
    }

    // Indicador 2: User-Agent suspeito
    if (pattern.userAgent) {
      const suspiciousUA = [
        'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python', 'java'
      ];
      
      if (suspiciousUA.some(ua => pattern.userAgent!.toLowerCase().includes(ua))) {
        botIndicators++;
        evidence.suspiciousUserAgent = pattern.userAgent;
      }
    }

    // Indicador 3: Tempo de resposta muito baixo (não lê conteúdo)
    const avgResponseTime = recentRequests.reduce((sum, req) => sum + req.responseTime, 0) / recentRequests.length;
    if (avgResponseTime < 100) { // Menos de 100ms
      botIndicators++;
      evidence.fastResponseTime = avgResponseTime;
    }

    // Indicador 4: Padrão de URLs suspeito
    const urls = recentRequests.map(req => req.url);
    const uniqueUrls = new Set(urls);
    if (uniqueUrls.size / urls.length < 0.3) { // Menos de 30% de URLs únicas
      botIndicators++;
      evidence.repetitiveUrls = { total: urls.length, unique: uniqueUrls.size };
    }

    if (botIndicators >= rule.threshold) {
      return {
        id: this.generateId(),
        type: 'bot_behavior',
        severity: rule.severity,
        description: `${botIndicators} indicadores de comportamento de bot`,
        evidence: {
          indicatorCount: botIndicators,
          ...evidence
        },
        timestamp: new Date(),
        ip: pattern.ip,
        fingerprint: pattern.fingerprint,
        userAgent: pattern.userAgent,
        resolved: false,
        actions: rule.autoBlock ? ['block_ip', 'challenge'] : ['monitor']
      };
    }

    return null;
  }

  /**
   * Verifica rotação de IPs (para detectar proxies/VPNs)
   */
  private async checkIPRotation(
    rule: DetectionRule,
    pattern: ActivityPattern,
    windowStart: number
  ): Promise<SuspiciousActivity | null> {
    // Esta verificação seria feita analisando múltiplos padrões
    // Por simplicidade, retorna null aqui
    return null;
  }

  /**
   * Calcula score de risco baseado no padrão e atividades detectadas
   */
  private calculateRiskScore(pattern: ActivityPattern, activities: SuspiciousActivity[]): number {
    let score = 0;

    // Score base do padrão
    score += Math.min(pattern.totalRequests / 100, 10); // Até 10 pontos por volume
    score += Math.min(pattern.sessions.length, 5); // Até 5 pontos por sessões

    // Score das atividades suspeitas
    activities.forEach(activity => {
      switch (activity.severity) {
        case 'low': score += 5; break;
        case 'medium': score += 15; break;
        case 'high': score += 30; break;
        case 'critical': score += 50; break;
      }
    });

    return Math.min(score, 100); // Máximo 100
  }

  /**
   * Determina ações recomendadas baseadas nas atividades e score
   */
  private getRecommendedActions(activities: SuspiciousActivity[], riskScore: number): string[] {
    const actions = new Set<string>();

    activities.forEach(activity => {
      activity.actions.forEach(action => actions.add(action));
    });

    // Ações baseadas no score de risco
    if (riskScore >= 80) {
      actions.add('block_ip');
      actions.add('invalidate_sessions');
    } else if (riskScore >= 60) {
      actions.add('rate_limit');
      actions.add('challenge');
    } else if (riskScore >= 40) {
      actions.add('monitor');
      actions.add('log_detailed');
    }

    return Array.from(actions);
  }

  /**
   * Executa ações automáticas
   */
  private async executeAutoActions(
    activities: SuspiciousActivity[],
    ip: string,
    fingerprint?: string
  ): Promise<void> {
    const autoActions = new Set<string>();
    
    activities.forEach(activity => {
      if (activity.actions.includes('block_ip')) {
        autoActions.add('block_ip');
      }
    });

    // Executa bloqueio de IP se necessário
    if (autoActions.has('block_ip')) {
      await rateLimitingService.blockIP(
        ip,
        'general',
        'Atividade suspeita detectada automaticamente',
        2 * 60 * 60 * 1000 // 2 horas
      );

      console.log(`IP ${ip} bloqueado automaticamente por atividade suspeita`);
    }

    // Invalida fingerprint se necessário
    if (autoActions.has('invalidate_sessions') && fingerprint) {
      await fingerprintDetectionService.blockFingerprint(
        fingerprint,
        'Atividade suspeita detectada'
      );

      console.log(`Fingerprint ${fingerprint} bloqueado por atividade suspeita`);
    }
  }

  /**
   * Métodos auxiliares para armazenamento
   */

  private async updateActivityPattern(
    ip: string,
    fingerprint?: string,
    userAgent?: string,
    requestData?: any
  ): Promise<void> {
    const patterns = await this.getActivityPatterns();
    let pattern = patterns.find(p => p.ip === ip);

    if (!pattern) {
      pattern = {
        ip,
        fingerprint,
        userAgent,
        requests: [],
        sessions: [],
        firstSeen: new Date(),
        lastSeen: new Date(),
        totalRequests: 0,
        suspiciousScore: 0
      };
      patterns.push(pattern);
    }

    // Atualiza padrão
    pattern.lastSeen = new Date();
    pattern.totalRequests++;
    
    if (fingerprint && !pattern.fingerprint) {
      pattern.fingerprint = fingerprint;
    }
    
    if (userAgent && !pattern.userAgent) {
      pattern.userAgent = userAgent;
    }

    // Adiciona requisição se fornecida
    if (requestData) {
      pattern.requests.push({
        timestamp: new Date(),
        ...requestData,
        fingerprint,
        userAgent
      });

      // Mantém apenas últimas 100 requisições
      if (pattern.requests.length > 100) {
        pattern.requests = pattern.requests.slice(-100);
      }
    }

    await this.storeActivityPatterns(patterns);
  }

  private async getActivityPattern(ip: string): Promise<ActivityPattern | null> {
    const patterns = await this.getActivityPatterns();
    return patterns.find(p => p.ip === ip) || null;
  }

  private async getActivityPatterns(): Promise<ActivityPattern[]> {
    try {
      const stored = localStorage.getItem(this.PATTERNS_KEY);
      if (!stored) return [];

      return JSON.parse(stored).map((pattern: any) => ({
        ...pattern,
        firstSeen: new Date(pattern.firstSeen),
        lastSeen: new Date(pattern.lastSeen),
        requests: pattern.requests.map((req: any) => ({
          ...req,
          timestamp: new Date(req.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Erro ao obter padrões de atividade:', error);
      return [];
    }
  }

  private async storeActivityPatterns(patterns: ActivityPattern[]): Promise<void> {
    try {
      // Remove padrões antigos (mais de 7 dias)
      const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const recentPatterns = patterns.filter(p => p.lastSeen.getTime() > cutoff);
      
      localStorage.setItem(this.PATTERNS_KEY, JSON.stringify(recentPatterns));
    } catch (error) {
      console.error('Erro ao armazenar padrões de atividade:', error);
    }
  }

  private async storeSuspiciousActivities(activities: SuspiciousActivity[]): Promise<void> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const existing = stored ? JSON.parse(stored) : [];
      
      existing.push(...activities);
      
      // Mantém apenas últimas 1000 atividades
      const recent = existing.slice(-1000);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recent));
    } catch (error) {
      console.error('Erro ao armazenar atividades suspeitas:', error);
    }
  }

  private async isWhitelisted(ip: string): Promise<boolean> {
    try {
      const stored = localStorage.getItem(this.WHITELIST_KEY);
      if (!stored) return false;
      
      const whitelist: string[] = JSON.parse(stored);
      return whitelist.includes(ip);
    } catch (error) {
      return false;
    }
  }

  private generateId(): string {
    return `suspicious_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Métodos públicos para administração
   */

  async getSuspiciousActivities(limit = 100): Promise<SuspiciousActivity[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const activities = JSON.parse(stored).map((activity: any) => ({
        ...activity,
        timestamp: new Date(activity.timestamp),
        resolvedAt: activity.resolvedAt ? new Date(activity.resolvedAt) : undefined
      }));

      return activities.slice(-limit);
    } catch (error) {
      console.error('Erro ao obter atividades suspeitas:', error);
      return [];
    }
  }

  async resolveActivity(activityId: string, resolvedBy: string): Promise<void> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const activities = JSON.parse(stored);
      const activity = activities.find((a: any) => a.id === activityId);
      
      if (activity) {
        activity.resolved = true;
        activity.resolvedAt = new Date();
        activity.resolvedBy = resolvedBy;
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(activities));
      }
    } catch (error) {
      console.error('Erro ao resolver atividade suspeita:', error);
    }
  }

  async addToWhitelist(ip: string): Promise<void> {
    try {
      const stored = localStorage.getItem(this.WHITELIST_KEY);
      const whitelist = stored ? JSON.parse(stored) : [];
      
      if (!whitelist.includes(ip)) {
        whitelist.push(ip);
        localStorage.setItem(this.WHITELIST_KEY, JSON.stringify(whitelist));
      }
    } catch (error) {
      console.error('Erro ao adicionar IP à whitelist:', error);
    }
  }
}

export const suspiciousActivityDetectionService = new SuspiciousActivityDetectionService();