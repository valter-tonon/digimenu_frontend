/**
 * Testes unitários para o serviço de rate limiting
 */

import { rateLimitingService } from '../../services/rateLimiting';

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

describe('RateLimitingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('checkRateLimit', () => {
    it('deve permitir primeira requisição', async () => {
      const result = await rateLimitingService.checkRateLimit('192.168.1.1', 'qr_code');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
      expect(result.resetTime).toBeInstanceOf(Date);
    });

    it('deve bloquear após exceder limite', async () => {
      const ip = '192.168.1.1';
      const type = 'whatsapp';

      // Simula tentativas anteriores que excedem o limite
      const attempts = Array.from({ length: 4 }, (_, i) => ({
        ip,
        type,
        success: false,
        timestamp: new Date(Date.now() - i * 1000),
        userAgent: 'test'
      }));

      localStorageMock.getItem.mockReturnValue(JSON.stringify(attempts));

      const result = await rateLimitingService.checkRateLimit(ip, type);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.reason).toContain('excedido');
    });

    it('deve respeitar janela de tempo', async () => {
      const ip = '192.168.1.1';
      const type = 'qr_code';

      // Simula tentativas antigas (fora da janela)
      const oldAttempts = Array.from({ length: 15 }, (_, i) => ({
        ip,
        type,
        success: true,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 - i * 1000), // 2h atrás
        userAgent: 'test'
      }));

      localStorageMock.getItem.mockReturnValue(JSON.stringify(oldAttempts));

      const result = await rateLimitingService.checkRateLimit(ip, type);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it('deve tratar IP bloqueado', async () => {
      const ip = '192.168.1.1';
      const blockedIPs = [{
        ip,
        reason: 'Teste',
        blockedAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h no futuro
        attempts: 10,
        type: 'general'
      }];

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'blocked_ips') {
          return JSON.stringify(blockedIPs);
        }
        return null;
      });

      const result = await rateLimitingService.checkRateLimit(ip, 'qr_code');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('bloqueado');
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('deve permitir IP desbloqueado automaticamente', async () => {
      const ip = '192.168.1.1';
      const expiredBlockedIPs = [{
        ip,
        reason: 'Teste',
        blockedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // Expirado
        attempts: 10,
        type: 'general'
      }];

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'blocked_ips') {
          return JSON.stringify(expiredBlockedIPs);
        }
        return null;
      });

      const result = await rateLimitingService.checkRateLimit(ip, 'qr_code');

      expect(result.allowed).toBe(true);
    });
  });

  describe('recordAttempt', () => {
    it('deve registrar tentativa com sucesso', async () => {
      await rateLimitingService.recordAttempt('192.168.1.1', 'qr_code', true, {
        userAgent: 'test'
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
      
      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      
      expect(storedData).toHaveLength(1);
      expect(storedData[0]).toMatchObject({
        ip: '192.168.1.1',
        type: 'qr_code',
        success: true,
        userAgent: 'test'
      });
    });

    it('deve manter apenas últimas 100 tentativas', async () => {
      // Simula 100 tentativas existentes
      const existingAttempts = Array.from({ length: 100 }, (_, i) => ({
        ip: '192.168.1.1',
        type: 'qr_code',
        success: true,
        timestamp: new Date(Date.now() - i * 1000),
        userAgent: 'test'
      }));

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingAttempts));

      await rateLimitingService.recordAttempt('192.168.1.1', 'qr_code', true);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      
      expect(storedData).toHaveLength(100); // Mantém apenas 100
    });
  });

  describe('blockIP', () => {
    it('deve bloquear IP com duração padrão', async () => {
      await rateLimitingService.blockIP('192.168.1.1', 'qr_code', 'Teste');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'blocked_ips',
        expect.stringContaining('192.168.1.1')
      );
    });

    it('deve bloquear IP com duração customizada', async () => {
      const customDuration = 2 * 60 * 60 * 1000; // 2 horas
      await rateLimitingService.blockIP('192.168.1.1', 'qr_code', 'Teste', customDuration);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const blockedIPs = JSON.parse(setItemCall[1]);
      
      expect(blockedIPs).toHaveLength(1);
      expect(blockedIPs[0].ip).toBe('192.168.1.1');
      expect(blockedIPs[0].reason).toBe('Teste');
      
      const expectedExpiry = new Date(Date.now() + customDuration);
      const actualExpiry = new Date(blockedIPs[0].expiresAt);
      expect(actualExpiry.getTime()).toBeCloseTo(expectedExpiry.getTime(), -3);
    });

    it('deve substituir bloqueio anterior do mesmo IP', async () => {
      const existingBlocks = [{
        ip: '192.168.1.1',
        reason: 'Antigo',
        blockedAt: new Date(Date.now() - 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        attempts: 5,
        type: 'general'
      }];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingBlocks));

      await rateLimitingService.blockIP('192.168.1.1', 'qr_code', 'Novo');

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const blockedIPs = JSON.parse(setItemCall[1]);
      
      expect(blockedIPs).toHaveLength(1);
      expect(blockedIPs[0].reason).toBe('Novo');
    });
  });

  describe('unblockIP', () => {
    it('deve desbloquear IP específico', async () => {
      const blockedIPs = [
        {
          ip: '192.168.1.1',
          reason: 'Teste 1',
          blockedAt: new Date(),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          attempts: 5,
          type: 'general'
        },
        {
          ip: '192.168.1.2',
          reason: 'Teste 2',
          blockedAt: new Date(),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          attempts: 3,
          type: 'general'
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(blockedIPs));

      await rateLimitingService.unblockIP('192.168.1.1');

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const remainingBlocks = JSON.parse(setItemCall[1]);
      
      expect(remainingBlocks).toHaveLength(1);
      expect(remainingBlocks[0].ip).toBe('192.168.1.2');
    });

    it('deve funcionar mesmo se IP não estiver bloqueado', async () => {
      localStorageMock.getItem.mockReturnValue('[]');

      await expect(
        rateLimitingService.unblockIP('192.168.1.1')
      ).resolves.not.toThrow();
    });
  });

  describe('getStatistics', () => {
    it('deve retornar estatísticas básicas', async () => {
      const mockAttempts = [
        {
          ip: '192.168.1.1',
          type: 'qr_code',
          success: true,
          timestamp: new Date(),
          userAgent: 'test'
        },
        {
          ip: '192.168.1.1',
          type: 'whatsapp',
          success: false,
          timestamp: new Date(),
          userAgent: 'test'
        },
        {
          ip: '192.168.1.2',
          type: 'qr_code',
          success: true,
          timestamp: new Date(),
          userAgent: 'test'
        }
      ];

      // Mock para simular tentativas armazenadas
      localStorageMock.getItem.mockImplementation((key) => {
        if (key.includes('rate_limit_attempts_')) {
          return JSON.stringify(mockAttempts);
        }
        if (key === 'blocked_ips') {
          return JSON.stringify([]);
        }
        return null;
      });

      // Mock Object.keys para simular chaves do localStorage
      const originalKeys = Object.keys;
      Object.keys = jest.fn().mockReturnValue([
        'rate_limit_attempts_192.168.1.1_qr_code',
        'rate_limit_attempts_192.168.1.1_whatsapp',
        'rate_limit_attempts_192.168.1.2_qr_code'
      ]);

      const stats = await rateLimitingService.getStatistics();

      expect(stats.totalAttempts).toBeGreaterThan(0);
      expect(stats.successfulAttempts).toBeGreaterThan(0);
      expect(stats.failedAttempts).toBeGreaterThan(0);
      expect(stats.topIPs).toBeDefined();
      expect(Array.isArray(stats.topIPs)).toBe(true);

      // Restaura Object.keys
      Object.keys = originalKeys;
    });
  });

  describe('cleanup', () => {
    it('deve limpar dados antigos', async () => {
      await rateLimitingService.cleanup();

      // Verifica se métodos de limpeza foram chamados
      // (implementação específica depende da estrutura interna)
      expect(localStorageMock.getItem).toHaveBeenCalled();
    });
  });

  describe('configurações por tipo', () => {
    it('deve usar limites corretos para QR Code', async () => {
      const result = await rateLimitingService.checkRateLimit('192.168.1.1', 'qr_code');
      
      expect(result.allowed).toBe(true);
      // QR Code permite 10 por hora
      expect(result.remaining).toBeLessThanOrEqual(10);
    });

    it('deve usar limites corretos para WhatsApp', async () => {
      const result = await rateLimitingService.checkRateLimit('192.168.1.1', 'whatsapp');
      
      expect(result.allowed).toBe(true);
      // WhatsApp permite 3 por dia
      expect(result.remaining).toBeLessThanOrEqual(3);
    });

    it('deve usar limites corretos para fingerprint', async () => {
      const result = await rateLimitingService.checkRateLimit('192.168.1.1', 'fingerprint');
      
      expect(result.allowed).toBe(true);
      // Fingerprint permite 100 por hora
      expect(result.remaining).toBeLessThanOrEqual(100);
    });
  });

  describe('tratamento de erros', () => {
    it('deve permitir requisição em caso de erro interno', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = await rateLimitingService.checkRateLimit('192.168.1.1', 'qr_code');

      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Erro interno');
    });

    it('deve tratar JSON inválido graciosamente', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const result = await rateLimitingService.checkRateLimit('192.168.1.1', 'qr_code');

      expect(result.allowed).toBe(true);
    });
  });
});