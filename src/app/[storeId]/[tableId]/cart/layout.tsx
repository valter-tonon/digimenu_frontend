'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StoreStatusProvider } from '@/infrastructure/context/StoreStatusContext';
import { useCartStore } from '@/store/cart-store';

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const storeId = params?.storeId as string;
  const tableId = params?.tableId as string;
  
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const { setContext } = useCartStore();
  
  // Configurar contexto do carrinho
  useEffect(() => {
    if (storeId) {
      setContext(storeId, tableId);
    }
  }, [storeId, tableId, setContext]);
  
  // Buscar status da loja da API
  useEffect(() => {
    const fetchStoreStatus = async () => {
      if (!storeId) {
        setIsLoading(false);
        return;
      }
      
      try {
        const baseURL = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${baseURL}/tenant/${storeId}`);
        
        if (response.ok) {
          const data = await response.json();
          const tenantData = data.data || data;
          
          // Verificar se o restaurante está aberto com base no horário de funcionamento
          if (tenantData?.opening_hours) {
            setIsStoreOpen(tenantData.opening_hours.is_open ?? true);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar status da loja:', error);
        // Em caso de erro, assumir que está aberto
        setIsStoreOpen(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStoreStatus();
  }, [storeId]);

  return (
    <StoreStatusProvider isStoreOpen={isStoreOpen} storeId={storeId}>
      {children}
    </StoreStatusProvider>
  );
} 