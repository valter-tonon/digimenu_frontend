/**
 * Sistema de armazenamento local para fingerprints
 * 
 * Implementa persistência local com TTL e limpeza automática
 */

import { 
  StoredFingerprint, 
  FingerprintStorage, 
  FingerprintAnalytics,
  FINGERPRINT_CONSTANTS 
} from '../types/fingerprint';

interface StorageData {
  fingerprints: Record<string, StoredFingerprint>;
  metadata: {
    lastCleanup: string;
    totalGenerated: number;
    version: string;
  };
}

export class LocalFingerprintStorage implements FingerprintStorage {
  private static instance: LocalFingerprintStorage;
  private readonly storageKey = 'digimenu_fingerprints';
  private readonly version = '1.0.0';
  private cache: Map<string, StoredFingerprint> = new Map();
  private isInitialized = false;

  public static getInstance(): LocalFingerprintStorage {
    if (!LocalFingerprintStorage.instance) {
      LocalFingerprintStorage.instance = new LocalFingerprintStorage();
    }
    return LocalFingerprintStorage.instance;
  }

  /**
   * Inicializa o storage carregando dados do localStorage
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const data = this.loadFromStorage();
      
      // Carrega fingerprints no cache
      Object.entries(data.fingerprints).forEach(([hash, fingerprint]) => {
        this.cache.set(hash, fingerprint);
      });

      // Executa limpeza se necessário
      const lastCleanup = new Date(data.metadata.lastCleanup);
      const now = new Date();
      const hoursSinceCleanup = (now.getTime() - lastCleanup.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCleanup >= 24) {
        await this.cleanup(new Date(now.getTime() - 24 * 60 * 60 * 1000));
      }

      this.isInitialized = true;
    } catch (error) {
      console.warn('Erro ao inicializar fingerprint storage:', error);
      this.initializeEmpty();
    }
  }

  /**
   * Inicializa storage vazio
   */
  private initializeEmpty(): void {
    this.cache.clear();
    this.saveToStorage();
    this.isInitialized = true;
  }

  /**
   * Carrega dados do localStorage
   */
  private loadFromStorage(): StorageData {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return this.getEmptyStorageData();
      }

      const data = JSON.parse(stored) as StorageData;
      
      // Migração de versão se necessário
      if (data.metadata.version !== this.version) {
        return this.migrateData(data);
      }

      return data;
    } catch (error) {
      console.warn('Erro ao carregar fingerprints do storage:', error);
      return this.getEmptyStorageData();
    }
  }

  /**
   * Salva dados no localStorage
   */
  private saveToStorage(): void {
    try {
      const data: StorageData = {
        fingerprints: Object.fromEntries(this.cache.entries()),
        metadata: {
          lastCleanup: new Date().toISOString(),
          totalGenerated: this.cache.size,
          version: this.version
        }
      };

      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar fingerprints no storage:', error);
      
      // Se falhou por falta de espaço, tenta limpeza
      if (error instanceof DOMException && error.code === 22) {
        this.emergencyCleanup();
      }
    }
  }

  /**
   * Retorna estrutura de dados vazia
   */
  private getEmptyStorageData(): StorageData {
    return {
      fingerprints: {},
      metadata: {
        lastCleanup: new Date().toISOString(),
        totalGenerated: 0,
        version: this.version
      }
    };
  }

  /**
   * Migra dados de versões antigas
   */
  private migrateData(oldData: any): StorageData {
    console.log('Migrando dados de fingerprint para versão', this.version);
    
    // Por enquanto, apenas recria os dados
    // Em versões futuras, implementar migração específica
    return this.getEmptyStorageData();
  }

  /**
   * Limpeza de emergência quando localStorage está cheio
   */
  private emergencyCleanup(): void {
    console.warn('Executando limpeza de emergência do fingerprint storage');
    
    // Remove 50% dos fingerprints mais antigos
    const fingerprints = Array.from(this.cache.values());
    fingerprints.sort((a, b) => a.lastSeen.getTime() - b.lastSeen.getTime());
    
    const toRemove = fingerprints.slice(0, Math.floor(fingerprints.length / 2));
    toRemove.forEach(fp => this.cache.delete(fp.hash));
    
    this.saveToStorage();
  }

  /**
   * Recupera fingerprint por hash
   */
  async get(hash: string): Promise<StoredFingerprint | null> {
    await this.initialize();
    
    const fingerprint = this.cache.get(hash);
    if (!fingerprint) return null;

    // Verifica se não expirou (24 horas)
    const now = new Date();
    const hoursSinceLastSeen = (now.getTime() - fingerprint.lastSeen.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastSeen > 24) {
      await this.delete(hash);
      return null;
    }

    return fingerprint;
  }

  /**
   * Armazena novo fingerprint
   */
  async set(fingerprint: StoredFingerprint): Promise<void> {
    await this.initialize();
    
    this.cache.set(fingerprint.hash, {
      ...fingerprint,
      createdAt: new Date(fingerprint.createdAt),
      lastSeen: new Date(fingerprint.lastSeen)
    });
    
    this.saveToStorage();
  }

  /**
   * Atualiza fingerprint existente
   */
  async update(hash: string, updates: Partial<StoredFingerprint>): Promise<void> {
    await this.initialize();
    
    const existing = this.cache.get(hash);
    if (!existing) return;

    const updated = {
      ...existing,
      ...updates,
      lastSeen: new Date() // Sempre atualiza lastSeen
    };

    this.cache.set(hash, updated);
    this.saveToStorage();
  }

  /**
   * Remove fingerprint
   */
  async delete(hash: string): Promise<void> {
    await this.initialize();
    
    this.cache.delete(hash);
    this.saveToStorage();
  }

  /**
   * Remove fingerprints antigos
   */
  async cleanup(olderThan: Date): Promise<number> {
    await this.initialize();
    
    let removedCount = 0;
    const toRemove: string[] = [];

    this.cache.forEach((fingerprint, hash) => {
      if (fingerprint.lastSeen < olderThan) {
        toRemove.push(hash);
      }
    });

    toRemove.forEach(hash => {
      this.cache.delete(hash);
      removedCount++;
    });

    if (removedCount > 0) {
      this.saveToStorage();
      console.log(`Limpeza de fingerprints: ${removedCount} removidos`);
    }

    return removedCount;
  }

  /**
   * Retorna todos os fingerprints
   */
  async getAll(): Promise<StoredFingerprint[]> {
    await this.initialize();
    return Array.from(this.cache.values());
  }

  /**
   * Bloqueia fingerprint
   */
  async block(hash: string, reason: string): Promise<void> {
    await this.update(hash, {
      isBlocked: true,
      suspiciousActivity: (await this.get(hash))?.suspiciousActivity || 0 + 1
    });
    
    console.warn(`Fingerprint bloqueado: ${hash} - Razão: ${reason}`);
  }

  /**
   * Desbloqueia fingerprint
   */
  async unblock(hash: string): Promise<void> {
    await this.update(hash, {
      isBlocked: false
    });
    
    console.log(`Fingerprint desbloqueado: ${hash}`);
  }

  /**
   * Incrementa contador de uso
   */
  async incrementUsage(hash: string): Promise<void> {
    const fingerprint = await this.get(hash);
    if (!fingerprint) return;

    await this.update(hash, {
      usageCount: fingerprint.usageCount + 1,
      lastSeen: new Date()
    });
  }

  /**
   * Incrementa atividade suspeita
   */
  async incrementSuspiciousActivity(hash: string): Promise<void> {
    const fingerprint = await this.get(hash);
    if (!fingerprint) return;

    const newCount = fingerprint.suspiciousActivity + 1;
    const shouldBlock = newCount >= FINGERPRINT_CONSTANTS.MAX_SUSPICIOUS_ACTIVITY;

    await this.update(hash, {
      suspiciousActivity: newCount,
      isBlocked: shouldBlock
    });

    if (shouldBlock) {
      console.warn(`Fingerprint bloqueado automaticamente por atividade suspeita: ${hash}`);
    }
  }

  /**
   * Gera analytics dos fingerprints
   */
  async getAnalytics(): Promise<FingerprintAnalytics> {
    await this.initialize();
    
    const fingerprints = Array.from(this.cache.values());
    const totalFingerprints = fingerprints.length;
    const blockedFingerprints = fingerprints.filter(fp => fp.isBlocked).length;
    const suspiciousActivity = fingerprints.reduce((sum, fp) => sum + fp.suspiciousActivity, 0);
    const averageConfidence = fingerprints.reduce((sum, fp) => sum + fp.confidence, 0) / totalFingerprints || 0;

    // Top user agents
    const userAgentCounts = new Map<string, number>();
    fingerprints.forEach(fp => {
      const ua = fp.deviceInfo.userAgent;
      userAgentCounts.set(ua, (userAgentCounts.get(ua) || 0) + 1);
    });
    const topUserAgents = Array.from(userAgentCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userAgent, count]) => ({ userAgent, count }));

    // Top resolutions
    const resolutionCounts = new Map<string, number>();
    fingerprints.forEach(fp => {
      const resolution = fp.deviceInfo.screenResolution;
      resolutionCounts.set(resolution, (resolutionCounts.get(resolution) || 0) + 1);
    });
    const topResolutions = Array.from(resolutionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([resolution, count]) => ({ resolution, count }));

    // Top time zones
    const timeZoneCounts = new Map<string, number>();
    fingerprints.forEach(fp => {
      const timeZone = fp.deviceInfo.timeZone;
      timeZoneCounts.set(timeZone, (timeZoneCounts.get(timeZone) || 0) + 1);
    });
    const topTimeZones = Array.from(timeZoneCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([timeZone, count]) => ({ timeZone, count }));

    return {
      totalFingerprints,
      uniqueFingerprints: totalFingerprints, // Todos são únicos por definição
      blockedFingerprints,
      suspiciousActivity,
      averageConfidence,
      topUserAgents,
      topResolutions,
      topTimeZones
    };
  }

  /**
   * Limpa todos os dados (para desenvolvimento/testes)
   */
  async clear(): Promise<void> {
    this.cache.clear();
    localStorage.removeItem(this.storageKey);
    this.isInitialized = false;
  }
}

// Instância singleton
export const fingerprintStorage = LocalFingerprintStorage.getInstance();