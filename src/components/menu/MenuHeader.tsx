'use client';

import { useState, useEffect } from 'react';
import { CompactStoreHeader } from './StoreHeader';
import { useContainer } from '@/infrastructure/di';

interface MenuHeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
  storeName?: string;
  storeLogo?: string;
  openingHours?: {
    opens_at: string;
    closes_at: string;
    is_open: boolean;
  };
  minOrderValue?: number;
  tableId?: string | null;
  storeId?: string | null;
}

export function MenuHeader({ 
  cartItemsCount, 
  onCartClick, 
  storeName: propStoreName,
  storeLogo: propStoreLogo,
  openingHours,
  minOrderValue,
  tableId,
  storeId
}: MenuHeaderProps) {
  const { tableRepository } = useContainer();
  const [tableName, setTableName] = useState<string | null>(null);
  const [isLoadingTable, setIsLoadingTable] = useState(false);
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const [waiterCalled, setWaiterCalled] = useState(false);

  // Buscar informações da mesa quando tableId estiver disponível
  useEffect(() => {
    if (!tableId) {
      setTableName(null);
      return;
    }

    const generateTableName = () => {
      try {
        // Extrair um número mais legível do UUID
        const uuidParts = tableId.split('-');
        const lastPart = uuidParts[uuidParts.length - 1];
        const tableNumber = parseInt(lastPart.slice(0, 4), 16) % 100; // Converter para número e limitar a 2 dígitos
        return `Mesa ${tableNumber}`;
      } catch (error) {
        // Fallback final se tudo falhar
        return `Mesa ${tableId.slice(-4)}`;
      }
    };

    const fetchTableInfo = async () => {
      try {
        setIsLoadingTable(true);
        const table = await tableRepository.getTableByUuid(tableId, storeId || undefined);
        setTableName(table.identifier);
      } catch (error) {
        console.warn('Não foi possível buscar informações da mesa, usando fallback:', error);
        setTableName(generateTableName());
      } finally {
        setIsLoadingTable(false);
      }
    };

    fetchTableInfo();
  }, [tableId, storeId, tableRepository]);

  const handleCartClick = () => {
    onCartClick();
  };

  const callWaiter = async () => {
    try {
      setIsCallingWaiter(true);
      
      // TODO: Implementar chamada real à API
      // await apiClient.post('/waiter-calls', { table_id: tableId });
      
      // Simular chamada
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setWaiterCalled(true);
      
      // Resetar após 30 segundos
      setTimeout(() => {
        setWaiterCalled(false);
      }, 30000);
    } catch (error) {
      console.error('Erro ao chamar garçom:', error);
    } finally {
      setIsCallingWaiter(false);
    }
  };
  
  return (
    <header className="w-full sticky-header py-4 px-4 sticky top-0 z-header">
      <div className="w-full flex justify-between items-center">
        <div className="flex items-center flex-1">
          <CompactStoreHeader 
            storeName={propStoreName || 'Restaurante'}
            storeLogo={propStoreLogo}
            className="flex-1"
          />
          
          <div className="ml-4">
            <p className="text-xs text-gray-500">Cardápio Digital</p>
            
            {/* Informações de horário de funcionamento */}
            {openingHours && (
              <p className="text-xs text-gray-600 mt-1">
                {openingHours.is_open ? (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    <span>Aberto • Fecha às {openingHours.closes_at}</span>
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                    <span>Fechado • Abre às {openingHours.opens_at}</span>
                  </span>
                )}
              </p>
            )}
            
            {/* Valor mínimo do pedido */}
            {minOrderValue && minOrderValue > 0 && (
              <p className="text-xs text-gray-600">
                Pedido mínimo: R$ {minOrderValue.toFixed(2)}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Botão de chamar garçom */}
          {tableId && (
            <button
              onClick={callWaiter}
              disabled={isCallingWaiter || waiterCalled}
              className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                waiterCalled 
                  ? 'bg-green-500 text-white' 
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              {isCallingWaiter ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              )}
              <span>{waiterCalled ? 'Garçom chamado' : 'Chamar Garçom'}</span>
            </button>
          )}
          
          {/* Botão do carrinho */}
          <button 
            onClick={handleCartClick}
            className="relative p-2 text-gray-600 hover:text-amber-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            
            {cartItemsCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-amber-500 rounded-full">
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Informações da mesa */}
      {tableId && (
        <div className="mt-2 flex items-center text-xs text-gray-500">
          <div className="bg-gray-100 px-2 py-1 rounded-md">
            {isLoadingTable ? (
              <span className="flex items-center">
                <div className="h-3 w-3 border border-gray-400 border-t-transparent rounded-full animate-spin mr-1"></div>
                Carregando...
              </span>
            ) : (
              <span>Mesa: {tableName || `Mesa ${tableId.slice(-4)}`}</span>
            )}
          </div>
        </div>
      )}
    </header>
  );
} 