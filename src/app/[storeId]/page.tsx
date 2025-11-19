'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { use } from 'react';

interface StorePageProps {
  params: Promise<{
    storeId: string;
  }>;
}

export default function StorePage({ params }: StorePageProps) {
  const router = useRouter();
  const { storeId } = use(params);

  useEffect(() => {
    // Reserved route names que não devem ser tratadas como storeId
    const reservedRoutes = ['checkout', 'menu', 'auth', 'login', 'dashboard', 'orders', 'api', '_next', 'admin'];

    // Se for uma rota reservada, deixar que o Next.js roteador trate
    if (reservedRoutes.includes(storeId)) {
      console.log(`StorePage - "${storeId}" é uma rota reservada, ignorando`);
      return;
    }

    // Validar se o storeId tem o formato correto
    if (!storeId || storeId.length < 10) {
      console.log('StorePage - StoreId inválido, redirecionando para /404-restaurant');
      router.push('/404-restaurant');
      return;
    }

    // Salvar dados diretamente no storage para delivery
    if (typeof window !== 'undefined') {
      try {
        // Salvar no localStorage
        localStorage.setItem('digimenu_store_id', storeId);
        
        // Salvar no sessionStorage
        sessionStorage.setItem('digimenu_is_delivery', 'true');
        
        console.log('StorePage - Dados salvos no storage para delivery:', { storeId, isDelivery: true });
      } catch (error) {
        console.error('StorePage - Erro ao salvar no storage:', error);
      }
    }

    // Redirecionar para /menu limpo (sem parâmetros)
    console.log('StorePage - Redirecionando para /menu limpo');
    router.replace('/menu');
  }, [storeId, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Carregando cardápio...</p>
      </div>
    </div>
  );
} 