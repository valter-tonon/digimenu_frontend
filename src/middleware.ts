import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const { pathname } = url;
  
  console.log('Middleware - URL completa:', request.url);
  console.log('Middleware - Pathname:', pathname);
  
  // Verificar se o caminho corresponde ao padrão /:storeId/:tableId
  const pathSegments = pathname.split('/').filter(Boolean);
  console.log('Middleware - Segmentos do caminho:', pathSegments);
  
  if (pathSegments.length === 2) {
    const storeId = pathSegments[0];
    const tableId = pathSegments[1];
    
    console.log('Middleware - Identificado padrão /:storeId/:tableId:', { storeId, tableId });
    
    // Verificar se os IDs parecem válidos
    if (storeId && tableId) {
      // Redirecionar para a página de menu com os parâmetros de consulta
      const menuUrl = new URL('/menu', url.origin);
      menuUrl.searchParams.set('store', storeId);
      menuUrl.searchParams.set('table', tableId);
      
      console.log('Middleware - Redirecionando para:', menuUrl.toString());
      // Usar redirect em vez de rewrite para tornar o redirecionamento mais explícito
      return NextResponse.redirect(menuUrl);
    }
  }
  
  // Caso para /:storeId (menu do restaurante sem mesa específica - delivery)
  if (pathSegments.length === 1) {
    const storeId = pathSegments[0];
    
    console.log('Middleware - Identificado padrão /:storeId (delivery):', { storeId });
    
    // Verificar se o ID parece válido
    if (storeId && storeId !== 'menu' && storeId !== '404' && storeId !== 'not-found') {
      // Redirecionar para a página de menu apenas com o parâmetro de loja
      const menuUrl = new URL('/menu', url.origin);
      menuUrl.searchParams.set('store', storeId);
      menuUrl.searchParams.set('isDelivery', 'true');
      
      console.log('Middleware - Redirecionando para menu de delivery:', menuUrl.toString());
      return NextResponse.redirect(menuUrl);
    }
  }
  
  // Verificar se estamos na página de menu
  if (pathname === '/menu') {
    const hasTable = url.searchParams.has('table');
    const hasStore = url.searchParams.has('store');
    
    console.log('Middleware - Menu path - Parâmetros:', { 
      table: url.searchParams.get('table'), 
      store: url.searchParams.get('store') 
    });
    
    // Se não tiver nem mesa nem loja, redirecionar para a página 404
    if (!hasTable && !hasStore) {
      console.log('Middleware - Redirecionando para not-found (parâmetros ausentes)');
      return NextResponse.redirect(new URL('/404', url.origin));
    }
  }
  
  console.log('Middleware - Passando para o próximo middleware');
  return NextResponse.next();
}

// Configurar os caminhos que o middleware deve ser executado
export const config = {
  matcher: ['/menu', '/:path/:path*'],
}; 