'use client';

import { StoreStatusProvider } from '@/infrastructure/context/StoreStatusContext';

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Por enquanto, vamos assumir que o restaurante está aberto
  // Em uma implementação real, você buscaria essa informação da API
  const isStoreOpen = true;

  return (
    <StoreStatusProvider isStoreOpen={isStoreOpen}>
      {children}
    </StoreStatusProvider>
  );
} 