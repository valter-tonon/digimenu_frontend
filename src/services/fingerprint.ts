/**
 * Serviço de Fingerprint de Dispositivo
 * 
 * Implementa geração e validação de fingerprints únicos para dispositivos,
 * utilizando múltiplas técnicas para criar uma identificação robusta.
 */

export interface DeviceInfo {
  userAgent: string;
  screenResolution: string;
  timeZone: string;
  language: string;
  canvasHash: string;
  webglHash: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  colorDepth: number;
  pixelRatio: number;
}

export interface FingerprintResult {
  hash: string;
  deviceInfo: DeviceInfo;
  confidence: number; // 0-1, confiança na unicidade
}

export interface FingerprintService {
  generateFingerprint(): Promise<FingerprintResult>;
  validateFingerprint(fingerprint: string): boolean;
  getDeviceInfo(): Promise<DeviceInfo>;
  detectSuspiciousChanges(oldFingerprint: string, newFingerprint: string): boolean;
  calculateSimilarity(fp1: string, fp2: string): number;
}

export class BrowserFingerprintService implements FingerprintService {
  private static instance: BrowserFingerprintService;

  public static getInstance(): BrowserFingerprintService {
    if (!BrowserFingerprintService.instance) {
      BrowserFingerprintService.instance = new BrowserFingerprintService();
    }
    return BrowserFingerprintService.instance;
  }

  /**
   * Gera fingerprint completo do dispositivo
   */
  async generateFingerprint(): Promise<FingerprintResult> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      const hash = await this.hashFingerprint(deviceInfo);
      const confidence = this.calculateConfidence(deviceInfo);

      return {
        hash,
        deviceInfo,
        confidence
      };
    } catch (error) {
      console.warn('Erro ao gerar fingerprint:', error);
      // Fallback com dados básicos
      return this.generateFallbackFingerprint();
    }
  }

  /**
   * Coleta informações detalhadas do dispositivo
   */
  async getDeviceInfo(): Promise<DeviceInfo> {
    const [canvasHash, webglHash] = await Promise.all([
      this.generateCanvasFingerprint(),
      this.generateWebGLFingerprint()
    ]);

    return {
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      canvasHash,
      webglHash,
      deviceMemory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio
    };
  }

  /**
   * Gera fingerprint usando Canvas API
   */
  private async generateCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        return 'canvas-not-supported';
      }

      canvas.width = 200;
      canvas.height = 50;

      // Desenha texto com diferentes fontes e estilos
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      
      ctx.fillStyle = '#069';
      ctx.fillText('DigiMenu Fingerprint 🍕', 2, 15);
      
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.font = '18px Arial';
      ctx.fillText('Canvas Test', 4, 25);

      // Adiciona formas geométricas
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgb(255,0,255)';
      ctx.beginPath();
      ctx.arc(50, 25, 20, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();

      const dataURL = canvas.toDataURL();
      return await this.sha256(dataURL);
    } catch (error) {
      console.warn('Canvas fingerprint failed:', error);
      return 'canvas-error';
    }
  }

  /**
   * Gera fingerprint usando WebGL
   */
  private async generateWebGLFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        return 'webgl-not-supported';
      }

      // Coleta informações do WebGL
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '';
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
      
      const webglInfo = {
        vendor,
        renderer,
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
        maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS)
      };

      return await this.sha256(JSON.stringify(webglInfo));
    } catch (error) {
      console.warn('WebGL fingerprint failed:', error);
      return 'webgl-error';
    }
  }

  /**
   * Gera hash SHA-256 dos dados
   */
  private async sha256(data: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      // Fallback para ambientes que não suportam crypto.subtle
      return this.simpleHash(data);
    }
  }

  /**
   * Hash simples para fallback
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Cria hash final do fingerprint
   */
  private async hashFingerprint(deviceInfo: DeviceInfo): Promise<string> {
    const fingerprintData = {
      ua: deviceInfo.userAgent,
      sr: deviceInfo.screenResolution,
      tz: deviceInfo.timeZone,
      lang: deviceInfo.language,
      canvas: deviceInfo.canvasHash,
      webgl: deviceInfo.webglHash,
      mem: deviceInfo.deviceMemory || 0,
      cores: deviceInfo.hardwareConcurrency || 0,
      color: deviceInfo.colorDepth,
      pixel: deviceInfo.pixelRatio
    };

    const dataString = JSON.stringify(fingerprintData);
    return await this.sha256(dataString);
  }

  /**
   * Calcula confiança na unicidade do fingerprint
   */
  private calculateConfidence(deviceInfo: DeviceInfo): number {
    let confidence = 0.5; // Base confidence

    // Canvas fingerprint aumenta confiança
    if (deviceInfo.canvasHash && deviceInfo.canvasHash !== 'canvas-not-supported') {
      confidence += 0.2;
    }

    // WebGL fingerprint aumenta confiança
    if (deviceInfo.webglHash && deviceInfo.webglHash !== 'webgl-not-supported') {
      confidence += 0.2;
    }

    // Informações de hardware aumentam confiança
    if (deviceInfo.deviceMemory) confidence += 0.05;
    if (deviceInfo.hardwareConcurrency) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }

  /**
   * Gera fingerprint de fallback com dados básicos
   */
  private async generateFallbackFingerprint(): Promise<FingerprintResult> {
    const basicInfo: DeviceInfo = {
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      timeZone: 'unknown',
      language: navigator.language,
      canvasHash: 'fallback',
      webglHash: 'fallback',
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio
    };

    const hash = await this.hashFingerprint(basicInfo);

    return {
      hash,
      deviceInfo: basicInfo,
      confidence: 0.3 // Baixa confiança para fallback
    };
  }

  /**
   * Valida se um fingerprint tem formato válido
   */
  validateFingerprint(fingerprint: string): boolean {
    if (!fingerprint || typeof fingerprint !== 'string') {
      return false;
    }

    // Verifica se é um hash hexadecimal válido
    const hexRegex = /^[a-f0-9]+$/i;
    return hexRegex.test(fingerprint) && fingerprint.length >= 8;
  }

  /**
   * Detecta mudanças suspeitas entre fingerprints
   */
  detectSuspiciousChanges(oldFingerprint: string, newFingerprint: string): boolean {
    if (!this.validateFingerprint(oldFingerprint) || !this.validateFingerprint(newFingerprint)) {
      return true; // Fingerprints inválidos são suspeitos
    }

    // Se são exatamente iguais, não há mudança
    if (oldFingerprint === newFingerprint) {
      return false;
    }

    // Calcula similaridade
    const similarity = this.calculateSimilarity(oldFingerprint, newFingerprint);
    
    // Se a similaridade é muito baixa, é suspeito
    return similarity < 0.3;
  }

  /**
   * Calcula similaridade entre dois fingerprints
   */
  calculateSimilarity(fp1: string, fp2: string): number {
    if (fp1 === fp2) return 1.0;
    if (!fp1 || !fp2) return 0.0;

    // Algoritmo simples de similaridade baseado em caracteres comuns
    const len1 = fp1.length;
    const len2 = fp2.length;
    const maxLen = Math.max(len1, len2);
    
    if (maxLen === 0) return 1.0;

    let matches = 0;
    const minLen = Math.min(len1, len2);
    
    for (let i = 0; i < minLen; i++) {
      if (fp1[i] === fp2[i]) {
        matches++;
      }
    }

    return matches / maxLen;
  }
}

// Instância singleton para uso global
export const fingerprintService = BrowserFingerprintService.getInstance();

// Função utilitária para uso rápido
export async function generateDeviceFingerprint(): Promise<string> {
  const result = await fingerprintService.generateFingerprint();
  return result.hash;
}

// Função para validar fingerprint
export function isValidFingerprint(fingerprint: string): boolean {
  return fingerprintService.validateFingerprint(fingerprint);
}