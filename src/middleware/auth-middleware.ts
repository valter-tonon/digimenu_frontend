/**
 * Middleware de autenticação para proteção de rotas
 * 
 * Verifica se o usuário tem permissão para acessar determinadas rotas
 * baseado no estado de autenticação e sessão contextual.
 */

import { NextRequest, NextResponse } from 'next/server';

export interface AuthMiddlewareConfig {
  requireAuth?: boolean;
  allowGuest?: boolean;
  requireSession?: boolean;
  redirectTo?: string;
}

/**
 * Middleware para verificar autenticação em rotas protegidas
 */
export function createAuthMiddleware(config: AuthMiddlewareConfig = {}) {
  return async (request: NextRequest) => {
    const {
      requireAuth = false,
      allowGuest = true,
      requireSession = false,
      redirectTo = '/login'
    } = config;

    const url = request.nextUrl.clone();
    
    // Verifica token de autenticação tradicional
    const authToken = request.cookies.get('auth_token')?.value || 
                     request.headers.get('authorization')?.replace('Bearer ', '');

    // Verifica se há sessão contextual ativa
    const sessionId = request.cookies.get('session_id')?.value;
    
    const isAuthenticated = !!authToken;
    const hasSession = !!sessionId;

    // Se requer autenticação e não está autenticado
    if (requireAuth && !isAuthenticated) {
      // Se permite visitante e há sessão contextual, permite acesso
      if (allowGuest && hasSession) {
        return NextResponse.next();
      }
      
      // Redireciona para login
      url.pathname = redirectTo;
      return NextResponse.redirect(url);
    }

    // Se requer sessão contextual e não há sessão
    if (requireSession && !hasSession) {
      // Redireciona para página inicial para criar sessão
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  };
}

/**
 * Middleware específico para rotas de checkout
 */
export const checkoutAuthMiddleware = createAuthMiddleware({
  requireAuth: false,
  allowGuest: true,
  requireSession: true,
  redirectTo: '/'
});

/**
 * Middleware específico para rotas administrativas
 */
export const adminAuthMiddleware = createAuthMiddleware({
  requireAuth: true,
  allowGuest: false,
  requireSession: false,
  redirectTo: '/admin/login'
});

/**
 * Middleware específico para rotas de pedidos
 */
export const orderAuthMiddleware = createAuthMiddleware({
  requireAuth: false,
  allowGuest: true,
  requireSession: true,
  redirectTo: '/'
});

/**
 * Verifica se o usuário pode fazer pedidos como visitante
 */
export async function canOrderAsGuest(request: NextRequest): Promise<boolean> {
  try {
    const sessionId = request.cookies.get('session_id')?.value;
    if (!sessionId) return false;

    // Verifica configurações da loja (integração com backend)
    const storeId = request.nextUrl.searchParams.get('store');
    if (!storeId) return false;

    // Mock - em produção, verificar configurações reais da loja
    const storeSettings = {
      allowQuickRegistration: true,
      requireAuthForOrders: false
    };

    return storeSettings.allowQuickRegistration && !storeSettings.requireAuthForOrders;
    
  } catch (error) {
    console.error('Erro ao verificar permissão de visitante:', error);
    return false;
  }
}

/**
 * Extrai informações de contexto da requisição
 */
export function extractContextFromRequest(request: NextRequest) {
  const url = request.nextUrl;
  
  return {
    storeId: url.searchParams.get('store'),
    tableId: url.searchParams.get('table'),
    deliveryMode: url.pathname.includes('/delivery'),
    userAgent: request.headers.get('user-agent') || '',
    ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  };
}