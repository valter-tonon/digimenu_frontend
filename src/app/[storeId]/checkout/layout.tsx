'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StoreStatusProvider } from '@/infrastructure/context/StoreStatusContext';
import { useCartStore } from '@/store/cart-store';

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const storeId = params?.storeId as string;
  
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Tentar obter o storeId do carrinho se não estiver na URL
  const cartStoreId = useCartStore(state => state.storeId);
  const effectiveStoreId = storeId || cartStoreId;
  
  // Buscar status da loja da API
  useEffect(() => {
    const fetchStoreStatus = async () => {
      if (!effectiveStoreId) {
        setIsLoading(false);
        return;
      }
      
      try {
        const baseURL = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${baseURL}/tenant/${effectiveStoreId}`);
        
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
  }, [effectiveStoreId]);

  return (
    <StoreStatusProvider isStoreOpen={isStoreOpen} storeId={effectiveStoreId || undefined}>
      {children}
    </StoreStatusProvider>
  );
} 