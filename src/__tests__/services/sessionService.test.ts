/**
 * Testes unitários para o serviço de sessões
 */

import { sessionService } from '../../services/sessionService';
import { SessionContext } from '../../types/session';

// Mock do localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock do sessionStorage
const sessionStorageMock = {
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getAll: jest.fn(),
  cleanup: jest.fn()
};

jest.mock('../../services/sessionStorage', () => ({
  sessionStorage: sessionStorageMock
}));

describe('SessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks
    sessionStorageMock.get.mockResolvedValue(null);
    sessionStorageMock.set.mockResolvedValue(undefined);
    sessionStorageMock.update.mockResolvedValue(undefined);
    sessionStorageMock.remove.mockResolvedValue(undefined);
    sessionStorageMock.getAll.mockResolvedValue([]);
    sessionStorageMock.cleanup.mockResolvedValue(0);
  });

  describe('createSession', () => {
    const mockContext: SessionContext = {
      storeId: 'store_123',
      fingerprint: 'fp_123',
      type: 'table',
      tableId: 'table_5',
      isDelivery: false,
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0'
    };

    it('deve criar sessão válida', async () => {
      const session = await sessionService.createSession(mockContext);

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.storeId).toBe(mockContext.storeId);
      expect(session.fingerprint).toBe(mockContext.fingerprint);
      expect(session.isAuthenticated).toBe(false);
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.lastActivity).toBeInstanceOf(Date);
    });

    it('deve definir expiração correta para mesa', async () => {
      const tableContext = { ...mockContext, type: 'table' as const };
      const session = await sessionService.createSession(tableContext);

      const expectedExpiry = new Date(session.createdAt.getTime() + 4 * 60 * 60 * 1000);
      expect(session.expiresAt.getTime()).toBeCloseTo(expectedExpiry.getTime(), -3);
    });

    it('deve definir expiração correta para delivery', async () => {
      const deliveryContext = { 
        ...mockContext, 
        type: 'delivery' as const, 
        isDelivery: true,
        tableId: undefined 
      };
      const session = await sessionService.createSession(deliveryContext);

      const expectedExpiry = new Date(session.createdAt.getTime() + 2 * 60 * 60 * 1000);
      expect(session.expiresAt.getTime()).toBeCloseTo(expectedExpiry.getTime(), -3);
    });

    it('deve salvar sessão no storage', async () => {
      const session = await sessionService.createSession(mockContext);

      expect(sessionStorageMock.set).toHaveBeenCalledWith(session.id, session);
    });

    it('deve gerar ID único para cada sessão', async () => {
      const session1 = await sessionService.createSession(mockContext);
      const session2 = await sessionService.createSession(mockContext);

      expect(session1.id).not.toBe(session2.id);
    });
  });

  describe('validateSession', () => {
    const mockSession = {
      id: 'session_123',
      storeId: 'store_123',
      fingerprint: 'fp_123',
      isAuthenticated: false,
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hora no futuro
      context: {
        type: 'table',
        tableId: 'table_5',
        isDelivery: false
      }
    };

    it('deve validar sessão ativa', async () => {
      sessionStorageMock.get.mockResolvedValue(mockSession);

      const result = await sessionService.validateSession('session_123');

      expect(result.isValid).toBe(true);
      expect(result.isActive).toBe(true);
      expect(result.session).toEqual(mockSession);
    });

    it('deve detectar sessão expirada', async () => {
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 60 * 60 * 1000) // 1 hora no passado
      };
      sessionStorageMock.get.mockResolvedValue(expiredSession);

      const result = await sessionService.validateSession('session_123');

      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(true);
      expect(result.reason).toContain('expirada');
    });

    it('deve detectar sessão inexistente', async () => {
      sessionStorageMock.get.mockResolvedValue(null);

      const result = await sessionService.validateSession('session_inexistente');

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('não encontrada');
    });
  });

  describe('updateActivity', () => {
    const mockSession = {
      id: 'session_123',
      storeId: 'store_123',
      fingerprint: 'fp_123',
      isAuthenticated: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min atrás
      lastActivity: new Date(Date.now() - 10 * 60 * 1000), // 10 min atrás
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      context: {
        type: 'table',
        tableId: 'table_5',
        isDelivery: false
      }
    };

    it('deve atualizar timestamp de atividade', async () => {
      sessionStorageMock.get.mockResolvedValue(mockSession);

      await sessionService.updateActivity('session_123');

      expect(sessionStorageMock.update).toHaveBeenCalledWith(
        'session_123',
        expect.objectContaining({
          lastActivity: expect.any(Date)
        })
      );
    });

    it('não deve atualizar sessão expirada', async () => {
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 60 * 60 * 1000)
      };
      sessionStorageMock.get.mockResolvedValue(expiredSession);

      await sessionService.updateActivity('session_123');

      expect(sessionStorageMock.update).not.toHaveBeenCalled();
    });

    it('não deve atualizar sessão inexistente', async () => {
      sessionStorageMock.get.mockResolvedValue(null);

      await sessionService.updateActivity('session_inexistente');

      expect(sessionStorageMock.update).not.toHaveBeenCalled();
    });
  });

  describe('associateCustomer', () => {
    const mockSession = {
      id: 'session_123',
      storeId: 'store_123',
      fingerprint: 'fp_123',
      isAuthenticated: false,
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      context: {
        type: 'table',
        tableId: 'table_5',
        isDelivery: false
      }
    };

    it('deve associar cliente à sessão', async () => {
      sessionStorageMock.get.mockResolvedValue(mockSession);

      await sessionService.associateCustomer('session_123', 'customer_456');

      expect(sessionStorageMock.update).toHaveBeenCalledWith(
        'session_123',
        expect.objectContaining({
          customerId: 'customer_456',
          isAuthenticated: true,
          lastActivity: expect.any(Date)
        })
      );
    });

    it('deve rejeitar associação em sessão expirada', async () => {
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 60 * 60 * 1000)
      };
      sessionStorageMock.get.mockResolvedValue(expiredSession);

      await expect(
        sessionService.associateCustomer('session_123', 'customer_456')
      ).rejects.toThrow('Sessão inválida ou expirada');
    });

    it('deve rejeitar associação em sessão inexistente', async () => {
      sessionStorageMock.get.mockResolvedValue(null);

      await expect(
        sessionService.associateCustomer('session_inexistente', 'customer_456')
      ).rejects.toThrow('Sessão inválida ou expirada');
    });
  });

  describe('expireSession', () => {
    const mockSession = {
      id: 'session_123',
      storeId: 'store_123',
      fingerprint: 'fp_123',
      isAuthenticated: false,
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      context: {
        type: 'table',
        tableId: 'table_5',
        isDelivery: false
      }
    };

    it('deve expirar sessão ativa', async () => {
      sessionStorageMock.get.mockResolvedValue(mockSession);

      await sessionService.expireSession('session_123');

      expect(sessionStorageMock.update).toHaveBeenCalledWith(
        'session_123',
        expect.objectContaining({
          expiresAt: expect.any(Date)
        })
      );
    });

    it('deve funcionar mesmo com sessão inexistente', async () => {
      sessionStorageMock.get.mockResolvedValue(null);

      await expect(
        sessionService.expireSession('session_inexistente')
      ).resolves.not.toThrow();
    });
  });

  describe('getActiveSessions', () => {
    const mockSessions = [
      {
        id: 'session_1',
        storeId: 'store_123',
        fingerprint: 'fp_1',
        isAuthenticated: false,
        createdAt: new Date(),
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        context: { type: 'table', tableId: 'table_1', isDelivery: false }
      },
      {
        id: 'session_2',
        storeId: 'store_123',
        fingerprint: 'fp_2',
        isAuthenticated: true,
        createdAt: new Date(),
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        context: { type: 'delivery', isDelivery: true }
      },
      {
        id: 'session_3',
        storeId: 'store_456', // Loja diferente
        fingerprint: 'fp_3',
        isAuthenticated: false,
        createdAt: new Date(),
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        context: { type: 'table', tableId: 'table_2', isDelivery: false }
      }
    ];

    it('deve retornar apenas sessões da loja especificada', async () => {
      sessionStorageMock.getAll.mockResolvedValue(mockSessions);

      const result = await sessionService.getActiveSessions('store_123');

      expect(result).toHaveLength(2);
      expect(result.every(s => s.storeId === 'store_123')).toBe(true);
    });

    it('deve filtrar sessões expiradas', async () => {
      const sessionsWithExpired = [
        ...mockSessions,
        {
          id: 'session_expired',
          storeId: 'store_123',
          fingerprint: 'fp_expired',
          isAuthenticated: false,
          createdAt: new Date(),
          lastActivity: new Date(),
          expiresAt: new Date(Date.now() - 60 * 60 * 1000), // Expirada
          context: { type: 'table', tableId: 'table_expired', isDelivery: false }
        }
      ];
      sessionStorageMock.getAll.mockResolvedValue(sessionsWithExpired);

      const result = await sessionService.getActiveSessions('store_123');

      expect(result).toHaveLength(2);
      expect(result.every(s => s.expiresAt > new Date())).toBe(true);
    });

    it('deve retornar array vazio para loja sem sessões', async () => {
      sessionStorageMock.getAll.mockResolvedValue(mockSessions);

      const result = await sessionService.getActiveSessions('store_inexistente');

      expect(result).toHaveLength(0);
    });
  });

  describe('cleanup', () => {
    it('deve chamar cleanup do storage', async () => {
      sessionStorageMock.cleanup.mockResolvedValue(5);

      const result = await sessionService.cleanup();

      expect(sessionStorageMock.cleanup).toHaveBeenCalled();
      expect(result).toBe(5);
    });

    it('deve tratar erros no cleanup', async () => {
      sessionStorageMock.cleanup.mockRejectedValue(new Error('Storage error'));

      const result = await sessionService.cleanup();

      expect(result).toBe(0);
    });
  });
});