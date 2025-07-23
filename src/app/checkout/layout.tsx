'use client';

import { StoreStatusProvider } from '@/infrastructure/context/StoreStatusContext';
import { useAppContext } from '@/hooks/useAppContext';

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: contextData } = useAppContext();
  
  // Por padrão, assumir que a loja está aberta
  // Em uma implementação real, você buscaria isso da API
  const isStoreOpen = true;

  return (
    <StoreStatusProvider isStoreOpen={isStoreOpen}>
      {children}
    </StoreStatusProvider>
  );
} 