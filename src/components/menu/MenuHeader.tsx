'use client';

import { useState, useEffect } from 'react';
import { CompactStoreHeader } from './StoreHeader';
import { useContainer } from '@/infrastructure/di';
import { User, History, LogOut, LogIn } from 'lucide-react';
import Link from 'next/link';

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
  const [profileOpen, setProfileOpen] = useState(false);
  const isAuthenticated = true; // TODO: integrar com auth real

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
      } catch {
        // Fallback final se tudo falhar
        return `Mesa ${tableId.slice(-4)}`;
      }
    };

    const fetchTableInfo = async () => {
      try {
        setIsLoadingTable(true);
        const table = await tableRepository.getTableByUuid(tableId, storeId || undefined);
        setTableName(table.identifier);
      } catch {
        console.warn('Não foi possível buscar informações da mesa, usando fallback');
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
          
          <div className="ml-6 flex flex-col gap-1">
            {/* Informações de horário de funcionamento */}
            {openingHours && (
              <p className="text-xs text-gray-600">
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
            {/* Valor mínimo do pedido - só mostra se > 0 */}
            {minOrderValue && minOrderValue > 0 && (
              <p className="text-xs text-gray-600">
                Pedido mínimo: R$ {minOrderValue.toFixed(2)}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-6">
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
          
          {/* Botão de perfil */}
          <div className="relative pl-3">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-sm transition-colors"
              aria-label="Abrir menu do perfil"
            >
              <User className="w-5 h-5" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <Link
                  href={`/${storeId}/profile`}
                  className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                  onClick={() => setProfileOpen(false)}
                >
                  <User className="w-4 h-4 text-blue-500" /> Meu Perfil
                </Link>
                <Link
                  href={`/${storeId}/orders`}
                  className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                  onClick={() => setProfileOpen(false)}
                >
                  <History className="w-4 h-4 text-amber-500" /> Histórico de Pedidos
                </Link>
                {isAuthenticated ? (
                  <button
                    className="flex items-center gap-2 w-full px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => { setProfileOpen(false); /* TODO: logout */ }}
                  >
                    <LogOut className="w-4 h-4 text-red-500" /> Sair
                  </button>
                ) : (
                  <button
                    className="flex items-center gap-2 w-full px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => { setProfileOpen(false); /* TODO: login */ }}
                  >
                    <LogIn className="w-4 h-4 text-green-500" /> Entrar
                  </button>
                )}
              </div>
            )}
          </div>
          
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