/**
 * Serviço de detecção de mudanças suspeitas em fingerprints
 * 
 * Implementa algoritmos para detectar atividade suspeita e mudanças
 * não autorizadas em fingerprints de dispositivos.
 */

import { 
  FingerprintChangeDetection, 
  FingerprintValidationResult,
  StoredFingerprint,
  FINGERPRINT_CONSTANTS 
} from '../types/fingerprint';
import { fingerprintStorage } from './fingerprintStorage';

export interface SuspiciousActivityPattern {
  type: 'rapid_changes' | 'invalid_fingerprint' | 'blocked_fingerprint' | 'similarity_drop' | 'usage_spike';
  severity: 'low' | 'medium' | 'high';
  description: string;
  metadata?: Record<string, any>;
}

export interface FingerprintDetectionService {
  validateFingerprint(fingerprint: string, previousFingerprint?: string): Promise<FingerprintValidationResult>;
  detectSuspiciousChanges(oldFingerprint: string, newFingerprint: string): Promise<FingerprintChangeDetection>;
  analyzeActivityPattern(fingerprint: string): Promise<SuspiciousActivityPattern[]>;
  shouldBlockFingerprint(fingerprint: string): Promise<boolean>;
  calculateRiskScore(fingerprint: string): Promise<number>;
}

export class BrowserFingerprintDetectionService implements FingerprintDetectionService {
  private static instance: BrowserFingerprintDetectionService;
  private readonly suspiciousThreshold = FINGERPRINT_CONSTANTS.DEFAULT_CONFIDENCE;
  private readonly blockThreshold = FINGERPRINT_CONSTANTS.MAX_SUSPICIOUS_ACTIVITY;

  public static getInstance(): BrowserFingerprintDetectionService {
    if (!BrowserFingerprintDetectionService.instance) {
      BrowserFingerprintDetectionService.instance = new BrowserFingerprintDetectionService();
    }
    return BrowserFingerprintDetectionService.instance;
  }

  /**
   * Valida fingerprint e detecta atividade suspeita
   */
  async validateFingerprint(
    fingerprint: string, 
    previousFingerprint?: string
  ): Promise<FingerprintValidationResult> {
    // Validação básica de formato
    if (!this.isValidFingerprintFormat(fingerprint)) {
      return {
        isValid: false,
        isSuspicious: true,
        isBlocked: false,
        reason: 'Formato de fingerprint inválido'
      };
    }

    // Verifica se está bloqueado
    const stored = await fingerprintStorage.get(fingerprint);
    if (stored?.isBlocked) {
      return {
        isValid: false,
        isSuspicious: true,
        isBlocked: true,
        reason: 'Fingerprint bloqueado por atividade suspeita'
      };
    }

    // Compara com fingerprint anterior se fornecido
    let similarity = 1;
    let isSuspicious = false;
    
    if (previousFingerprint && previousFingerprint !== fingerprint) {
      similarity = this.calculateSimilarity(previousFingerprint, fingerprint);
      isSuspicious = similarity < this.suspiciousThreshold;
    }

    // Analisa padrões de atividade
    const patterns = await this.analyzeActivityPattern(fingerprint);
    const hasHighRiskPatterns = patterns.some(p => p.severity === 'high');

    return {
      isValid: true,
      isSuspicious: isSuspicious || hasHighRiskPatterns,
      isBlocked: false,
      similarity,
      reason: isSuspicious ? 'Mudança suspeita detectada' : undefined
    };
  }

  /**
   * Detecta mudanças suspeitas entre fingerprints
   */
  async detectSuspiciousChanges(
    oldFingerprint: string, 
    newFingerprint: string
  ): Promise<FingerprintChangeDetection> {
    const similarity = this.calculateSimilarity(oldFingerprint, newFingerprint);
    const hasChanged = oldFingerprint !== newFingerprint;
    
    const suspiciousChanges: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    if (hasChanged) {
      // Analisa o nível de mudança
      if (similarity < 0.1) {
        suspiciousChanges.push('Mudança drástica no fingerprint');
        riskLevel = 'high';
      } else if (similarity < 0.3) {
        suspiciousChanges.push('Mudança significativa no fingerprint');
        riskLevel = 'medium';
      } else if (similarity < 0.7) {
        suspiciousChanges.push('Mudança moderada no fingerprint');
        riskLevel = 'low';
      }

      // Verifica padrões específicos
      const oldStored = await fingerprintStorage.get(oldFingerprint);
      const newStored = await fingerprintStorage.get(newFingerprint);

      if (oldStored && newStored) {
        // Compara informações específicas do dispositivo
        const deviceChanges = this.compareDeviceInfo(
          oldStored.deviceInfo, 
          newStored.deviceInfo
        );
        suspiciousChanges.push(...deviceChanges);
      }
    }

    return {
      hasChanged,
      similarity,
      suspiciousChanges,
      riskLevel
    };
  }

  /**
   * Analisa padrões de atividade suspeita
   */
  async analyzeActivityPattern(fingerprint: string): Promise<SuspiciousActivityPattern[]> {
    const patterns: SuspiciousActivityPattern[] = [];
    const stored = await fingerprintStorage.get(fingerprint);

    if (!stored) {
      return patterns;
    }

    // Verifica uso excessivo
    if (stored.usageCount > 100) {
      patterns.push({
        type: 'usage_spike',
        severity: 'medium',
        description: `Uso excessivo detectado: ${stored.usageCount} acessos`,
        metadata: { usageCount: stored.usageCount }
      });
    }

    // Verifica atividade suspeita acumulada
    if (stored.suspiciousActivity > 3) {
      patterns.push({
        type: 'rapid_changes',
        severity: stored.suspiciousActivity > 7 ? 'high' : 'medium',
        description: `Múltiplas atividades suspeitas: ${stored.suspiciousActivity}`,
        metadata: { suspiciousCount: stored.suspiciousActivity }
      });
    }

    // Verifica se está bloqueado
    if (stored.isBlocked) {
      patterns.push({
        type: 'blocked_fingerprint',
        severity: 'high',
        description: 'Fingerprint foi bloqueado por atividade suspeita',
        metadata: { blockedAt: stored.lastSeen }
      });
    }

    // Verifica mudanças rápidas (múltiplos acessos em pouco tempo)
    const now = new Date();
    const timeSinceCreation = now.getTime() - stored.createdAt.getTime();
    const hoursActive = timeSinceCreation / (1000 * 60 * 60);
    
    if (hoursActive < 1 && stored.usageCount > 10) {
      patterns.push({
        type: 'rapid_changes',
        severity: 'high',
        description: 'Muitos acessos em pouco tempo',
        metadata: { 
          hoursActive: hoursActive.toFixed(2), 
          usageCount: stored.usageCount 
        }
      });
    }

    return patterns;
  }

  /**
   * Determina se um fingerprint deve ser bloqueado
   */
  async shouldBlockFingerprint(fingerprint: string): Promise<boolean> {
    const stored = await fingerprintStorage.get(fingerprint);
    
    if (!stored) {
      return false;
    }

    // Já está bloqueado
    if (stored.isBlocked) {
      return true;
    }

    // Muita atividade suspeita
    if (stored.suspiciousActivity >= this.blockThreshold) {
      return true;
    }

    // Uso excessivo em pouco tempo
    const now = new Date();
    const timeSinceCreation = now.getTime() - stored.createdAt.getTime();
    const hoursActive = timeSinceCreation / (1000 * 60 * 60);
    
    if (hoursActive < 1 && stored.usageCount > 50) {
      return true;
    }

    // Padrões de alto risco
    const patterns = await this.analyzeActivityPattern(fingerprint);
    const hasHighRiskPatterns = patterns.some(p => p.severity === 'high');
    
    return hasHighRiskPatterns;
  }

  /**
   * Calcula score de risco (0-1)
   */
  async calculateRiskScore(fingerprint: string): Promise<number> {
    let riskScore = 0;
    const stored = await fingerprintStorage.get(fingerprint);

    if (!stored) {
      return 0.1; // Risco baixo para fingerprints novos
    }

    // Atividade suspeita (0-0.4)
    riskScore += Math.min(stored.suspiciousActivity / this.blockThreshold, 1) * 0.4;

    // Uso excessivo (0-0.2)
    riskScore += Math.min(stored.usageCount / 200, 1) * 0.2;

    // Fingerprint bloqueado (0.5)
    if (stored.isBlocked) {
      riskScore += 0.5;
    }

    // Baixa confiança no fingerprint (0-0.2)
    riskScore += (1 - stored.confidence) * 0.2;

    // Atividade recente suspeita (0-0.1)
    const patterns = await this.analyzeActivityPattern(fingerprint);
    const recentHighRisk = patterns.filter(p => p.severity === 'high').length;
    riskScore += Math.min(recentHighRisk / 3, 1) * 0.1;

    return Math.min(riskScore, 1);
  }

  /**
   * Valida formato básico do fingerprint
   */
  private isValidFingerprintFormat(fingerprint: string): boolean {
    if (!fingerprint || typeof fingerprint !== 'string') {
      return false;
    }

    // Verifica se é um hash hexadecimal válido
    const hexRegex = /^[a-f0-9]+$/i;
    return hexRegex.test(fingerprint) && 
           fingerprint.length >= FINGERPRINT_CONSTANTS.MIN_HASH_LENGTH &&
           fingerprint.length <= FINGERPRINT_CONSTANTS.MAX_HASH_LENGTH;
  }

  /**
   * Calcula similaridade entre dois fingerprints
   */
  private calculateSimilarity(fp1: string, fp2: string): number {
    if (fp1 === fp2) return 1.0;
    if (!fp1 || !fp2) return 0.0;

    // Algoritmo de similaridade baseado em subsequências comuns
    const len1 = fp1.length;
    const len2 = fp2.length;
    const maxLen = Math.max(len1, len2);
    
    if (maxLen === 0) return 1.0;

    // Conta caracteres iguais na mesma posição
    let exactMatches = 0;
    const minLen = Math.min(len1, len2);
    
    for (let i = 0; i < minLen; i++) {
      if (fp1[i] === fp2[i]) {
        exactMatches++;
      }
    }

    // Conta subsequências comuns
    let commonSubsequences = 0;
    for (let i = 0; i < len1 - 1; i++) {
      const substr = fp1.substring(i, i + 2);
      if (fp2.includes(substr)) {
        commonSubsequences++;
      }
    }

    // Combina métricas
    const exactSimilarity = exactMatches / maxLen;
    const subsequenceSimilarity = commonSubsequences / Math.max(len1 - 1, 1);
    
    return (exactSimilarity * 0.7) + (subsequenceSimilarity * 0.3);
  }

  /**
   * Compara informações de dispositivo entre fingerprints
   */
  private compareDeviceInfo(oldInfo: any, newInfo: any): string[] {
    const changes: string[] = [];

    // Verifica mudanças críticas
    if (oldInfo.userAgent !== newInfo.userAgent) {
      changes.push('User Agent alterado');
    }

    if (oldInfo.screenResolution !== newInfo.screenResolution) {
      changes.push('Resolução de tela alterada');
    }

    if (oldInfo.timeZone !== newInfo.timeZone) {
      changes.push('Fuso horário alterado');
    }

    if (oldInfo.language !== newInfo.language) {
      changes.push('Idioma alterado');
    }

    // Mudanças no canvas/WebGL são mais suspeitas
    if (oldInfo.canvasHash !== newInfo.canvasHash) {
      changes.push('Canvas fingerprint alterado');
    }

    if (oldInfo.webglHash !== newInfo.webglHash) {
      changes.push('WebGL fingerprint alterado');
    }

    return changes;
  }

  /**
   * Registra atividade suspeita
   */
  async recordSuspiciousActivity(
    fingerprint: string, 
    activityType: string, 
    metadata?: Record<string, any>
  ): Promise<void> {
    await fingerprintStorage.incrementSuspiciousActivity(fingerprint);
    
    console.warn(`Atividade suspeita detectada: ${activityType}`, {
      fingerprint,
      metadata,
      timestamp: new Date().toISOString()
    });

    // Verifica se deve bloquear
    const shouldBlock = await this.shouldBlockFingerprint(fingerprint);
    if (shouldBlock) {
      await fingerprintStorage.block(fingerprint, `Bloqueado por: ${activityType}`);
    }
  }

  /**
   * Gera relatório de segurança para um fingerprint
   */
  async generateSecurityReport(fingerprint: string): Promise<{
    fingerprint: string;
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    patterns: SuspiciousActivityPattern[];
    recommendations: string[];
    isBlocked: boolean;
  }> {
    const riskScore = await this.calculateRiskScore(fingerprint);
    const patterns = await this.analyzeActivityPattern(fingerprint);
    const stored = await fingerprintStorage.get(fingerprint);
    
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (riskScore > 0.7) riskLevel = 'high';
    else if (riskScore > 0.4) riskLevel = 'medium';

    const recommendations: string[] = [];
    
    if (riskScore > 0.5) {
      recommendations.push('Considerar bloqueio temporário');
    }
    
    if (patterns.some(p => p.type === 'usage_spike')) {
      recommendations.push('Monitorar frequência de acesso');
    }
    
    if (patterns.some(p => p.type === 'rapid_changes')) {
      recommendations.push('Implementar verificação adicional');
    }

    return {
      fingerprint,
      riskScore,
      riskLevel,
      patterns,
      recommendations,
      isBlocked: stored?.isBlocked || false
    };
  }
}

// Instância singleton
export const fingerprintDetectionService = BrowserFingerprintDetectionService.getInstance();