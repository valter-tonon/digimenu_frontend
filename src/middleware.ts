import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const { pathname } = url;
  

  
  // Para /menu e /checkout, sempre deixar passar - os dados serão carregados do localStorage/sessionStorage
  if (pathname === '/menu' || pathname === '/checkout') {
    return NextResponse.next();
  }
  
  // Verificar se o caminho corresponde ao padrão /:storeId/:tableId
  const pathSegments = pathname.split('/').filter(Boolean);
  
  if (pathSegments.length === 2) {
    const storeId = pathSegments[0];
    const tableId = pathSegments[1];
    
    // Se for uma rota de checkout ou login, não redirecionar
    if (tableId === 'checkout' || tableId === 'login') {
      return NextResponse.next();
    }
    
    // Verificar se os IDs parecem válidos
    if (storeId && tableId) {
      // Redirecionar para a página de menu com os parâmetros de consulta
      const menuUrl = new URL('/menu', url.origin);
      menuUrl.searchParams.set('store', storeId);
      menuUrl.searchParams.set('table', tableId);
      
      return NextResponse.redirect(menuUrl);
    }
  }
  
  // Para rotas de storeId único (/12345678901234), deixar passar para a página [storeId]/page.tsx
  // O middleware não deve interceptar essas rotas
  if (pathSegments.length === 1) {
    const storeId = pathSegments[0];
    
    // Verificar se é uma rota especial que deve ser ignorada
    if (storeId === 'menu' || 
        storeId === '404' || 
        storeId === 'not-found' || 
        storeId === '404-restaurant' || 
        storeId === '404-table' || 
        storeId === '404-invalid' || 
        storeId === '404-session' || 
        storeId === 'test-flow' || 
        storeId === 'login' || 
        storeId === 'dashboard' ||
        storeId === 'favicon.ico' ||
        storeId === '_next' ||
        storeId.includes('.')) {
      return NextResponse.next();
    }
    
    // Para storeId único, deixar passar (não redirecionar)
    // A página [storeId]/page.tsx irá lidar com isso
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

// Configurar os caminhos que o middleware deve ser executado
export const config = {
  matcher: [
    '/menu',
    // Excluir completamente as rotas de checkout de qualquer interceptação
    '/((?!api|_next/static|_next/image|favicon.ico|login|dashboard|admin|not-found)(?!.*checkout).*)',
  ],
}; 