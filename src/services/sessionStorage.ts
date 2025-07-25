/**
 * Sistema de armazenamento local para sessões contextuais
 * 
 * Implementa persistência local com TTL e recuperação automática
 */

import { 
  ContextualSession, 
  SessionStorage,
  SESSION_CONSTANTS 
} from '../types/session';

interface SessionStorageData {
  sessions: Record<string, ContextualSession>;
  metadata: {
    lastCleanup: string;
    totalCreated: number;
    version: string;
  };
}

export class LocalSessionStorage implements SessionStorage {
  private static instance: LocalSessionStorage;
  private readonly storageKey = 'digimenu_sessions';
  private readonly version = '1.0.0';
  private cache: Map<string, ContextualSession> = new Map();
  private fingerprintIndex: Map<string, Set<string>> = new Map(); // fingerprint -> sessionIds
  private storeIndex: Map<string, Set<string>> = new Map(); // storeId -> sessionIds
  private tableIndex: Map<string, Set<string>> = new Map(); // tableId -> sessionIds
  private isInitialized = false;

  public static getInstance(): LocalSessionStorage {
    if (!LocalSessionStorage.instance) {
      LocalSessionStorage.instance = new LocalSessionStorage();
    }
    return LocalSessionStorage.instance;
  }

  /**
   * Inicializa o storage carregando dados do localStorage
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const data = this.loadFromStorage();
      
      // Carrega sessões no cache e constrói índices
      Object.entries(data.sessions).forEach(([sessionId, session]) => {
        // Converte strings de data de volta para objetos Date
        const sessionWithDates = {
          ...session,
          createdAt: new Date(session.createdAt),
          expiresAt: new Date(session.expiresAt),
          lastActivity: new Date(session.lastActivity)
        };

        this.cache.set(sessionId, sessionWithDates);
        this.updateIndices(sessionId, sessionWithDates);
      });

      // Executa limpeza se necessário
      const lastCleanup = new Date(data.metadata.lastCleanup);
      const now = new Date();
      const hoursSinceCleanup = (now.getTime() - lastCleanup.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCleanup >= 1) {
        await this.cleanup(new Date(now.getTime() - 60 * 60 * 1000));
      }

      this.isInitialized = true;
    } catch (error) {
      console.warn('Erro ao inicializar session storage:', error);
      this.initializeEmpty();
    }
  }

  /**
   * Inicializa storage vazio
   */
  private initializeEmpty(): void {
    this.cache.clear();
    this.fingerprintIndex.clear();
    this.storeIndex.clear();
    this.tableIndex.clear();
    this.saveToStorage();
    this.isInitialized = true;
  }

  /**
   * Carrega dados do localStorage
   */
  private loadFromStorage(): SessionStorageData {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return this.getEmptyStorageData();
      }

      const data = JSON.parse(stored) as SessionStorageData;
      
      // Migração de versão se necessário
      if (data.metadata.version !== this.version) {
        return this.migrateData(data);
      }

      return data;
    } catch (error) {
      console.warn('Erro ao carregar sessões do storage:', error);
      return this.getEmptyStorageData();
    }
  }

  /**
   * Salva dados no localStorage
   */
  private saveToStorage(): void {
    try {
      const sessionsObject: Record<string, ContextualSession> = {};
      this.cache.forEach((session, sessionId) => {
        sessionsObject[sessionId] = session;
      });

      const data: SessionStorageData = {
        sessions: sessionsObject,
        metadata: {
          lastCleanup: new Date().toISOString(),
          totalCreated: this.cache.size,
          version: this.version
        }
      };

      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar sessões no storage:', error);
      
      // Se falhou por falta de espaço, tenta limpeza de emergência
      if (error instanceof DOMException && error.code === 22) {
        this.emergencyCleanup();
      }
    }
  }

  /**
   * Retorna estrutura de dados vazia
   */
  private getEmptyStorageData(): SessionStorageData {
    return {
      sessions: {},
      metadata: {
        lastCleanup: new Date().toISOString(),
        totalCreated: 0,
        version: this.version
      }
    };
  }

  /**
   * Migra dados de versões antigas
   */
  private migrateData(oldData: any): SessionStorageData {
    console.log('Migrando dados de sessão para versão', this.version);
    
    // Por enquanto, apenas recria os dados
    // Em versões futuras, implementar migração específica
    return this.getEmptyStorageData();
  }

  /**
   * Limpeza de emergência quando localStorage está cheio
   */
  private emergencyCleanup(): void {
    console.warn('Executando limpeza de emergência do session storage');
    
    // Remove 50% das sessões mais antigas
    const sessions = Array.from(this.cache.values());
    sessions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    const toRemove = sessions.slice(0, Math.floor(sessions.length / 2));
    toRemove.forEach(session => {
      this.cache.delete(session.id);
      this.removeFromIndices(session.id, session);
    });
    
    this.saveToStorage();
  }

  /**
   * Atualiza índices para busca rápida
   */
  private updateIndices(sessionId: string, session: ContextualSession): void {
    // Índice por fingerprint
    if (!this.fingerprintIndex.has(session.fingerprint)) {
      this.fingerprintIndex.set(session.fingerprint, new Set());
    }
    this.fingerprintIndex.get(session.fingerprint)!.add(sessionId);

    // Índice por loja
    if (!this.storeIndex.has(session.storeId)) {
      this.storeIndex.set(session.storeId, new Set());
    }
    this.storeIndex.get(session.storeId)!.add(sessionId);

    // Índice por mesa (se aplicável)
    if (session.tableId) {
      if (!this.tableIndex.has(session.tableId)) {
        this.tableIndex.set(session.tableId, new Set());
      }
      this.tableIndex.get(session.tableId)!.add(sessionId);
    }
  }

  /**
   * Remove dos índices
   */
  private removeFromIndices(sessionId: string, session: ContextualSession): void {
    // Remove do índice de fingerprint
    const fingerprintSessions = this.fingerprintIndex.get(session.fingerprint);
    if (fingerprintSessions) {
      fingerprintSessions.delete(sessionId);
      if (fingerprintSessions.size === 0) {
        this.fingerprintIndex.delete(session.fingerprint);
      }
    }

    // Remove do índice de loja
    const storeSessions = this.storeIndex.get(session.storeId);
    if (storeSessions) {
      storeSessions.delete(sessionId);
      if (storeSessions.size === 0) {
        this.storeIndex.delete(session.storeId);
      }
    }

    // Remove do índice de mesa
    if (session.tableId) {
      const tableSessions = this.tableIndex.get(session.tableId);
      if (tableSessions) {
        tableSessions.delete(sessionId);
        if (tableSessions.size === 0) {
          this.tableIndex.delete(session.tableId);
        }
      }
    }
  }

  /**
   * Recupera sessão por ID
   */
  async get(sessionId: string): Promise<ContextualSession | null> {
    await this.initialize();
    
    const session = this.cache.get(sessionId);
    if (!session) return null;

    // Verifica se não expirou
    if (session.expiresAt < new Date()) {
      await this.delete(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Armazena nova sessão
   */
  async set(session: ContextualSession): Promise<void> {
    await this.initialize();
    
    this.cache.set(session.id, session);
    this.updateIndices(session.id, session);
    this.saveToStorage();
  }

  /**
   * Atualiza sessão existente
   */
  async update(sessionId: string, updates: Partial<ContextualSession>): Promise<void> {
    await this.initialize();
    
    const existing = this.cache.get(sessionId);
    if (!existing) return;

    const updated = { ...existing, ...updates };
    this.cache.set(sessionId, updated);
    
    // Atualiza índices se necessário
    if (updates.fingerprint || updates.storeId || updates.tableId) {
      this.removeFromIndices(sessionId, existing);
      this.updateIndices(sessionId, updated);
    }
    
    this.saveToStorage();
  }

  /**
   * Remove sessão
   */
  async delete(sessionId: string): Promise<void> {
    await this.initialize();
    
    const session = this.cache.get(sessionId);
    if (session) {
      this.removeFromIndices(sessionId, session);
    }
    
    this.cache.delete(sessionId);
    this.saveToStorage();
  }

  /**
   * Busca sessão por fingerprint e loja
   */
  async getByFingerprint(fingerprint: string, storeId: string): Promise<ContextualSession | null> {
    await this.initialize();
    
    const sessionIds = this.fingerprintIndex.get(fingerprint);
    if (!sessionIds) return null;

    // Procura sessão ativa na loja especificada
    for (const sessionId of sessionIds) {
      const session = this.cache.get(sessionId);
      if (session && session.storeId === storeId && session.expiresAt > new Date()) {
        return session;
      }
    }

    return null;
  }

  /**
   * Retorna sessões ativas de uma loja
   */
  async getActiveSessionsByStore(storeId: string): Promise<ContextualSession[]> {
    await this.initialize();
    
    if (storeId === 'all') {
      // Retorna todas as sessões ativas
      const allSessions = Array.from(this.cache.values());
      return allSessions.filter(session => session.expiresAt > new Date());
    }

    const sessionIds = this.storeIndex.get(storeId);
    if (!sessionIds) return [];

    const sessions: ContextualSession[] = [];
    const now = new Date();

    for (const sessionId of sessionIds) {
      const session = this.cache.get(sessionId);
      if (session && session.expiresAt > now) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Retorna sessões ativas de uma mesa
   */
  async getActiveSessionsByTable(tableId: string): Promise<ContextualSession[]> {
    await this.initialize();
    
    const sessionIds = this.tableIndex.get(tableId);
    if (!sessionIds) return [];

    const sessions: ContextualSession[] = [];
    const now = new Date();

    for (const sessionId of sessionIds) {
      const session = this.cache.get(sessionId);
      if (session && session.expiresAt > now) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Remove sessões antigas
   */
  async cleanup(olderThan: Date): Promise<number> {
    await this.initialize();
    
    let removedCount = 0;
    const toRemove: string[] = [];

    this.cache.forEach((session, sessionId) => {
      if (session.expiresAt < olderThan) {
        toRemove.push(sessionId);
      }
    });

    for (const sessionId of toRemove) {
      const session = this.cache.get(sessionId);
      if (session) {
        this.removeFromIndices(sessionId, session);
        this.cache.delete(sessionId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.saveToStorage();
      console.log(`Limpeza de sessões: ${removedCount} removidas`);
    }

    return removedCount;
  }

  /**
   * Limpa todas as sessões
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.fingerprintIndex.clear();
    this.storeIndex.clear();
    this.tableIndex.clear();
    localStorage.removeItem(this.storageKey);
    this.isInitialized = false;
  }

  /**
   * Retorna estatísticas do storage
   */
  async getStorageStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    storageSize: number;
    indexSizes: {
      fingerprint: number;
      store: number;
      table: number;
    };
  }> {
    await this.initialize();
    
    const now = new Date();
    let activeSessions = 0;
    let expiredSessions = 0;

    this.cache.forEach(session => {
      if (session.expiresAt > now) {
        activeSessions++;
      } else {
        expiredSessions++;
      }
    });

    // Calcula tamanho aproximado do storage
    const storageData = localStorage.getItem(this.storageKey);
    const storageSize = storageData ? new Blob([storageData]).size : 0;

    return {
      totalSessions: this.cache.size,
      activeSessions,
      expiredSessions,
      storageSize,
      indexSizes: {
        fingerprint: this.fingerprintIndex.size,
        store: this.storeIndex.size,
        table: this.tableIndex.size
      }
    };
  }

  /**
   * Exporta dados para backup
   */
  async exportData(): Promise<SessionStorageData> {
    await this.initialize();
    
    const sessionsObject: Record<string, ContextualSession> = {};
    this.cache.forEach((session, sessionId) => {
      sessionsObject[sessionId] = session;
    });

    return {
      sessions: sessionsObject,
      metadata: {
        lastCleanup: new Date().toISOString(),
        totalCreated: this.cache.size,
        version: this.version
      }
    };
  }

  /**
   * Importa dados de backup
   */
  async importData(data: SessionStorageData): Promise<void> {
    this.cache.clear();
    this.fingerprintIndex.clear();
    this.storeIndex.clear();
    this.tableIndex.clear();

    Object.entries(data.sessions).forEach(([sessionId, session]) => {
      const sessionWithDates = {
        ...session,
        createdAt: new Date(session.createdAt),
        expiresAt: new Date(session.expiresAt),
        lastActivity: new Date(session.lastActivity)
      };

      this.cache.set(sessionId, sessionWithDates);
      this.updateIndices(sessionId, sessionWithDates);
    });

    this.saveToStorage();
    this.isInitialized = true;
  }
}

// Instância singleton
export const sessionStorage = LocalSessionStorage.getInstance();