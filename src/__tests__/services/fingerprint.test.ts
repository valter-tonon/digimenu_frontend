/**
 * Testes unitários para o serviço de fingerprint
 */

import { fingerprintService } from '../../services/fingerprint';

// Mock do crypto para testes
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: jest.fn().mockResolvedValue(new ArrayBuffer(32))
    }
  }
});

// Mock do canvas
const mockCanvas = {
  getContext: jest.fn().mockReturnValue({
    fillStyle: '',
    fillRect: jest.fn(),
    fillText: jest.fn(),
    getImageData: jest.fn().mockReturnValue({
      data: new Uint8ClampedArray([1, 2, 3, 4])
    })
  }),
  toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mock')
};

Object.defineProperty(document, 'createElement', {
  value: jest.fn().mockImplementation((tagName) => {
    if (tagName === 'canvas') {
      return mockCanvas;
    }
    return {};
  })
});

describe('FingerprintService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock navigator
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      configurable: true
    });
    
    Object.defineProperty(navigator, 'language', {
      value: 'pt-BR',
      configurable: true
    });
    
    Object.defineProperty(navigator, 'languages', {
      value: ['pt-BR', 'en-US'],
      configurable: true
    });

    // Mock screen
    Object.defineProperty(screen, 'width', { value: 1920, configurable: true });
    Object.defineProperty(screen, 'height', { value: 1080, configurable: true });
    Object.defineProperty(screen, 'colorDepth', { value: 24, configurable: true });

    // Mock timezone
    jest.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      timeZone: 'America/Sao_Paulo'
    } as any);
  });

  describe('generateFingerprint', () => {
    it('deve gerar fingerprint consistente para o mesmo ambiente', async () => {
      const result1 = await fingerprintService.generateFingerprint();
      const result2 = await fingerprintService.generateFingerprint();

      expect(result1.hash).toBe(result2.hash);
      expect(result1.components).toEqual(result2.components);
    });

    it('deve incluir todos os componentes esperados', async () => {
      const result = await fingerprintService.generateFingerprint();

      expect(result.components).toHaveProperty('userAgent');
      expect(result.components).toHaveProperty('screen');
      expect(result.components).toHaveProperty('timezone');
      expect(result.components).toHaveProperty('language');
      expect(result.components).toHaveProperty('canvas');
      expect(result.components).toHaveProperty('webgl');
    });

    it('deve ter hash válido', async () => {
      const result = await fingerprintService.generateFingerprint();

      expect(result.hash).toBeDefined();
      expect(typeof result.hash).toBe('string');
      expect(result.hash.length).toBeGreaterThan(0);
    });

    it('deve incluir timestamp', async () => {
      const result = await fingerprintService.generateFingerprint();

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('deve calcular confidence score', async () => {
      const result = await fingerprintService.generateFingerprint();

      expect(result.confidence).toBeDefined();
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('validateFingerprint', () => {
    it('deve validar fingerprint válido', async () => {
      const fingerprint = await fingerprintService.generateFingerprint();
      const result = await fingerprintService.validateFingerprint(fingerprint.hash);

      expect(result.isValid).toBe(true);
      expect(result.fingerprint).toBeDefined();
    });

    it('deve rejeitar fingerprint inválido', async () => {
      const result = await fingerprintService.validateFingerprint('invalid_hash');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('deve detectar fingerprint expirado', async () => {
      // Mock fingerprint antigo
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 horas atrás
      jest.spyOn(fingerprintService as any, 'getStoredFingerprint').mockResolvedValue({
        hash: 'old_hash',
        timestamp: oldDate,
        components: {},
        confidence: 0.8
      });

      const result = await fingerprintService.validateFingerprint('old_hash');

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('expirado');
    });
  });

  describe('compareFingerprints', () => {
    it('deve detectar fingerprints idênticos', async () => {
      const fp1 = await fingerprintService.generateFingerprint();
      const fp2 = await fingerprintService.generateFingerprint();

      const result = await fingerprintService.compareFingerprints(fp1.hash, fp2.hash);

      expect(result.similarity).toBe(1);
      expect(result.isSimilar).toBe(true);
    });

    it('deve detectar mudanças suspeitas', async () => {
      const fp1 = await fingerprintService.generateFingerprint();
      
      // Simula mudança drástica
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Different Browser',
        configurable: true
      });
      
      const fp2 = await fingerprintService.generateFingerprint();
      const result = await fingerprintService.compareFingerprints(fp1.hash, fp2.hash);

      expect(result.similarity).toBeLessThan(0.8);
      expect(result.isSimilar).toBe(false);
    });
  });

  describe('fallback behavior', () => {
    it('deve funcionar quando canvas não está disponível', async () => {
      // Mock canvas indisponível
      jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'canvas') {
          throw new Error('Canvas not supported');
        }
        return {};
      });

      const result = await fingerprintService.generateFingerprint();

      expect(result.hash).toBeDefined();
      expect(result.components.canvas).toBe('unavailable');
    });

    it('deve funcionar quando WebGL não está disponível', async () => {
      // Mock WebGL indisponível
      mockCanvas.getContext = jest.fn().mockReturnValue(null);

      const result = await fingerprintService.generateFingerprint();

      expect(result.hash).toBeDefined();
      expect(result.components.webgl).toBe('unavailable');
    });

    it('deve funcionar quando crypto.subtle não está disponível', async () => {
      // Mock crypto indisponível
      Object.defineProperty(global, 'crypto', {
        value: undefined
      });

      const result = await fingerprintService.generateFingerprint();

      expect(result.hash).toBeDefined();
      // Deve usar fallback hash
    });
  });

  describe('performance', () => {
    it('deve gerar fingerprint em tempo aceitável', async () => {
      const startTime = Date.now();
      await fingerprintService.generateFingerprint();
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(1000); // Menos de 1 segundo
    });

    it('deve cachear resultados para melhor performance', async () => {
      const startTime1 = Date.now();
      await fingerprintService.generateFingerprint();
      const endTime1 = Date.now();

      const startTime2 = Date.now();
      await fingerprintService.generateFingerprint();
      const endTime2 = Date.now();

      const time1 = endTime1 - startTime1;
      const time2 = endTime2 - startTime2;

      // Segunda chamada deve ser mais rápida (cache)
      expect(time2).toBeLessThanOrEqual(time1);
    });
  });
});