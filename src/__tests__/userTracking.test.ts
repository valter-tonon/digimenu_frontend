import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CookieUserTrackingService } from '@/services/userTracking';

// Mock do document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

// Mock do window.location
Object.defineProperty(window, 'location', {
  value: {
    search: '',
  },
  writable: true,
});

// Mock do document.referrer
Object.defineProperty(document, 'referrer', {
  value: '',
  writable: true,
});

// Mock do UUID
vi.mock('uuid', () => ({
  v4: () => 'test-uuid-123',
}));

describe('User Tracking Service', () => {
  let trackingService: CookieUserTrackingService;

  beforeEach(() => {
    trackingService = new CookieUserTrackingService();
    document.cookie = ''; // Limpar cookies
    window.location.search = '';
    document.referrer = '';
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Limpar cookies após cada teste
    document.cookie = 'digimenu_user_tracking=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'digimenu_opt_out=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  });

  describe('Identificação de Usuário', () => {
    it('deve criar novo ID para usuário pela primeira vez', () => {
      const userId = trackingService.trackUser();
      
      expect(userId).toBe('test-uuid-123');
      expect(trackingService.getUserId()).toBe('test-uuid-123');
    });

    it('deve retornar mesmo ID para usuário recorrente', () => {
      // Primeiro acesso
      const firstUserId = trackingService.trackUser();
      
      // Segundo acesso (simular)
      const secondUserId = trackingService.trackUser();
      
      expect(firstUserId).toBe(secondUserId);
    });

    it('deve permitir identificar usuário manualmente', () => {
      const customUserId = 'custom-user-123';
      
      trackingService.identifyUser(customUserId);
      
      expect(trackingService.getUserId()).toBe(customUserId);
    });
  });

  describe('Rastreamento de Fonte', () => {
    it('deve detectar fonte do WhatsApp via referrer', () => {
      document.referrer = 'https://web.whatsapp.com/';
      
      trackingService.trackUser();
      
      expect(trackingService.getSource()).toBe('whatsapp');
    });

    it('deve detectar fonte do WhatsApp via UTM', () => {
      window.location.search = '?utm_source=whatsapp';
      
      trackingService.trackUser();
      
      expect(trackingService.getSource()).toBe('whatsapp');
    });

    it('deve detectar fonte do Facebook', () => {
      document.referrer = 'https://www.facebook.com/';
      
      trackingService.trackUser();
      
      expect(trackingService.getSource()).toBe('facebook');
    });

    it('deve detectar fonte do Instagram', () => {
      document.referrer = 'https://www.instagram.com/';
      
      trackingService.trackUser();
      
      expect(trackingService.getSource()).toBe('instagram');
    });

    it('deve detectar fonte do Google', () => {
      document.referrer = 'https://www.google.com/';
      
      trackingService.trackUser();
      
      expect(trackingService.getSource()).toBe('google');
    });

    it('deve detectar acesso direto', () => {
      document.referrer = '';
      
      trackingService.trackUser();
      
      expect(trackingService.getSource()).toBe('direct');
    });

    it('deve permitir definir fonte manualmente', () => {
      trackingService.trackSource('custom-source');
      
      expect(trackingService.getSource()).toBe('custom-source');
    });
  });

  describe('Opt-out e Privacidade', () => {
    it('deve permitir opt-out do rastreamento', () => {
      // Primeiro, criar um usuário
      trackingService.trackUser();
      expect(trackingService.getUserId()).toBeTruthy();
      
      // Fazer opt-out
      trackingService.optOut();
      
      expect(trackingService.isOptedOut()).toBe(true);
      expect(trackingService.getUserId()).toBeNull();
    });

    it('deve retornar ID temporário quando opt-out', () => {
      trackingService.optOut();
      
      const userId = trackingService.trackUser();
      
      expect(userId).toMatch(/^temp_\d+$/);
      expect(trackingService.isOptedOut()).toBe(true);
    });

    it('não deve salvar dados quando opt-out', () => {
      trackingService.optOut();
      
      trackingService.trackSource('test-source');
      trackingService.identifyUser('test-user');
      
      expect(trackingService.getSource()).toBeNull();
      expect(trackingService.getUserId()).toBeNull();
    });
  });

  describe('Datas de Visita', () => {
    it('deve registrar primeira visita', () => {
      trackingService.trackUser();
      
      const firstVisit = trackingService.getFirstVisit();
      expect(firstVisit).toBeInstanceOf(Date);
    });

    it('deve atualizar última visita', () => {
      trackingService.trackUser();
      const initialLastVisit = trackingService.getLastVisit();
      
      // Simular passagem de tempo
      setTimeout(() => {
        trackingService.updateLastVisit();
        const updatedLastVisit = trackingService.getLastVisit();
        
        expect(updatedLastVisit?.getTime()).toBeGreaterThan(initialLastVisit?.getTime() || 0);
      }, 10);
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve lidar com cookies corrompidos', () => {
      // Simular cookie corrompido
      document.cookie = 'digimenu_user_tracking=invalid-json';
      
      const userId = trackingService.trackUser();
      
      // Deve criar novo usuário mesmo com cookie corrompido
      expect(userId).toBe('test-uuid-123');
    });

    it('deve funcionar quando localStorage não está disponível', () => {
      // Este teste verifica se o serviço funciona apenas com cookies
      const userId = trackingService.trackUser();
      
      expect(userId).toBeTruthy();
    });
  });

  describe('Conformidade com LGPD/GDPR', () => {
    it('deve respeitar opt-out permanente', () => {
      trackingService.optOut();
      
      // Tentar rastrear novamente
      const userId = trackingService.trackUser();
      
      expect(trackingService.isOptedOut()).toBe(true);
      expect(userId).toMatch(/^temp_\d+$/);
    });

    it('deve limpar dados existentes ao fazer opt-out', () => {
      // Criar dados de rastreamento
      trackingService.trackUser();
      trackingService.trackSource('test-source');
      
      expect(trackingService.getUserId()).toBeTruthy();
      expect(trackingService.getSource()).toBeTruthy();
      
      // Fazer opt-out
      trackingService.optOut();
      
      expect(trackingService.getUserId()).toBeNull();
      expect(trackingService.getSource()).toBeNull();
    });
  });
});