'use client';

import { useEffect, useState, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

interface WaiterCall {
  id: number;
  table_identifier: string;
  table_name: string;
  tenant_name: string;
  status: string;
  created_at: string;
  message: string;
}

export function WaiterCallNotification({ tenantId }: { tenantId: number }) {
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const echoRef = useRef<Echo | null>(null);

  useEffect(() => {
    // Inicializar o elemento de áudio
    audioRef.current = new Audio('/sounds/notification.mp3');

    // Configurar o Echo para escutar eventos
    if (!window.Echo) {
      window.Pusher = Pusher;
      window.Echo = new Echo({
        broadcaster: 'pusher',
        key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY || 'digimenukey',
        wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || window.location.hostname,
        wsPort: process.env.NEXT_PUBLIC_REVERB_PORT ? parseInt(process.env.NEXT_PUBLIC_REVERB_PORT) : 8080,
        wssPort: process.env.NEXT_PUBLIC_REVERB_PORT ? parseInt(process.env.NEXT_PUBLIC_REVERB_PORT) : 8080,
        forceTLS: false,
        disableStats: true,
        enabledTransports: ['ws', 'wss'],
      });

      echoRef.current = window.Echo;
    } else {
      echoRef.current = window.Echo;
    }

    // Escutar o canal do tenant
    const channel = echoRef.current.channel(`tenant.${tenantId}`);

    // Escutar o evento de chamada de garçom
    channel.listen('.waiter.called', (data: WaiterCall) => {
      console.log('Evento de chamada de garçom recebido:', data);
      
      // Adicionar a nova chamada à lista
      setCalls(prevCalls => [data, ...prevCalls]);
      
      // Tocar o som de notificação
      if (audioRef.current) {
        audioRef.current.play().catch(error => {
          console.error('Erro ao reproduzir som de notificação:', error);
        });
      }
      
      // Mostrar notificação toast
      toast.info(
        <div>
          <h4 className="font-bold">Chamada de Garçom</h4>
          <p>{data.message}</p>
          <p className="text-xs mt-1">
            {new Date(data.created_at).toLocaleTimeString()}
          </p>
        </div>,
        {
          position: "top-right",
          autoClose: 10000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    });
    
    // Limpar ao desmontar
    return () => {
      if (echoRef.current) {
        echoRef.current.leaveChannel(`tenant.${tenantId}`);
      }
    };
  }, [tenantId]);
  
  return (
    <>
      <ToastContainer />
      
      {/* Lista de chamadas recentes (opcional) */}
      {calls.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Chamadas Recentes</h3>
          <div className="space-y-2">
            {calls.map((call) => (
              <div 
                key={call.id} 
                className="p-3 bg-amber-50 border border-amber-200 rounded-md"
              >
                <div className="flex justify-between">
                  <span className="font-medium">Mesa {call.table_identifier}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(call.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm mt-1">{call.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Elemento de áudio para notificação sonora */}
      <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />
    </>
  );
} 