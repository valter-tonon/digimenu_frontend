'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { use } from 'react';
import { useAppContext } from '@/hooks/useAppContext';

interface StoreTablePageProps {
  params: Promise<{
    storeId: string;
    tableId: string;
  }>;
}

export default function StoreTablePage({ params }: StoreTablePageProps) {
  const router = useRouter();
  const { storeId, tableId } = use(params);
  const { initializeFromParams, isLoading, isValid, error } = useAppContext();

  useEffect(() => {
    // Reserved route names que não devem ser tratadas como storeId
    const reservedRoutes = ['checkout', 'menu', 'auth', 'login', 'dashboard', 'orders', 'api', '_next', 'admin'];

    // Se for uma rota reservada, deixar que o Next.js roteador trate
    if (reservedRoutes.includes(storeId)) {
      console.log(`StoreTablePage - "${storeId}" é uma rota reservada, ignorando`);
      return;
    }

    // Validar se os IDs têm o formato correto
    if (!storeId || storeId.length < 10) {
      console.log('StoreTablePage - StoreId inválido, redirecionando para /404-restaurant');
      router.push('/404-restaurant');
      return;
    }

    if (!tableId || tableId.length < 10) {
      console.log('StoreTablePage - TableId inválido, redirecionando para /404-table');
      router.push('/404-table');
      return;
    }

    // Usar o useAppContext para processar os dados corretamente
    console.log('StoreTablePage - Inicializando contexto com:', { storeId, tableId });
    initializeFromParams({
      store: storeId,
      table: tableId,
      isDelivery: 'false'
    });
  }, [storeId, tableId, router, initializeFromParams]);

  // Se ainda está carregando, mostrar loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando dados da mesa...</p>
        </div>
      </div>
    );
  }

  // Se houve erro, redirecionar para página de erro apropriada
  if (error) {
    switch (error) {
      case 'RESTAURANT_NOT_FOUND':
        router.push('/404-restaurant');
        break;
      case 'TABLE_NOT_FOUND':
        router.push('/404-table');
        break;
      default:
        router.push('/404-invalid');
        break;
    }
    return null;
  }

  // Se é válido, o useAppContext já redirecionou para /menu
  // Mostrar loading enquanto o redirecionamento acontece
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Redirecionando para o cardápio...</p>
      </div>
    </div>
  );
} 