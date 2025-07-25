/**
 * Middleware de rate limiting para Next.js
 * 
 * Integra com o serviço de rate limiting para controlar
 * diferentes tipos de requisições e bloquear IPs suspeitos.
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimitingService, RateLimitType } from '../services/rateLimiting';

export interface RateLimitMiddlewareConfig {
  type: RateLimitType;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
  onLimitReached?: (request: NextRequest, result: any) => NextResponse;
  onError?: (request: NextRequest, error: Error) => NextResponse;
}

/**
 * Cria middleware de rate limiting
 */
export function createRateLimitMiddleware(config: RateLimitMiddlewareConfig) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Gera chave identificadora (IP por padrão)
      const identifier = config.keyGenerator 
        ? config.keyGenerator(request)
        : getClientIP(request);

      // Verifica rate limit
      const result = await rateLimitingService.checkRateLimit(
        identifier,
        config.type,
        {
          userAgent: request.headers.get('user-agent'),
          url: request.url,
          method: request.method
        }
      );

      // Se não permitido, retorna erro
      if (!result.allowed) {
        const response = config.onLimitReached 
          ? config.onLimitReached(request, result)
          : createRateLimitResponse(result);

        // Registra tentativa bloqueada
        await rateLimitingService.recordAttempt(
          identifier,
          config.type,
          false,
          {
            userAgent: request.headers.get('user-agent'),
            blocked: true,
            reason: result.reason
          }
        );

        return response;
      }

      // Adiciona headers de rate limit à resposta
      const response = NextResponse.next();
      addRateLimitHeaders(response, result);

      // Registra tentativa bem-sucedida (será feito após processamento da requisição)
      response.headers.set('x-rate-limit-identifier', identifier);
      response.headers.set('x-rate-limit-type', config.type);

      return response;

    } catch (error) {
      console.error('Erro no middleware de rate limiting:', error);
      
      return config.onError 
        ? config.onError(request, error as Error)
        : NextResponse.next(); // Permite requisição em caso de erro
    }
  };
}

/**
 * Middleware específico para QR Code
 */
export const qrCodeRateLimitMiddleware = createRateLimitMiddleware({
  type: 'qr_code',
  keyGenerator: (request) => {
    // Combina IP com parâmetros de loja/mesa para rate limit mais específico
    const ip = getClientIP(request);
    const url = new URL(request.url);
    const storeId = url.searchParams.get('store');
    const tableId = url.searchParams.get('table');
    
    return `${ip}_${storeId}_${tableId}`;
  },
  onLimitReached: (request, result) => {
    return NextResponse.json(
      {
        error: 'Muitas tentativas de acesso via QR Code',
        message: result.reason,
        retryAfter: result.retryAfter
      },
      { 
        status: 429,
        headers: {
          'Retry-After': result.retryAfter?.toString() || '3600',
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetTime.toISOString()
        }
      }
    );
  }
});

/**
 * Middleware específico para WhatsApp
 */
export const whatsappRateLimitMiddleware = createRateLimitMiddleware({
  type: 'whatsapp',
  keyGenerator: (request) => {
    // Combina IP com fingerprint para rate limit mais preciso
    const ip = getClientIP(request);
    const fingerprint = request.headers.get('x-fingerprint');
    
    return fingerprint ? `${ip}_${fingerprint}` : ip;
  },
  onLimitReached: (request, result) => {
    return NextResponse.json(
      {
        error: 'Limite de solicitações WhatsApp excedido',
        message: result.reason,
        retryAfter: result.retryAfter
      },
      { 
        status: 429,
        headers: {
          'Retry-After': result.retryAfter?.toString() || '86400',
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetTime.toISOString()
        }
      }
    );
  }
});

/**
 * Middleware específico para fingerprint
 */
export const fingerprintRateLimitMiddleware = createRateLimitMiddleware({
  type: 'fingerprint',
  skipSuccessfulRequests: true, // Só conta tentativas falhadas
  onLimitReached: (request, result) => {
    return NextResponse.json(
      {
        error: 'Muitas tentativas de fingerprint',
        message: 'Dispositivo temporariamente bloqueado por atividade suspeita',
        retryAfter: result.retryAfter
      },
      { 
        status: 429,
        headers: {
          'Retry-After': result.retryAfter?.toString() || '7200',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetTime.toISOString()
        }
      }
    );
  }
});

/**
 * Middleware geral para APIs
 */
export const generalRateLimitMiddleware = createRateLimitMiddleware({
  type: 'general',
  onLimitReached: (request, result) => {
    return NextResponse.json(
      {
        error: 'Muitas requisições',
        message: result.reason,
        retryAfter: result.retryAfter
      },
      { 
        status: 429,
        headers: {
          'Retry-After': result.retryAfter?.toString() || '900',
          'X-RateLimit-Limit': '50',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetTime.toISOString()
        }
      }
    );
  }
});

/**
 * Middleware para registrar tentativas após processamento
 */
export function createRateLimitRecorderMiddleware() {
  return async (request: NextRequest, response: NextResponse): Promise<NextResponse> => {
    try {
      const identifier = response.headers.get('x-rate-limit-identifier');
      const type = response.headers.get('x-rate-limit-type') as RateLimitType;
      
      if (identifier && type) {
        const success = response.status < 400;
        
        await rateLimitingService.recordAttempt(
          identifier,
          type,
          success,
          {
            userAgent: request.headers.get('user-agent'),
            statusCode: response.status,
            url: request.url,
            method: request.method
          }
        );

        // Remove headers internos
        response.headers.delete('x-rate-limit-identifier');
        response.headers.delete('x-rate-limit-type');
      }

      return response;

    } catch (error) {
      console.error('Erro ao registrar tentativa de rate limit:', error);
      return response;
    }
  };
}

/**
 * Middleware combinado para diferentes rotas
 */
export function createRouteBasedRateLimitMiddleware() {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { pathname } = request.nextUrl;

    // QR Code access
    if (pathname.includes('/qr') || request.nextUrl.searchParams.has('table')) {
      return qrCodeRateLimitMiddleware(request);
    }

    // WhatsApp auth
    if (pathname.includes('/whatsapp') || pathname.includes('/auth/whatsapp')) {
      return whatsappRateLimitMiddleware(request);
    }

    // Fingerprint generation
    if (pathname.includes('/fingerprint')) {
      return fingerprintRateLimitMiddleware(request);
    }

    // API routes
    if (pathname.startsWith('/api/')) {
      return generalRateLimitMiddleware(request);
    }

    // Sem rate limiting para outras rotas
    return NextResponse.next();
  };
}

/**
 * Funções auxiliares
 */

function getClientIP(request: NextRequest): string {
  // Tenta diferentes headers para obter o IP real
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback para IP da conexão
  return request.ip || '127.0.0.1';
}

function createRateLimitResponse(result: any): NextResponse {
  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: result.reason,
      retryAfter: result.retryAfter
    },
    {
      status: 429,
      headers: {
        'Retry-After': result.retryAfter?.toString() || '3600',
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toISOString()
      }
    }
  );
}

function addRateLimitHeaders(response: NextResponse, result: any): void {
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.resetTime.toISOString());
}

/**
 * Hook para usar rate limiting no frontend
 */
export const useRateLimit = (type: RateLimitType) => {
  const checkLimit = async (identifier?: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: Date;
    retryAfter?: number;
  }> => {
    try {
      const ip = identifier || await getClientIPFromBrowser();
      return await rateLimitingService.checkRateLimit(ip, type);
    } catch (error) {
      console.error('Erro ao verificar rate limit:', error);
      return {
        allowed: true,
        remaining: 1,
        resetTime: new Date(Date.now() + 60000)
      };
    }
  };

  const recordAttempt = async (success: boolean, identifier?: string): Promise<void> => {
    try {
      const ip = identifier || await getClientIPFromBrowser();
      await rateLimitingService.recordAttempt(ip, type, success);
    } catch (error) {
      console.error('Erro ao registrar tentativa:', error);
    }
  };

  return { checkLimit, recordAttempt };
};

async function getClientIPFromBrowser(): Promise<string> {
  try {
    // Em produção, usar serviço real para obter IP
    return '127.0.0.1';
  } catch {
    return '127.0.0.1';
  }
}