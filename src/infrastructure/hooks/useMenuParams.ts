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
    console.log('useMenuParams - Inicializando no cliente');
    setIsClient(true);
    
    // Forçar carregamento de parâmetros diretamente da URL durante a montagem
    try {
      console.log('useMenuParams - Carregando da URL diretamente durante a montagem');
      const url = new URL(window.location.href);
      const tableFromUrl = url.searchParams.get('table');
      const storeFromUrl = url.searchParams.get('store');
      const deliveryFromUrl = url.searchParams.get('isDelivery') === 'true';
      
      console.log('Parâmetros da URL inicial:', { 
        table: tableFromUrl, 
        store: storeFromUrl,
        isDelivery: deliveryFromUrl
      });
      
      if (tableFromUrl) setTableId(tableFromUrl);
      if (storeFromUrl) setStoreSlug(storeFromUrl);
      if (deliveryFromUrl) setIsDelivery(true);
      
      const hasValidParams = !!tableFromUrl || !!storeFromUrl;
      setIsValid(hasValidParams);
      setParamsLoaded(true);
      
      console.log('useMenuParams - Parâmetros iniciais definidos:', { 
        tableId: tableFromUrl, 
        storeSlug: storeFromUrl,
        isDelivery: deliveryFromUrl,
        isValid: hasValidParams
      });
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
      
      console.log('useMenuParams - searchParams disponível:', Array.from(searchParams.entries()));
      
      const table = searchParams.get('table');
      const store = searchParams.get('store');
      const delivery = searchParams.get('isDelivery') === 'true';
      
      console.log('useMenuParams - Parâmetros extraídos:', { table, store, delivery });
      
      const hasValidParams = !!table || !!store;
      
      setTableId(table);
      setStoreSlug(store);
      setIsDelivery(delivery);
      setIsValid(hasValidParams);
      setParamsLoaded(true);
      
      console.log('useMenuParams - Estados atualizados via searchParams:', { 
        tableId: table, 
        storeSlug: store,
        isDelivery: delivery,
        isValid: hasValidParams
      });
    } catch (error) {
      console.error('useMenuParams - Erro ao processar searchParams:', error);
    }
  }, [searchParams, isClient]);
  
  // Último fallback para URL direta
  useEffect(() => {
    if (isClient && !paramsLoaded && typeof window !== 'undefined') {
      try {
        console.log('useMenuParams - Fallback: extraindo parâmetros da URL diretamente');
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