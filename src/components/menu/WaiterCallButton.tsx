'use client';

import { useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { callWaiter } from '@/services/api';
import { toast } from 'react-hot-toast';

interface WaiterCallButtonProps {
  storeId: string;
  tableId: string;
  className?: string;
}

interface WaiterCallButtonVariant {
  variant?: 'floating' | 'header' | 'compact';
}

export function WaiterCallButton({ 
  storeId, 
  tableId, 
  className = '', 
  variant = 'floating' 
}: WaiterCallButtonProps & WaiterCallButtonVariant) {
  const [isCalling, setIsCalling] = useState(false);

  const handleCallWaiter = async () => {
    if (isCalling) return;

    setIsCalling(true);
    
    try {
      const data = {
        store_id: storeId,
        table_id: tableId,
        message: 'Chamada de garçom solicitada'
      };

      await callWaiter(data);
      
      toast.success('Garçom chamado! Ele estará na sua mesa em breve.', {
        duration: 4000,
        icon: '🛎️',
      });
      
    } catch (error) {
      console.error('Erro ao chamar garçom:', error);
      toast.error('Não foi possível chamar o garçom. Tente novamente.', {
        duration: 4000,
      });
    } finally {
      setIsCalling(false);
    }
  };

  // Estilos baseados na variante
  const getButtonStyles = () => {
    switch (variant) {
      case 'header':
        return `px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium ${className}`;
      
      case 'compact':
        return `p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${className}`;
      
      case 'floating':
      default:
        return `p-3 rounded-full shadow-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${className}`;
    }
  };

  const getIconSize = () => {
    switch (variant) {
      case 'header':
        return 'h-4 w-4';
      case 'compact':
        return 'h-5 w-5';
      case 'floating':
      default:
        return 'h-6 w-6';
    }
  };

  return (
    <button
      onClick={handleCallWaiter}
      disabled={isCalling}
      className={getButtonStyles()}
      title="Chamar garçom"
      aria-label="Chamar garçom"
    >
      {isCalling ? (
        <Loader2 className={`${getIconSize()} animate-spin`} />
      ) : (
        <Bell className={getIconSize()} />
      )}
      {variant === 'header' && (
        <span className="hidden sm:inline">
          {isCalling ? 'Chamando...' : 'Chamar Garçom'}
        </span>
      )}
    </button>
  );
} 