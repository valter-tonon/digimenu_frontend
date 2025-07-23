import { useEffect, useState } from 'react';
import { useUserTracking as useTrackingService } from '@/services/userTracking';

export interface UserTrackingInfo {
  userId: string | null;
  source: string | null;
  firstVisit: Date | null;
  lastVisit: Date | null;
  isOptedOut: boolean;
  isNewUser: boolean;
}

export function useUserTracking(): UserTrackingInfo & {
  initializeTracking: () => string;
  associateWithOrder: (orderId: string) => void;
  optOut: () => void;
} {
  const trackingService = useTrackingService();
  const [trackingInfo, setTrackingInfo] = useState<UserTrackingInfo>({
    userId: null,
    source: null,
    firstVisit: null,
    lastVisit: null,
    isOptedOut: false,
    isNewUser: false
  });

  // Atualizar informações de rastreamento
  const updateTrackingInfo = () => {
    const userId = trackingService.getUserId();
    const source = trackingService.getSource();
    const firstVisit = trackingService.getFirstVisit();
    const lastVisit = trackingService.getLastVisit();
    const isOptedOut = trackingService.isOptedOut();
    
    // Determinar se é um novo usuário (primeira visita foi hoje)
    const isNewUser = firstVisit ? 
      new Date().toDateString() === firstVisit.toDateString() : false;

    setTrackingInfo({
      userId,
      source,
      firstVisit,
      lastVisit,
      isOptedOut,
      isNewUser
    });
  };

  // Inicializar rastreamento
  const initializeTracking = (): string => {
    const userId = trackingService.trackUser();
    updateTrackingInfo();
    return userId;
  };

  // Associar usuário com pedido (para histórico)
  const associateWithOrder = (orderId: string) => {
    if (!trackingInfo.isOptedOut && trackingInfo.userId) {
      // Aqui você pode implementar a lógica para associar o pedido ao usuário
      // Por exemplo, salvar no localStorage ou enviar para o backend
      const orderHistory = JSON.parse(localStorage.getItem('user_order_history') || '[]');
      orderHistory.push({
        orderId,
        userId: trackingInfo.userId,
        timestamp: new Date().toISOString(),
        source: trackingInfo.source
      });
      localStorage.setItem('user_order_history', JSON.stringify(orderHistory));
    }
  };

  // Opt-out do rastreamento
  const optOut = () => {
    trackingService.optOut();
    updateTrackingInfo();
    
    // Limpar histórico de pedidos também
    localStorage.removeItem('user_order_history');
  };

  // Inicializar ao montar o componente
  useEffect(() => {
    updateTrackingInfo();
    
    // Atualizar última visita se não optou por sair
    if (!trackingService.isOptedOut()) {
      trackingService.updateLastVisit();
    }
  }, []);

  return {
    ...trackingInfo,
    initializeTracking,
    associateWithOrder,
    optOut
  };
}