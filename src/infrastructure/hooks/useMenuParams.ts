'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useMenuParams() {
  const searchParams = useSearchParams();
  const [tableId, setTableId] = useState<string | null>(null);
  const [storeSlug, setStoreSlug] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);
  
  // Marcar que estamos no cliente
  useEffect(() => {
    console.log('useMenuParams - Inicializando no cliente');
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    try {
      if (!isClient) {
        console.log('useMenuParams - Ainda não está no cliente');
        return;
      }
      
      if (!searchParams) {
        console.log('useMenuParams - searchParams não disponível');
        return;
      }
      
      console.log('useMenuParams - searchParams disponível:', 
        Array.from(searchParams.entries()));
      
      const table = searchParams.get('table');
      const store = searchParams.get('store');
      
      console.log('useMenuParams - Parâmetros extraídos:', { table, store });
      
      // Só atualiza os estados se os valores realmente mudaram
      if (table !== tableId) {
        setTableId(table);
      }
      
      if (store !== storeSlug) {
        setStoreSlug(store);
      }
      
      const newIsValid = !!table || !!store;
      if (newIsValid !== isValid) {
        setIsValid(newIsValid);
      }
      
      console.log('useMenuParams - Estados atualizados:', { 
        tableId: table, 
        storeSlug: store, 
        isValid: newIsValid 
      });
    } catch (error) {
      console.error('useMenuParams - Erro ao processar parâmetros:', error);
    }
  }, [searchParams, isClient, tableId, storeSlug, isValid]);
  
  // Fallback para URL direta se os parâmetros não estiverem disponíveis
  useEffect(() => {
    if (isClient && !tableId && !storeSlug && typeof window !== 'undefined') {
      try {
        console.log('useMenuParams - Tentando extrair parâmetros da URL diretamente');
        const url = new URL(window.location.href);
        const tableFromUrl = url.searchParams.get('table');
        const storeFromUrl = url.searchParams.get('store');
        
        if (tableFromUrl) setTableId(tableFromUrl);
        if (storeFromUrl) setStoreSlug(storeFromUrl);
        
        if (tableFromUrl || storeFromUrl) {
          setIsValid(true);
          console.log('useMenuParams - Parâmetros extraídos da URL:', { 
            table: tableFromUrl, 
            store: storeFromUrl 
          });
        }
      } catch (error) {
        console.error('useMenuParams - Erro ao extrair parâmetros da URL:', error);
      }
    }
  }, [isClient, tableId, storeSlug]);
  
  return {
    tableId,
    storeSlug,
    isValid: isClient && isValid,
    params: {
      ...(tableId ? { table: tableId } : {}),
      ...(storeSlug ? { store: storeSlug } : {})
    }
  };
} 