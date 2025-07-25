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

export function WaiterCallButton({ storeId, tableId, className = '' }: WaiterCallButtonProps) {
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

  return (
    <button
      onClick={handleCallWaiter}
      disabled={isCalling}
      className={`p-3 rounded-full shadow-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title="Chamar garçom"
      aria-label="Chamar garçom"
    >
      {isCalling ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <Bell className="h-6 w-6" />
      )}
    </button>
  );
} 