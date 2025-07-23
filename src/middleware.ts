import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const { pathname } = url;
  

  
  // Se já estamos na página /menu com parâmetros válidos, não redirecionar
  if (pathname === '/menu') {
    const hasTable = url.searchParams.has('table');
    const hasStore = url.searchParams.has('store');
    
    // Se tiver pelo menos o parâmetro store, deixar passar
    if (hasStore) {
      return NextResponse.next();
    }
    
    // Se não tiver nem mesa nem loja, redirecionar para a página 404
    if (!hasTable && !hasStore) {
      return NextResponse.redirect(new URL('/404', url.origin));
    }
  }
  
  // Verificar se o caminho corresponde ao padrão /:storeId/:tableId
  const pathSegments = pathname.split('/').filter(Boolean);
  
  if (pathSegments.length === 2) {
    const storeId = pathSegments[0];
    const tableId = pathSegments[1];
    
    // Verificar se os IDs parecem válidos
    if (storeId && tableId) {
      // Redirecionar para a página de menu com os parâmetros de consulta
      const menuUrl = new URL('/menu', url.origin);
      menuUrl.searchParams.set('store', storeId);
      menuUrl.searchParams.set('table', tableId);
      
      return NextResponse.redirect(menuUrl);
    }
  }
  
  // Caso para /:storeId (menu do restaurante sem mesa específica - delivery)
  if (pathSegments.length === 1) {
    const storeId = pathSegments[0];
    
    // Verificar se o ID parece válido e não é uma rota especial
    if (storeId && 
        storeId !== 'menu' && 
        storeId !== '404' && 
        storeId !== 'not-found' && 
        storeId !== 'login' && 
        storeId !== 'dashboard' &&
        storeId !== 'favicon.ico' &&
        storeId !== '_next' &&
        !storeId.includes('.')) {
      // Redirecionar para a página de menu apenas com o parâmetro de loja
      const menuUrl = new URL('/menu', url.origin);
      menuUrl.searchParams.set('store', storeId);
      menuUrl.searchParams.set('isDelivery', 'true');
      
      return NextResponse.redirect(menuUrl);
    }
  }
  
  return NextResponse.next();
}

// Configurar os caminhos que o middleware deve ser executado
export const config = {
  matcher: [
    '/menu',
    '/((?!api|_next/static|_next/image|favicon.ico|login|dashboard|admin|not-found).*)',
  ],
}; 