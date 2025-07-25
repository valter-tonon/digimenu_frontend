/**
 * Testes para o serviço de sessões contextuais
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sessionService } from '../services/sessionService';
import { sessionStorage } from '../services/sessionStorage';
import { SessionContext } from '../types/session';

// Mock do fingerprintDetectionService
vi.mock('../services/fingerprintDetection', () => ({
  fingerprintDetectionService: {
    validateFingerprint: vi.fn().mockResolvedValue({
      isValid: true,
      isSuspicious: false,
      isBlocked: false
    })
  }
}));

describe('SessionService', () => {
  const mockContext: SessionContext = {
    storeId: 'store-123',
    tableId: 'table-456',
    isDelivery: false,
    fingerprint: 'test-fingerprint-hash',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 Test Browser'
  };

  beforeEach(async () => {
    await sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await sessionStorage.clear();
  });

  describe('createSession', () => {
    it('deve criar nova sessão com dados corretos', async () => {
      const session = await sessionService.createSession(mockContext);

      expect(session).toMatchObject({
        storeId: mockContext.storeId,
        tableId: mockContext.tableId,
        isDelivery: mockContext.isDelivery,
        fingerprint: mockContext.fingerprint,
        ipAddress: mockContext.ipAddress,
        userAgent: mockContext.userAgent,
        orderCount: 0,
        totalSpent: 0,
        isAuthenticated: false
      });

      expect(session.id).toBeDefined();
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.expiresAt).toBeInstanceOf(Date);
      expect(session.lastActivity).toBeInstanceOf(Date);
    });

    it('deve criar sessão de delivery com duração correta', async () => {
      const deliveryContext = { ...mockContext, isDelivery: true };
      const session = await sessionService.createSession(deliveryContext);

      const durationMs = session.expiresAt.getTime() - session.createdAt.getTime();
      const durationMinutes = durationMs / (1000 * 60);

      expect(durationMinutes).toBe(120); // 2 horas para delivery
      expect(session.isDelivery).toBe(true);
    });

    it('deve criar sessão de mesa com duração correta', async () => {
      const session = await sessionService.createSession(mockContext);

      const durationMs = session.expiresAt.getTime() - session.createdAt.getTime();
      const durationMinutes = durationMs / (1000 * 60);

      expect(durationMinutes).toBe(240); // 4 horas para mesa
      expect(session.isDelivery).toBe(false);
    });

    it('deve criar sessão autenticada quando customerId é fornecido', async () => {
      const authenticatedContext = { 
        ...mockContext, 
        customerId: 'customer-789' 
      };
      
      const session = await sessionService.createSession(authenticatedContext);

      expect(session.isAuthenticated).toBe(true);
      expect(session.customerId).toBe('customer-789');
    });

    it('deve reutilizar sessão existente válida', async () => {
      // Cria primeira sessão
      const session1 = await sessionService.createSession(mockContext);
      
      // Tenta criar segunda sessão com mesmo contexto
      const session2 = await sessionService.createSession(mockContext);

      expect(session1.id).toBe(session2.id);
    });
  });

  describe('validateSession', () => {
    it('deve validar sessão ativa corretamente', async () => {
      const session = await sessionService.createSession(mockContext);
      const validation = await sessionService.validateSession(session.id);

      expect(validation.isValid).toBe(true);
      expect(validation.isExpired).toBe(false);
      expect(validation.isActive).toBe(true);
      expect(validation.session).toBeDefined();
    });

    it('deve detectar sessão inexistente', async () => {
      const validation = await sessionService.validateSession('invalid-session-id');

      expect(validation.isValid).toBe(false);
      expect(validation.reason).toBe('Sessão não encontrada');
    });

    it('deve detectar sessão expirada', async () => {
      const session = await sessionService.createSession(mockContext);
      
      // Força expiração
      await sessionStorage.update(session.id, {
        expiresAt: new Date(Date.now() - 1000) // 1 segundo atrás
      });

      const validation = await sessionService.validateSession(session.id);

      expect(validation.isValid).toBe(false);
      expect(validation.isExpired).toBe(true);
      expect(validation.reason).toBe('Sessão expirada');
    });
  });

  describe('updateActivity', () => {
    it('deve atualizar timestamp de atividade', async () => {
      const session = await sessionService.createSession(mockContext);
      const originalActivity = session.lastActivity;

      // Aguarda um pouco para garantir timestamp diferente
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await sessionService.updateActivity(session.id);
      
      const updatedSession = await sessionStorage.get(session.id);
      expect(updatedSession?.lastActivity.getTime()).toBeGreaterThan(
        originalActivity.getTime()
      );
    });

    it('não deve atualizar sessão expirada', async () => {
      const session = await sessionService.createSession(mockContext);
      
      // Força expiração
      await sessionStorage.update(session.id, {
        expiresAt: new Date(Date.now() - 1000)
      });

      await sessionService.updateActivity(session.id);
      
      // Sessão deve ter sido removida
      const updatedSession = await sessionStorage.get(session.id);
      expect(updatedSession).toBeNull();
    });
  });

  describe('associateCustomer', () => {
    it('deve associar cliente à sessão', async () => {
      const session = await sessionService.createSession(mockContext);
      const customerId = 'customer-123';

      await sessionService.associateCustomer(session.id, customerId);

      const updatedSession = await sessionStorage.get(session.id);
      expect(updatedSession?.customerId).toBe(customerId);
      expect(updatedSession?.isAuthenticated).toBe(true);
    });

    it('deve falhar ao associar cliente a sessão inexistente', async () => {
      await expect(
        sessionService.associateCustomer('invalid-session', 'customer-123')
      ).rejects.toThrow('Sessão inválida ou expirada');
    });

    it('deve falhar ao associar cliente a sessão expirada', async () => {
      const session = await sessionService.createSession(mockContext);
      
      // Força expiração
      await sessionStorage.update(session.id, {
        expiresAt: new Date(Date.now() - 1000)
      });

      await expect(
        sessionService.associateCustomer(session.id, 'customer-123')
      ).rejects.toThrow('Sessão inválida ou expirada');
    });
  });

  describe('expireSession', () => {
    it('deve expirar sessão manualmente', async () => {
      const session = await sessionService.createSession(mockContext);
      
      await sessionService.expireSession(session.id);
      
      const expiredSession = await sessionStorage.get(session.id);
      expect(expiredSession).toBeNull();
    });
  });

  describe('getActiveSessions', () => {
    it('deve retornar sessões ativas da loja', async () => {
      const session1 = await sessionService.createSession(mockContext);
      const session2 = await sessionService.createSession({
        ...mockContext,
        fingerprint: 'different-fingerprint'
      });

      const activeSessions = await sessionService.getActiveSessions(mockContext.storeId);

      expect(activeSessions).toHaveLength(2);
      expect(activeSessions.map(s => s.id)).toContain(session1.id);
      expect(activeSessions.map(s => s.id)).toContain(session2.id);
    });

    it('não deve retornar sessões expiradas', async () => {
      const session = await sessionService.createSession(mockContext);
      
      // Força expiração
      await sessionStorage.update(session.id, {
        expiresAt: new Date(Date.now() - 1000)
      });

      const activeSessions = await sessionService.getActiveSessions(mockContext.storeId);
      expect(activeSessions).toHaveLength(0);
    });
  });

  describe('extendSession', () => {
    it('deve estender duração da sessão', async () => {
      const session = await sessionService.createSession(mockContext);
      const originalExpiry = session.expiresAt;

      await sessionService.extendSession(session.id, 60); // 1 hora

      const extendedSession = await sessionStorage.get(session.id);
      expect(extendedSession?.expiresAt.getTime()).toBeGreaterThan(
        originalExpiry.getTime()
      );
    });

    it('deve respeitar limite máximo de duração', async () => {
      const session = await sessionService.createSession(mockContext);

      // Tenta estender por tempo excessivo
      await sessionService.extendSession(session.id, 1000); // 1000 minutos

      const extendedSession = await sessionStorage.get(session.id);
      const maxDuration = 480 * 60 * 1000; // 8 horas em ms
      const actualDuration = extendedSession!.expiresAt.getTime() - 
                           extendedSession!.createdAt.getTime();

      expect(actualDuration).toBeLessThanOrEqual(maxDuration);
    });
  });

  describe('incrementOrderCount', () => {
    it('deve incrementar contador de pedidos', async () => {
      const session = await sessionService.createSession(mockContext);

      await sessionService.incrementOrderCount(session.id, 25.50);

      const updatedSession = await sessionStorage.get(session.id);
      expect(updatedSession?.orderCount).toBe(1);
      expect(updatedSession?.totalSpent).toBe(25.50);
    });

    it('deve acumular múltiplos pedidos', async () => {
      const session = await sessionService.createSession(mockContext);

      await sessionService.incrementOrderCount(session.id, 15.00);
      await sessionService.incrementOrderCount(session.id, 10.50);

      const updatedSession = await sessionStorage.get(session.id);
      expect(updatedSession?.orderCount).toBe(2);
      expect(updatedSession?.totalSpent).toBe(25.50);
    });
  });

  describe('cleanExpiredSessions', () => {
    it('deve limpar sessões expiradas', async () => {
      // Cria sessão válida
      const validSession = await sessionService.createSession(mockContext);
      
      // Cria sessão expirada
      const expiredSession = await sessionService.createSession({
        ...mockContext,
        fingerprint: 'expired-fingerprint'
      });
      
      await sessionStorage.update(expiredSession.id, {
        expiresAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 horas atrás
      });

      const cleanedCount = await sessionService.cleanExpiredSessions();

      expect(cleanedCount).toBe(1);
      
      // Verifica se apenas a sessão válida permanece
      const remainingSessions = await sessionService.getActiveSessions(mockContext.storeId);
      expect(remainingSessions).toHaveLength(1);
      expect(remainingSessions[0].id).toBe(validSession.id);
    });
  });

  describe('getSessionStats', () => {
    it('deve retornar estatísticas corretas', async () => {
      // Cria sessões de teste
      const session1 = await sessionService.createSession(mockContext);
      await sessionService.associateCustomer(session1.id, 'customer-1');
      
      const session2 = await sessionService.createSession({
        ...mockContext,
        fingerprint: 'fingerprint-2'
      });

      const stats = await sessionService.getSessionStats(mockContext.storeId);

      expect(stats.total).toBe(2);
      expect(stats.active).toBe(2);
      expect(stats.expired).toBe(0);
      expect(stats.authenticated).toBe(1);
      expect(stats.guest).toBe(1);
      expect(stats.averageDuration).toBeGreaterThan(0);
    });
  });
});

describe('SessionStorage', () => {
  beforeEach(async () => {
    await sessionStorage.clear();
  });

  afterEach(async () => {
    await sessionStorage.clear();
  });

  describe('índices de busca', () => {
    it('deve indexar por fingerprint corretamente', async () => {
      const session = await sessionService.createSession(mockContext);
      
      const foundSession = await sessionStorage.getByFingerprint(
        mockContext.fingerprint,
        mockContext.storeId
      );

      expect(foundSession?.id).toBe(session.id);
    });

    it('deve indexar por loja corretamente', async () => {
      await sessionService.createSession(mockContext);
      
      const storeSessions = await sessionStorage.getActiveSessionsByStore(
        mockContext.storeId
      );

      expect(storeSessions).toHaveLength(1);
    });

    it('deve indexar por mesa corretamente', async () => {
      await sessionService.createSession(mockContext);
      
      const tableSessions = await sessionStorage.getActiveSessionsByTable(
        mockContext.tableId!
      );

      expect(tableSessions).toHaveLength(1);
    });
  });

  describe('performance', () => {
    it('deve lidar com múltiplas sessões eficientemente', async () => {
      const start = Date.now();
      
      // Cria 100 sessões
      const promises = Array.from({ length: 100 }, (_, i) => 
        sessionService.createSession({
          ...mockContext,
          fingerprint: `fingerprint-${i}`
        })
      );
      
      await Promise.all(promises);
      
      const end = Date.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(5000); // Menos de 5 segundos
      
      // Verifica se todas foram criadas
      const allSessions = await sessionStorage.getActiveSessionsByStore(mockContext.storeId);
      expect(allSessions).toHaveLength(100);
    });
  });
});