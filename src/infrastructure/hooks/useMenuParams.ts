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
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (!isClient || !searchParams) {
      return;
    }
    
    const table = searchParams.get('table');
    const store = searchParams.get('store');
    
    setTableId(table);
    setStoreSlug(store);
    setIsValid(!!table || !!store);
  }, [searchParams, isClient]);
  
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