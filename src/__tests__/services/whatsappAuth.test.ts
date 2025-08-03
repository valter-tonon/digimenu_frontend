/**
 * Testes para o serviço de autenticação WhatsApp
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { whatsappAuthService } from '@/services/whatsappAuth';

// Mock do axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('WhatsAppAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('requestMagicLink', () => {
    it('deve solicitar magic link com sucesso', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Link enviado com sucesso',
          expires_at: '2025-02-08T21:00:00Z'
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await whatsappAuthService.requestMagicLink('5511999999999', 'tenant123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Link enviado com sucesso');
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost/api/v1/auth/whatsapp/request',
        {
          phone: '5511999999999',
          tenant_id: 'tenant123'
        }
      );
    });

    it('deve lidar com erro na solicitação', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Número inválido'
          }
        }
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);

      const result = await whatsappAuthService.requestMagicLink('invalid', 'tenant123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Número inválido');
    });

    it('deve tentar novamente em caso de falha', async () => {
      mockedAxios.post
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: {
            success: true,
            message: 'Sucesso na terceira tentativa'
          }
        });

      const result = await whatsappAuthService.requestMagicLink('5511999999999', 'tenant123');

      expect(result.success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    });
  });

  describe('verifyToken', () => {
    it('deve verificar token e armazenar JWT', async () => {
      const mockUser = {
        id: 1,
        uuid: 'user-uuid',
        name: 'João Silva',
        phone: '5511999999999',
        tenant_id: 'tenant123'
      };

      const mockJWT = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJkaWdpbWVudS1hcGkiLCJzdWIiOiIxIiwiYXVkIjoiZGlnaW1lbnUtZnJvbnRlbmQiLCJleHAiOjE3MDc0MzIwMDAsImlhdCI6MTcwNzM0NTYwMCwibmJmIjoxNzA3MzQ1NjAwLCJqdGkiOiJ0b2tlbi0xMjMiLCJ1c2VyIjp7ImlkIjoxLCJ1dWlkIjoidXNlci11dWlkIiwibmFtZSI6IkpvXHUwMGUzbyBTaWx2YSIsInBob25lIjoiNTUxMTk5OTk5OTk5OSIsInRlbmFudF9pZCI6InRlbmFudDEyMyJ9LCJwZXJtaXNzaW9ucyI6WyJjdXN0b21lciJdLCJhdXRoX21ldGhvZCI6IndoYXRzYXBwX21hZ2ljX2xpbmsifQ.signature';

      const mockResponse = {
        data: {
          success: true,
          jwt: mockJWT,
          user: mockUser
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await whatsappAuthService.verifyToken('test-token');

      expect(result.success).toBe(true);
      expect(result.jwt).toBe(mockJWT);
      expect(result.user).toEqual(mockUser);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'whatsapp_auth_jwt',
        expect.stringContaining(mockJWT)
      );
    });

    it('deve lidar com token inválido', async () => {
      const mockResponse = {
        data: {
          success: false,
          message: 'Token expirado'
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await whatsappAuthService.verifyToken('invalid-token');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Token expirado');
    });
  });

  describe('validateStoredJWT', () => {
    it('deve validar JWT armazenado válido', async () => {
      const mockStoredAuth = {
        jwt: 'valid-jwt',
        user: { id: 1, name: 'João' },
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hora no futuro
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStoredAuth));

      const mockResponse = {
        data: {
          valid: true
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await whatsappAuthService.validateStoredJWT();

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost/api/v1/auth/token/validate',
        {},
        {
          headers: { Authorization: 'Bearer valid-jwt' }
        }
      );
    });

    it('deve retornar false para JWT expirado', async () => {
      const mockStoredAuth = {
        jwt: 'expired-jwt',
        user: { id: 1, name: 'João' },
        expiresAt: new Date(Date.now() - 60 * 60 * 1000) // 1 hora no passado
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStoredAuth));

      const result = await whatsappAuthService.validateStoredJWT();

      expect(result).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('whatsapp_auth_jwt');
    });
  });

  describe('clearAuth', () => {
    it('deve limpar autenticação armazenada', () => {
      whatsappAuthService.clearAuth();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('whatsapp_auth_jwt');
    });
  });

  describe('isAuthenticated', () => {
    it('deve retornar true para auth válida', () => {
      const mockStoredAuth = {
        jwt: 'valid-jwt',
        user: { id: 1, name: 'João' },
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hora no futuro
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStoredAuth));

      const result = whatsappAuthService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('deve retornar false para auth expirada', () => {
      const mockStoredAuth = {
        jwt: 'expired-jwt',
        user: { id: 1, name: 'João' },
        expiresAt: new Date(Date.now() - 60 * 60 * 1000) // 1 hora no passado
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStoredAuth));

      const result = whatsappAuthService.isAuthenticated();

      expect(result).toBe(false);
    });

    it('deve retornar false quando não há auth armazenada', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = whatsappAuthService.isAuthenticated();

      expect(result).toBe(false);
    });
  });
});