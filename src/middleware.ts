import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const { pathname } = url;

  // ===== VERIFICAÇÃO DE AUTENTICAÇÃO PARA CHECKOUT =====
  // Camada 1: Middleware - Verificação Leve

  if (pathname.startsWith('/checkout')) {
    // Sempre permitir acesso a qualquer rota /checkout/*
    // O CheckoutWizard gerencia internamente todos os passos via state machine
    // NÃO há redirecionamentos baseados em autenticação no middleware
    return NextResponse.next();
  }

  // ===== ROTAS PÚBLICAS =====

  // Para /menu e /checkout, sempre deixar passar
  if (pathname === '/menu' || pathname === '/checkout') {
    return NextResponse.next();
  }

  // Verificar se o caminho corresponde ao padrão /:storeId/:tableId
  const pathSegments = pathname.split('/').filter(Boolean);

  if (pathSegments.length === 2) {
    const storeId = pathSegments[0];
    const tableId = pathSegments[1];

    // Se for uma rota de checkout ou login, deixar passar
    if (tableId === 'checkout' || tableId === 'login') {
      return NextResponse.next();
    }

    // Para rotas de mesa, deixar passar
    return NextResponse.next();
  }

  // Para rotas de storeId único
  if (pathSegments.length === 1) {
    const storeId = pathSegments[0];

    // Rotas especiais que devem ser ignoradas
    const specialRoutes = [
      'menu', '404', 'not-found', '404-restaurant', '404-table',
      '404-invalid', '404-session', 'test-flow', 'login', 'dashboard',
      'favicon.ico', '_next'
    ];

    if (specialRoutes.includes(storeId) || storeId.includes('.')) {
      return NextResponse.next();
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

// Configurar os caminhos que o middleware deve ser executado
export const config = {
  matcher: [
    '/checkout/:path*',
    '/menu',
    '/:storeId/:tableId',
    '/:storeId',
  ],
}; 