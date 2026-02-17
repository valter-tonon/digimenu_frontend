'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/hooks/useAppContext';
import { MenuHeader } from '@/components/menu';
import { StoreHeader } from '@/components/menu/StoreHeader';
import { useContainer } from '@/infrastructure/di';
import { ArrowLeft, ChevronRight, Clock, CheckCircle, AlertCircle, RotateCw } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useNavigation } from '@/hooks/useNavigation';
import { orderTrackingService, Order, OrderItem as OrderItemType, OrderItemAddon } from '@/services/orderTrackingService';
import { useCheckoutStore } from '@/store/checkout-store';
import { useCartStore } from '@/store/cart-store';
import { whatsappAuthService } from '@/services/whatsappAuth';
import { toast } from 'react-hot-toast';

const POLLING_INTERVAL = 30000; // 30 segundos

// Componente de carregamento para o Suspense
function OrdersLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando histórico de pedidos...</p>
      </div>
    </div>
  );
}

// Componente principal envolvido em Suspense
export default function OrdersPageWrapper() {
  return (
    <Suspense fallback={<OrdersLoading />}>
      <OrdersPage />
    </Suspense>
  );
}

function OrdersPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = (params?.storeId as string) || '';
  const checkoutStore = useCheckoutStore();

  // Contexto da loja
  const { data, isLoading: contextLoading, isValid } = useAppContext();
  const { menuRepository } = useContainer();
  const [tenantData, setTenantData] = useState<any>(null);
  const [tenantLoading, setTenantLoading] = useState(true);

  // Dados do contexto
  const { tableId, isDelivery, storeName } = data;

  // Hook de navegação
  const { navigateToMenu, getBreadcrumbItems, getCurrentContext } = useNavigation();

  // Estado dos pedidos
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customerPhone, setCustomerPhone] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar dados do tenant
  useEffect(() => {
    if (contextLoading || !storeId) return;

    const loadTenantData = async () => {
      try {
        setTenantLoading(true);
        const menuParams = {
          store: storeId,
          table: tableId || undefined,
          isDelivery: isDelivery
        };
        const menuData = await menuRepository.getMenu(menuParams);

        if (menuData.tenant) {
          setTenantData(menuData.tenant);
        } else {
          setTenantData({ name: storeName || storeId, logo: null });
        }
      } catch (err) {
        console.error('Erro ao carregar dados do tenant:', err);
        setTenantData({ name: storeName || storeId, logo: null });
      } finally {
        setTenantLoading(false);
      }
    };

    loadTenantData();
  }, [contextLoading, storeId, storeName, menuRepository, tableId, isDelivery]);

  // Recuperar telefone do cliente (checkout store, localStorage ou WhatsApp auth)
  useEffect(() => {
    let phone = checkoutStore.customer?.phone || localStorage.getItem('customer_phone');

    // Fallback: tentar pegar do WhatsApp auth se não encontrou
    if (!phone) {
      try {
        const storedAuth = whatsappAuthService.getStoredAuth();
        if (storedAuth?.user?.phone) {
          phone = storedAuth.user.phone;
        }
      } catch {
        // Ignora erro
      }
    }

    setCustomerPhone(phone || null);
  }, [checkoutStore.customer?.phone]);

  // Buscar pedidos do cliente
  const fetchOrders = async (phone?: string) => {
    const phoneToUse = phone || customerPhone;

    try {
      setError(null);

      if (!phoneToUse) {
        setError('Telefone do cliente não encontrado. Faça login para ver seus pedidos.');
        setOrdersLoading(false);
        return;
      }

      const fetchedOrders = await orderTrackingService.getOrdersByPhone(phoneToUse);
      setOrders(fetchedOrders);
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Erro ao buscar pedidos:', err);
      setError('Não foi possível buscar os pedidos. Tente novamente em alguns instantes.');
    } finally {
      setOrdersLoading(false);
      setIsRefreshing(false);
    }
  };

  // Polling de pedidos
  useEffect(() => {
    if (!customerPhone) {
      setOrdersLoading(false);
      return;
    }

    fetchOrders(customerPhone);

    pollingIntervalRef.current = setInterval(() => {
      fetchOrders(customerPhone);
    }, POLLING_INTERVAL);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [customerPhone]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders(customerPhone || undefined);
  };

  const handleRepeatOrder = (order: Order) => {
    if (!order.items || order.items.length === 0) {
      toast.error('Este pedido não possui itens');
      return;
    }

    // Adicionar todos os itens do pedido ao carrinho
    order.items.forEach((item) => {
      const cartItem = {
        productId: 0,
        identify: `${item.product_name}-${Date.now()}`,
        name: item.product_name,
        price: item.price,
        quantity: item.quantity,
        notes: item.comments,
        additionals: item.addons?.map((addon) => ({
          id: Math.random(),
          name: addon.name,
          price: addon.price || 0,
          quantity: addon.quantity || 1,
        })),
      };
      useCartStore.getState().addItem(cartItem);
    });

    toast.success(`Pedido repetido! ${order.items.length} item(ns) adicionado ao carrinho`);
    // Redirecionar para o menu com storeId
    router.push(`/${storeId}`);
  };

  const handleContactStore = (order: Order) => {
    const whatsappPhone = tenantData?.whatsapp_contact_phone;

    if (!whatsappPhone) {
      toast.error("Número de WhatsApp não configurado para esta loja.");
      return;
    }

    const message = `Olá! Gostaria de falar sobre o pedido #${order.identify}.`;
    const cleanPhone = whatsappPhone.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank");
  };

  // Helpers de status
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      'pendente': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'aceito': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'em_preparo': { bg: 'bg-purple-100', text: 'text-purple-800' },
      'pronto': { bg: 'bg-green-100', text: 'text-green-800' },
      'saiu_entrega': { bg: 'bg-orange-100', text: 'text-orange-800' },
      'entregue': { bg: 'bg-green-100', text: 'text-green-800' },
      'finalizado': { bg: 'bg-green-100', text: 'text-green-800' },
      'cancelado': { bg: 'bg-red-100', text: 'text-red-800' },
      'pagamento_pendente': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'pagamento_aprovado': { bg: 'bg-green-100', text: 'text-green-800' },
      'pagamento_rejeitado': { bg: 'bg-red-100', text: 'text-red-800' },
    };
    return colorMap[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'pendente': 'Pendente',
      'aceito': 'Aceito',
      'em_preparo': 'Em Preparo',
      'pronto': 'Pronto',
      'saiu_entrega': 'Saiu para Entrega',
      'entregue': 'Entregue',
      'finalizado': 'Finalizado',
      'cancelado': 'Cancelado',
      'pagamento_pendente': 'Pagamento Pendente',
      'pagamento_aprovado': 'Pagamento Aprovado',
      'pagamento_rejeitado': 'Pagamento Rejeitado',
    };
    return statusMap[status] || status;
  };

  const getTypeIcon = (type: string) => {
    const typeMap: Record<string, string> = {
      'delivery': '🚗',
      'takeout': '🏪',
      'table': '🍽️',
    };
    return typeMap[type] || '📦';
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'delivery': 'Delivery',
      'takeout': 'Retirada',
      'table': 'Mesa',
    };
    return typeMap[type] || type;
  };

  const getPaymentLabel = (method: string | undefined) => {
    if (!method) return null;
    const paymentMap: Record<string, string> = {
      'cash': 'Dinheiro',
      'dinheiro': 'Dinheiro',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'pix': 'PIX',
    };
    return paymentMap[method] || method;
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return { date: '', time: '' };
    try {
      const date = new Date(dateString);
      const formattedDate = date.toLocaleDateString('pt-BR');
      const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return { date: formattedDate, time: formattedTime };
    } catch {
      return { date: dateString, time: '' };
    }
  };

  const isCurrentOrder = (status: string) => {
    return ['pendente', 'aceito', 'em_preparo', 'pronto', 'saiu_entrega'].includes(status);
  };

  const renderOrderItem = (item: OrderItemType, index: number) => {
    const addons = [...(item.addons || []), ...(item.additionals || [])];
    return (
      <div key={index} className="flex flex-col text-sm bg-white rounded-lg p-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="font-medium text-gray-800">{item.product_name}</p>
            <p className="text-gray-500 text-xs">Qtd: {item.quantity} x R$ {item.price.toFixed(2)}</p>
            {item.comments && (
              <p className="text-gray-400 text-xs mt-0.5 italic">Obs: {item.comments}</p>
            )}
          </div>
          <span className="font-semibold text-gray-700 ml-2">R$ {(item.price * item.quantity).toFixed(2)}</span>
        </div>
        {addons.length > 0 && (
          <div className="mt-1.5 ml-3 pl-2 border-l-2 border-amber-200 space-y-0.5">
            <p className="text-xs font-semibold text-amber-700">Adicionais:</p>
            {addons.map((addon, i) => (
              <div key={i} className="flex justify-between items-center text-xs text-gray-600">
                <span>+ {addon.name}{addon.quantity && addon.quantity > 1 ? ` (x${addon.quantity})` : ''}</span>
                {addon.price != null && addon.price > 0 && (
                  <span className="text-gray-500 ml-2">R$ {Number(addon.price).toFixed(2)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (tenantLoading || contextLoading) {
    return <OrdersLoading />;
  }

  const currentOrders = orders.filter(o => isCurrentOrder(o.status));
  const pastOrders = orders.filter(o => !isCurrentOrder(o.status));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* MenuHeader da loja */}
      <div className="relative">
        <MenuHeader
          cartItemsCount={0}
          onCartClick={() => {}}
          storeName={tenantData?.name || storeName || storeId}
          storeLogo={tenantData?.logo}
          openingHours={tenantData?.opening_hours}
          minOrderValue={tenantData?.min_order_value || undefined}
          tableId={tableId}
          storeId={storeId}
        />
      </div>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-2xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-4">
            <Breadcrumb items={getBreadcrumbItems('Meus Pedidos')} />
          </div>

          {/* Título com botão voltar e refresh */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={navigateToMenu}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar ao Cardápio</span>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Meus Pedidos</h1>
                <p className="text-gray-600">Acompanhe e veja o histórico dos seus pedidos</p>
              </div>
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing || ordersLoading}
                className="p-2 text-gray-600 hover:text-amber-600 disabled:opacity-50 transition rounded-lg hover:bg-gray-100"
                title="Atualizar agora"
              >
                <RotateCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">Erro</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Loading de pedidos */}
          {ordersLoading && (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando seus pedidos...</p>
            </div>
          )}

          {/* Sem telefone (não autenticado) */}
          {!customerPhone && !ordersLoading && (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Não autenticado</h2>
              <p className="text-gray-600 mb-6">Faça login para acompanhar seus pedidos.</p>
              <button
                onClick={navigateToMenu}
                className="bg-amber-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-600"
              >
                Voltar ao Cardápio
              </button>
            </div>
          )}

          {/* Sem pedidos */}
          {customerPhone && !ordersLoading && orders.length === 0 && !error && (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Nenhum pedido encontrado</h2>
              <p className="text-gray-600 mb-6">Você ainda não fez nenhum pedido. Que tal começar agora?</p>
              <button
                onClick={navigateToMenu}
                className="bg-amber-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-600"
              >
                Ver Cardápio
              </button>
            </div>
          )}

          {/* Pedidos em Andamento */}
          {currentOrders.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Pedidos em Andamento
              </h2>

              <div className="space-y-4">
                {currentOrders.map((order) => {
                  const colors = getStatusColor(order.status);
                  const isExpanded = selectedOrder === order.identify;

                  return (
                    <div
                      key={order.identify}
                      className="bg-white rounded-lg shadow-md border-l-4 border-amber-500 overflow-hidden"
                    >
                      <button
                        onClick={() => setSelectedOrder(isExpanded ? null : order.identify)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-3xl">{getTypeIcon(order.type)}</div>
                          <div className="text-left flex-1">
                            <p className="font-bold text-gray-900">Pedido #{order.identify}</p>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>
                                {formatDateTime(order.created_at).time && (
                                  <span>{formatDateTime(order.created_at).date} às {formatDateTime(order.created_at).time}</span>
                                )}
                                {!formatDateTime(order.created_at).time && (
                                  <span>{order.date}</span>
                                )}
                              </div>
                              <div className="flex gap-3 flex-wrap">
                                <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-xs">{getTypeLabel(order.type)}</span>
                                {getPaymentLabel(order.payment_method) && (
                                  <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">{getPaymentLabel(order.payment_method)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${colors.bg} ${colors.text}`}>
                              {getStatusLabel(order.status)}
                            </p>
                            <p className="text-lg font-bold text-gray-900 mt-1">R$ {order.total.toFixed(2)}</p>
                          </div>
                          <ChevronRight className={`w-5 h-5 text-gray-400 transition ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t bg-gray-50 p-4 space-y-4">
                          {/* Status Timeline */}
                          <div className="space-y-2">
                            <p className="text-sm font-bold text-gray-900">Status</p>
                            <div className="space-y-2">
                              {['pendente', 'aceito', 'em_preparo', 'pronto', 'finalizado'].map((status, index) => {
                                const statusList = ['pendente', 'aceito', 'em_preparo', 'pronto', 'finalizado'];
                                const isCompleted = index <= statusList.indexOf(order.status);
                                const isCurrent = order.status === status;

                                return (
                                  <div key={status} className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                      isCurrent ? 'bg-amber-500 text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                                    }`}>
                                      {isCurrent ? '●' : isCompleted ? '✓' : ''}
                                    </div>
                                    <span className={`text-sm ${isCurrent ? 'font-bold text-amber-600' : isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
                                      {getStatusLabel(status)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Items */}
                          {order.items && order.items.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-bold text-gray-900">Itens</p>
                              <div className="space-y-2">
                                {order.items.map((item, index) => renderOrderItem(item, index))}
                              </div>
                            </div>
                          )}

                          {/* Botões de Ação */}
                          <div className="flex flex-col gap-2 mt-4">
                            {(order.status === 'entregue' || order.status === 'finalizado') && (
                              <button
                                onClick={() => handleRepeatOrder(order)}
                                className="w-full border border-amber-500 text-amber-600 px-3 py-2 rounded text-xs font-medium hover:bg-amber-50"
                              >
                                Repetir Pedido
                              </button>
                            )}
                            {order.status !== 'entregue' && order.status !== 'finalizado' && (
                              <button
                                onClick={() => handleContactStore(order)}
                                className="w-full border border-green-500 text-green-600 px-3 py-2 rounded text-xs font-medium hover:bg-green-50"
                              >
                                Contatar Loja
                              </button>
                            )}
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pedidos Anteriores */}
          {pastOrders.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-gray-400" />
                Pedidos Anteriores
              </h2>

              <div className="space-y-2">
                {pastOrders.map((order) => {
                  const colors = getStatusColor(order.status);
                  const isExpanded = selectedOrder === order.identify;

                  return (
                    <div
                      key={order.identify}
                      className="bg-white rounded-lg shadow-sm hover:shadow-md transition"
                    >
                      <button
                        onClick={() => setSelectedOrder(isExpanded ? null : order.identify)}
                        className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-4 flex-1 text-sm">
                          <div className="text-2xl">{getTypeIcon(order.type)}</div>
                          <div className="text-left flex-1">
                            <p className="font-bold text-gray-900">#{order.identify}</p>
                            <div className="text-gray-600 space-y-1">
                              <div>
                                {formatDateTime(order.created_at).time && (
                                  <span>{formatDateTime(order.created_at).date} às {formatDateTime(order.created_at).time}</span>
                                )}
                                {!formatDateTime(order.created_at).time && (
                                  <span>{order.date}</span>
                                )}
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                <span className="inline-block px-1.5 py-0.5 bg-gray-100 rounded text-xs">{getTypeLabel(order.type)}</span>
                                {getPaymentLabel(order.payment_method) && (
                                  <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">{getPaymentLabel(order.payment_method)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${colors.bg} ${colors.text}`}>
                            {getStatusLabel(order.status)}
                          </span>
                          <span className="font-bold text-gray-900">R$ {order.total.toFixed(2)}</span>
                          <ChevronRight className={`w-4 h-4 text-gray-400 transition ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t bg-gray-50 p-3 space-y-2 text-sm">
                          {order.items?.map((item, index) => renderOrderItem(item, index))}
                          <button
                            onClick={() => handleRepeatOrder(order)}
                            className="w-full mt-2 border border-amber-500 text-amber-600 px-3 py-1 rounded text-xs font-medium hover:bg-amber-50"
                          >
                            Repetir Pedido
                          </button>
                          {order.status !== 'entregue' && order.status !== 'finalizado' && (
                            <button
                              onClick={() => handleContactStore(order)}
                              className="w-full mt-1 border border-green-500 text-green-600 px-3 py-1 rounded text-xs font-medium hover:bg-green-50"
                            >
                              Contatar Loja
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA para fazer novo pedido */}
          {orders.length > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={navigateToMenu}
                className="bg-amber-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-amber-600 transition-colors"
              >
                Fazer Novo Pedido
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <StoreHeader
                storeName={tenantData?.name || storeName || storeId}
                storeLogo={tenantData?.logo}
                className="text-white"
              />
            </div>
            <div className="flex flex-col items-center md:items-end">
              <div className="flex flex-col items-center">
                <div className="flex items-center mb-2">
                  <img
                    src="/logo-digimenu.svg"
                    alt="DigiMenu"
                    className="h-8 w-auto"
                  />
                </div>
                <p className="text-sm text-gray-400">© {new Date().getFullYear()} Todos os direitos reservados</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
