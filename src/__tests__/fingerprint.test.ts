/**
 * Testes para o serviço de fingerprint
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { BrowserFingerprintService, fingerprintService } from '../services/fingerprint';
import { fingerprintStorage } from '../services/fingerprintStorage';

// Mocks para APIs do navegador
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  language: 'pt-BR',
  hardwareConcurrency: 8,
  deviceMemory: 8
};

const mockScreen = {
  width: 1920,
  height: 1080,
  colorDepth: 24
};

const mockWindow = {
  devicePixelRatio: 1
};

const mockIntl = {
  DateTimeFormat: () => ({
    resolvedOptions: () => ({ timeZone: 'America/Sao_Paulo' })
  })
};

const mockCrypto = {
  subtle: {
    digest: vi.fn().mockResolvedValue(new ArrayBuffer(32))
  }
};

const mockCanvas = {
  getContext: vi.fn(),
  width: 0,
  height: 0,
  toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mock')
};

const mockCanvasContext = {
  textBaseline: '',
  font: '',
  fillStyle: '',
  globalCompositeOperation: '',
  fillRect: vi.fn(),
  fillText: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  closePath: vi.fn(),
  fill: vi.fn()
};

const mockWebGLContext = {
  getParameter: vi.fn(),
  getExtension: vi.fn().mockReturnValue({
    UNMASKED_VENDOR_WEBGL: 'vendor',
    UNMASKED_RENDERER_WEBGL: 'renderer'
  })
};

// Setup global mocks
beforeEach(() => {
  // @ts-ignore
  global.navigator = mockNavigator;
  // @ts-ignore
  global.screen = mockScreen;
  // @ts-ignore
  global.window = mockWindow;
  // @ts-ignore
  global.Intl = mockIntl;
  // @ts-ignore
  global.crypto = mockCrypto;

  // Mock document.createElement
  global.document = {
    createElement: vi.fn().mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        mockCanvas.getContext.mockImplementation((type: string) => {
          if (type === '2d') return mockCanvasContext;
          if (type === 'webgl' || type === 'experimental-webgl') return mockWebGLContext;
          return null;
        });
        return mockCanvas;
      }
      return {};
    })
  } as any;

  // Mock WebGL parameters
  mockWebGLContext.getParameter.mockImplementation((param: any) => {
    switch (param) {
      case 'VERSION': return 'WebGL 1.0';
      case 'SHADING_LANGUAGE_VERSION': return 'WebGL GLSL ES 1.0';
      case 'MAX_TEXTURE_SIZE': return 4096;
      case 'MAX_VIEWPORT_DIMS': return [4096, 4096];
      case 'MAX_VERTEX_ATTRIBS': return 16;
      case 'vendor': return 'Mock Vendor';
      case 'renderer': return 'Mock Renderer';
      default: return 'unknown';
    }
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('BrowserFingerprintService', () => {
  let service: BrowserFingerprintService;

  beforeEach(() => {
    service = BrowserFingerprintService.getInstance();
  });

  describe('generateFingerprint', () => {
    it('deve gerar fingerprint com hash válido', async () => {
      const result = await service.generateFingerprint();

      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('deviceInfo');
      expect(result).toHaveProperty('confidence');
      expect(typeof result.hash).toBe('string');
      expect(result.hash.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('deve gerar fingerprints consistentes para o mesmo dispositivo', async () => {
      const result1 = await service.generateFingerprint();
      const result2 = await service.generateFingerprint();

      expect(result1.hash).toBe(result2.hash);
    });

    it('deve incluir informações do dispositivo', async () => {
      const result = await service.generateFingerprint();

      expect(result.deviceInfo).toHaveProperty('userAgent');
      expect(result.deviceInfo).toHaveProperty('screenResolution');
      expect(result.deviceInfo).toHaveProperty('timeZone');
      expect(result.deviceInfo).toHaveProperty('language');
      expect(result.deviceInfo).toHaveProperty('canvasHash');
      expect(result.deviceInfo).toHaveProperty('webglHash');
      
      expect(result.deviceInfo.userAgent).toBe(mockNavigator.userAgent);
      expect(result.deviceInfo.screenResolution).toBe('1920x1080');
      expect(result.deviceInfo.timeZone).toBe('America/Sao_Paulo');
      expect(result.deviceInfo.language).toBe('pt-BR');
    });

    it('deve usar fallback quando canvas não está disponível', async () => {
      mockCanvas.getContext.mockReturnValue(null);

      const result = await service.generateFingerprint();

      expect(result.deviceInfo.canvasHash).toBe('canvas-not-supported');
      expect(result.confidence).toBeLessThan(1);
    });

    it('deve usar fallback quando WebGL não está disponível', async () => {
      mockCanvas.getContext.mockImplementation((type: string) => {
        if (type === '2d') return mockCanvasContext;
        return null; // WebGL não disponível
      });

      const result = await service.generateFingerprint();

      expect(result.deviceInfo.webglHash).toBe('webgl-not-supported');
    });

    it('deve gerar fallback quando há erro', async () => {
      // Simula erro no navigator
      // @ts-ignore
      global.navigator = undefined;

      const result = await service.generateFingerprint();

      expect(result.confidence).toBe(0.3); // Confiança de fallback
      expect(result.hash).toBeDefined();
    });
  });

  describe('getDeviceInfo', () => {
    it('deve coletar informações completas do dispositivo', async () => {
      const deviceInfo = await service.getDeviceInfo();

      expect(deviceInfo.userAgent).toBe(mockNavigator.userAgent);
      expect(deviceInfo.screenResolution).toBe('1920x1080');
      expect(deviceInfo.timeZone).toBe('America/Sao_Paulo');
      expect(deviceInfo.language).toBe('pt-BR');
      expect(deviceInfo.colorDepth).toBe(24);
      expect(deviceInfo.pixelRatio).toBe(1);
      expect(deviceInfo.hardwareConcurrency).toBe(8);
      expect(deviceInfo.deviceMemory).toBe(8);
    });
  });

  describe('validateFingerprint', () => {
    it('deve validar fingerprints válidos', () => {
      const validFingerprints = [
        'abc123def456',
        '1234567890abcdef',
        'a1b2c3d4e5f6'
      ];

      validFingerprints.forEach(fp => {
        expect(service.validateFingerprint(fp)).toBe(true);
      });
    });

    it('deve rejeitar fingerprints inválidos', () => {
      const invalidFingerprints = [
        '',
        null,
        undefined,
        'abc',
        'xyz!@#',
        123,
        {}
      ];

      invalidFingerprints.forEach(fp => {
        expect(service.validateFingerprint(fp as any)).toBe(false);
      });
    });
  });

  describe('detectSuspiciousChanges', () => {
    it('deve detectar mudanças suspeitas', () => {
      const oldFp = 'abc123def456';
      const newFp = 'xyz789uvw012';

      const isSuspicious = service.detectSuspiciousChanges(oldFp, newFp);
      expect(isSuspicious).toBe(true);
    });

    it('não deve detectar mudanças quando fingerprints são iguais', () => {
      const fingerprint = 'abc123def456';

      const isSuspicious = service.detectSuspiciousChanges(fingerprint, fingerprint);
      expect(isSuspicious).toBe(false);
    });

    it('deve detectar fingerprints inválidos como suspeitos', () => {
      const validFp = 'abc123def456';
      const invalidFp = 'invalid!';

      expect(service.detectSuspiciousChanges(validFp, invalidFp)).toBe(true);
      expect(service.detectSuspiciousChanges(invalidFp, validFp)).toBe(true);
    });
  });

  describe('calculateSimilarity', () => {
    it('deve retornar 1 para fingerprints iguais', () => {
      const fp = 'abc123def456';
      expect(service.calculateSimilarity(fp, fp)).toBe(1);
    });

    it('deve retornar 0 para fingerprints vazios', () => {
      expect(service.calculateSimilarity('', '')).toBe(1);
      expect(service.calculateSimilarity('abc', '')).toBe(0);
      expect(service.calculateSimilarity('', 'abc')).toBe(0);
    });

    it('deve calcular similaridade parcial', () => {
      const fp1 = 'abc123';
      const fp2 = 'abc456';
      
      const similarity = service.calculateSimilarity(fp1, fp2);
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });
  });
});

describe('Integração com Storage', () => {
  beforeEach(async () => {
    await fingerprintStorage.clear();
  });

  afterEach(async () => {
    await fingerprintStorage.clear();
  });

  it('deve armazenar e recuperar fingerprint', async () => {
    const result = await fingerprintService.generateFingerprint();
    
    const storedFingerprint = {
      hash: result.hash,
      deviceInfo: result.deviceInfo,
      confidence: result.confidence,
      createdAt: new Date(),
      lastSeen: new Date(),
      usageCount: 1,
      isBlocked: false,
      suspiciousActivity: 0
    };

    await fingerprintStorage.set(storedFingerprint);
    const retrieved = await fingerprintStorage.get(result.hash);

    expect(retrieved).toBeDefined();
    expect(retrieved?.hash).toBe(result.hash);
    expect(retrieved?.confidence).toBe(result.confidence);
  });

  it('deve incrementar contador de uso', async () => {
    const result = await fingerprintService.generateFingerprint();
    
    const storedFingerprint = {
      hash: result.hash,
      deviceInfo: result.deviceInfo,
      confidence: result.confidence,
      createdAt: new Date(),
      lastSeen: new Date(),
      usageCount: 1,
      isBlocked: false,
      suspiciousActivity: 0
    };

    await fingerprintStorage.set(storedFingerprint);
    await fingerprintStorage.incrementUsage(result.hash);

    const updated = await fingerprintStorage.get(result.hash);
    expect(updated?.usageCount).toBe(2);
  });

  it('deve bloquear fingerprint após muita atividade suspeita', async () => {
    const result = await fingerprintService.generateFingerprint();
    
    const storedFingerprint = {
      hash: result.hash,
      deviceInfo: result.deviceInfo,
      confidence: result.confidence,
      createdAt: new Date(),
      lastSeen: new Date(),
      usageCount: 1,
      isBlocked: false,
      suspiciousActivity: 0
    };

    await fingerprintStorage.set(storedFingerprint);

    // Incrementa atividade suspeita até o limite
    for (let i = 0; i < 10; i++) {
      await fingerprintStorage.incrementSuspiciousActivity(result.hash);
    }

    const blocked = await fingerprintStorage.get(result.hash);
    expect(blocked?.isBlocked).toBe(true);
    expect(blocked?.suspiciousActivity).toBe(10);
  });
});

describe('Performance', () => {
  it('deve gerar fingerprint em tempo razoável', async () => {
    const start = Date.now();
    await fingerprintService.generateFingerprint();
    const end = Date.now();

    const duration = end - start;
    expect(duration).toBeLessThan(1000); // Menos de 1 segundo
  });

  it('deve validar fingerprint rapidamente', () => {
    const fingerprint = 'abc123def456789';
    
    const start = Date.now();
    for (let i = 0; i < 1000; i++) {
      fingerprintService.validateFingerprint(fingerprint);
    }
    const end = Date.now();

    const duration = end - start;
    expect(duration).toBeLessThan(100); // Menos de 100ms para 1000 validações
  });
});

describe('Casos extremos', () => {
  it('deve lidar com localStorage indisponível', async () => {
    // Mock localStorage que falha
    const originalLocalStorage = global.localStorage;
    global.localStorage = {
      getItem: vi.fn().mockImplementation(() => {
        throw new Error('localStorage not available');
      }),
      setItem: vi.fn().mockImplementation(() => {
        throw new Error('localStorage not available');
      }),
      removeItem: vi.fn(),
      clear: vi.fn()
    } as any;

    const result = await fingerprintService.generateFingerprint();
    expect(result.hash).toBeDefined();

    // Restaura localStorage
    global.localStorage = originalLocalStorage;
  });

  it('deve lidar com crypto.subtle indisponível', async () => {
    // Mock crypto que falha
    // @ts-ignore
    global.crypto = {
      subtle: {
        digest: vi.fn().mockRejectedValue(new Error('crypto not available'))
      }
    };

    const result = await fingerprintService.generateFingerprint();
    expect(result.hash).toBeDefined();
    expect(result.hash.length).toBeGreaterThan(0);
  });

  it('deve lidar com canvas que falha', async () => {
    mockCanvasContext.fillText.mockImplementation(() => {
      throw new Error('Canvas error');
    });

    const result = await fingerprintService.generateFingerprint();
    expect(result.deviceInfo.canvasHash).toBe('canvas-error');
  });

  it('deve lidar com WebGL que falha', async () => {
    mockWebGLContext.getParameter.mockImplementation(() => {
      throw new Error('WebGL error');
    });

    const result = await fingerprintService.generateFingerprint();
    expect(result.deviceInfo.webglHash).toBe('webgl-error');
  });
});