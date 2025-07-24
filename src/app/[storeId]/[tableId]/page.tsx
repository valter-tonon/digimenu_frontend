'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { use } from 'react';

interface StoreTablePageProps {
  params: Promise<{
    storeId: string;
    tableId: string;
  }>;
}

export default function StoreTablePage({ params }: StoreTablePageProps) {
  const router = useRouter();
  const { storeId, tableId } = use(params);

  useEffect(() => {
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

    // Salvar dados diretamente no storage para mesa
    if (typeof window !== 'undefined') {
      try {
        // Salvar no localStorage
        localStorage.setItem('digimenu_store_id', storeId);
        
        // Salvar no sessionStorage
        sessionStorage.setItem('digimenu_table_id', tableId);
        sessionStorage.setItem('digimenu_is_delivery', 'false');
        
        console.log('StoreTablePage - Dados salvos no storage para mesa:', { storeId, tableId, isDelivery: false });
      } catch (error) {
        console.error('StoreTablePage - Erro ao salvar no storage:', error);
      }
    }

    // Redirecionar para /menu limpo (sem parâmetros)
    console.log('StoreTablePage - Redirecionando para /menu limpo');
    router.replace('/menu');
  }, [storeId, tableId, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Carregando cardápio da mesa...</p>
      </div>
    </div>
  );
} 