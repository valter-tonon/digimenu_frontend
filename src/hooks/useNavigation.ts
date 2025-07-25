import { useRouter } from 'next/navigation';
import { useAppContext } from './useAppContext';

export function useNavigation() {
  const router = useRouter();
  const { data } = useAppContext();
  const { storeId, tableId, isDelivery } = data;

  // Navegar para o menu mantendo o contexto
  const navigateToMenu = () => {
    if (tableId) {
      // Se tem mesa, ir para o menu da mesa
      router.push(`/${storeId}/${tableId}`);
    } else if (isDelivery) {
      // Se é delivery, ir para o menu de delivery
      router.push(`/${storeId}`);
    } else {
      // Fallback para o menu geral
      router.push(`/${storeId}`);
    }
  };

  // Navegar para o perfil mantendo o contexto
  const navigateToProfile = () => {
    router.push(`/${storeId}/profile`);
  };

  // Navegar para o histórico de pedidos mantendo o contexto
  const navigateToOrders = () => {
    router.push(`/${storeId}/orders`);
  };

  // Navegar para o checkout mantendo o contexto
  const navigateToCheckout = () => {
    if (tableId) {
      router.push(`/${storeId}/${tableId}/checkout`);
    } else {
      router.push(`/${storeId}/checkout`);
    }
  };

  // Gerar breadcrumb items baseado no contexto atual
  const getBreadcrumbItems = (currentPage: string) => {
    const items = [
      {
        label: 'Cardápio',
        href: tableId ? `/${storeId}/${tableId}` : `/${storeId}`
      }
    ];

    if (currentPage !== 'menu') {
      items.push({
        label: currentPage,
        current: true
      });
    }

    return items;
  };

  // Verificar se está no contexto de mesa
  const isTableContext = () => {
    return !!tableId;
  };

  // Verificar se está no contexto de delivery
  const isDeliveryContext = () => {
    return isDelivery;
  };

  // Obter o contexto atual como string
  const getCurrentContext = () => {
    if (tableId) {
      return `Mesa ${tableId.slice(-4)}`;
    } else if (isDelivery) {
      return 'Delivery';
    } else {
      return 'Presencial';
    }
  };

  return {
    // Navegação
    navigateToMenu,
    navigateToProfile,
    navigateToOrders,
    navigateToCheckout,
    
    // Contexto
    isTableContext,
    isDeliveryContext,
    getCurrentContext,
    
    // Breadcrumb
    getBreadcrumbItems,
    
    // Dados do contexto
    storeId,
    tableId,
    isDelivery
  };
} 