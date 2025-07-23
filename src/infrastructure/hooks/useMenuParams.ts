'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useMenuParams() {
  const searchParams = useSearchParams();
  const [tableId, setTableId] = useState<string | null>(null);
  const [storeSlug, setStoreSlug] = useState<string | null>(null);
  const [isDelivery, setIsDelivery] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);
  const [paramsLoaded, setParamsLoaded] = useState<boolean>(false);
  
  // Marcar que estamos no cliente
  useEffect(() => {
    setIsClient(true);
    
    // Forçar carregamento de parâmetros diretamente da URL durante a montagem
    try {
      const url = new URL(window.location.href);
      const tableFromUrl = url.searchParams.get('table');
      const storeFromUrl = url.searchParams.get('store');
      const deliveryFromUrl = url.searchParams.get('isDelivery') === 'true';
      
      if (tableFromUrl) setTableId(tableFromUrl);
      if (storeFromUrl) setStoreSlug(storeFromUrl);
      if (deliveryFromUrl) setIsDelivery(true);
      
      const hasValidParams = !!tableFromUrl || !!storeFromUrl;
      setIsValid(hasValidParams);
      setParamsLoaded(true);
    } catch (error) {
      console.error('useMenuParams - Erro ao extrair parâmetros da URL inicial:', error);
    }
  }, []);
  
  // Atualizar parâmetros quando searchParams mudar
  useEffect(() => {
    try {
      if (!isClient || !searchParams) {
        return;
      }
      
      const table = searchParams.get('table');
      const store = searchParams.get('store');
      const delivery = searchParams.get('isDelivery') === 'true';
      
      const hasValidParams = !!table || !!store;
      
      setTableId(table);
      setStoreSlug(store);
      setIsDelivery(delivery);
      setIsValid(hasValidParams);
      setParamsLoaded(true);
    } catch (error) {
      console.error('useMenuParams - Erro ao processar searchParams:', error);
    }
  }, [searchParams, isClient]);
  
  // Último fallback para URL direta
  useEffect(() => {
    if (isClient && !paramsLoaded && typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        const tableFromUrl = url.searchParams.get('table');
        const storeFromUrl = url.searchParams.get('store');
        const deliveryFromUrl = url.searchParams.get('isDelivery') === 'true';
        
        if (tableFromUrl) setTableId(tableFromUrl);
        if (storeFromUrl) setStoreSlug(storeFromUrl);
        if (deliveryFromUrl) setIsDelivery(true);
        
        const hasValidParams = !!tableFromUrl || !!storeFromUrl;
        setIsValid(hasValidParams);
        setParamsLoaded(true);
        
        console.log('useMenuParams - Fallback: parâmetros definidos:', { 
          tableId: tableFromUrl, 
          storeSlug: storeFromUrl,
          isDelivery: deliveryFromUrl,
          isValid: hasValidParams
        });
      } catch (error) {
        console.error('useMenuParams - Erro no fallback:', error);
      }
    }
  }, [isClient, paramsLoaded]);
  
  return {
    tableId,
    storeSlug,
    isDelivery,
    isValid: isClient && isValid,
    params: {
      table: tableId || '',
      store: storeSlug || '',
      isDelivery: isDelivery ? 'true' : 'false'
    }
  };
} 