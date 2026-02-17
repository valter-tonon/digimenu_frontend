'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Clock, CheckCircle, AlertCircle, MapPin, Phone, Home, RotateCw } from 'lucide-react';
import { orderTrackingService, Order, OrderItem as OrderItemType } from '@/services/orderTrackingService';
import { useCheckoutStore } from '@/store/checkout-store';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'react-hot-toast';

const POLLING_INTERVAL = 30000; // 30 segundos

export default function MyOrdersPage() {
  const router = useRouter();
  const checkoutStore = useCheckoutStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customerPhone, setCustomerPhone] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Recuperar telefone do cliente (do store ou localStorage)
   */
  useEffect(() => {
    const phone = checkoutStore.customer?.phone || localStorage.getItem('customer_phone');
    setCustomerPhone(phone || null);
  }, [checkoutStore.customer?.phone]);

  /**
   * Buscar pedidos do cliente
   */
  const fetchOrders = async (phone?: string) => {
    const phoneToUse = phone || customerPhone;

    try {
      setError(null);

      if (!phoneToUse) {
        setError('Telefone do cliente não encontrado. Por favor, faça um pedido primeiro.');
        setLoading(false);
        return;
      }

      console.log('🔄 Buscando pedidos para telefone:', phoneToUse);
      const fetchedOrders = await orderTrackingService.getOrdersByPhone(phoneToUse);
      setOrders(fetchedOrders);
      setLastUpdate(new Date());
      console.log('📦 Pedidos atualizados:', fetchedOrders.length, 'pedidos encontrados');
    } catch (err: any) {
      console.error('❌ Erro ao buscar pedidos:', err);
      setError('Não foi possível buscar os pedidos. Tente novamente em alguns instantes.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  /**
   * Inicializar polling - quando customerPhone estiver definido
   */
  useEffect(() => {
    if (!customerPhone) return;

    // Buscar pedidos na primeira carga
    fetchOrders(customerPhone);

    // Configurar polling a cada 30 segundos
    pollingIntervalRef.current = setInterval(() => {
      console.log('🔄 Atualizando pedidos (polling)...');
      fetchOrders(customerPhone);
    }, POLLING_INTERVAL);

    // Limpar intervalo ao desmontar
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [customerPhone]);

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
      'pendente': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳' },
      'aceito': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '✓' },
      'em_preparo': { bg: 'bg-purple-100', text: 'text-purple-800', icon: '👨‍🍳' },
      'pronto': { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' },
      'saiu_entrega': { bg: 'bg-orange-100', text: 'text-orange-800', icon: '🚗' },
      'entregue': { bg: 'bg-green-100', text: 'text-green-800', icon: '✓' },
      'finalizado': { bg: 'bg-green-100', text: 'text-green-800', icon: '✓' },
      'cancelado': { bg: 'bg-red-100', text: 'text-red-800', icon: '✗' },
      'pagamento_pendente': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '💳' },
      'pagamento_aprovado': { bg: 'bg-green-100', text: 'text-green-800', icon: '✓' },
      'pagamento_rejeitado': { bg: 'bg-red-100', text: 'text-red-800', icon: '✗' },
    };
    return colorMap[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: '•' };
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

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders(customerPhone || undefined);
  };

  const handleRepeatOrder = (order: Order) => {
    if (!order.items || order.items.length === 0) {
      toast.error('Este pedido não possui itens');
      return;
    }

    // Obter storeId do pedido, checkoutStore ou localStorage
    const storeId = order.storeId || checkoutStore.storeId || localStorage.getItem('digimenu_store_id');

    // Adicionar todos os itens do pedido ao carrinho
    order.items.forEach((item) => {
      const cartItem = {
        productId: 0, // Será definido pela API/menu se necessário
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
    router.push(storeId ? `/${storeId}` : '/');
  };

  if (!customerPhone && loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!customerPhone) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto p-4">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Não autenticado</h2>
            <p className="text-gray-600 mb-6">Você precisa fazer um pedido para acompanhar seus pedidos.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-amber-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-600"
            >
              Fazer um Pedido
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando seus pedidos...</p>
        </div>
      </div>
    );
  }

  const currentOrders = orders.filter(o => isCurrentOrder(o.status));
  const pastOrders = orders.filter(o => !isCurrentOrder(o.status));

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="text-amber-600 hover:text-amber-700"
              >
                ←
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Meus Pedidos</h1>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-600 hover:text-amber-600 disabled:opacity-50 transition"
              title="Atualizar agora"
            >
              <RotateCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {lastUpdate && (
            <p className="text-xs text-gray-500 text-right">
              Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Erro</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Nenhum pedido encontrado</h2>
            <p className="text-gray-600 mb-6">Você ainda não fez nenhum pedido. Que tal começar agora?</p>
            <button
              onClick={() => router.push('/')}
              className="bg-amber-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-600"
            >
              Ver Menu
            </button>
          </div>
        ) : (
          <>
            {/* Current Orders Section */}
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
                        {/* Order Header */}
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

                        {/* Order Details */}
                        {isExpanded && (
                          <div className="border-t bg-gray-50 p-4 space-y-4">
                            {/* Status Timeline */}
                            <div className="space-y-2">
                              <p className="text-sm font-bold text-gray-900">Status</p>
                              <div className="space-y-2">
                                {['pendente', 'aceito', 'em_preparo', 'pronto', 'finalizado'].map((status, index) => {
                                  const isActive = ['pendente', 'aceito', 'em_preparo', 'pronto'].includes(order.status);
                                  const isCompleted = ['aceito', 'em_preparo', 'pronto', 'finalizado'].includes(order.status) && index <= ['pendente', 'aceito', 'em_preparo', 'pronto', 'finalizado'].indexOf(order.status);
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
                            <div className="space-y-2">
                              <p className="text-sm font-bold text-gray-900">Itens</p>
                              <div className="space-y-2">
                                {order.items?.map((item, index) => renderOrderItem(item, index))}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-2">
                              <button className="w-full bg-amber-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-600 text-sm">
                                Rastrear Pedido
                              </button>
                              <a
                                href="https://wa.me/551140000000"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full block text-center border border-amber-500 text-amber-600 px-4 py-2 rounded-lg font-medium hover:bg-amber-50 text-sm"
                              >
                                Contatar Restaurante
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Past Orders Section */}
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
                        {/* Order Header */}
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

                        {/* Order Details */}
                        {isExpanded && (
                          <div className="border-t bg-gray-50 p-3 space-y-2 text-sm">
                            {order.items?.map((item, index) => renderOrderItem(item, index))}
                            <button
                              onClick={() => handleRepeatOrder(order)}
                              className="w-full mt-2 border border-amber-500 text-amber-600 px-3 py-1 rounded text-xs font-medium hover:bg-amber-50"
                            >
                              Repetir Pedido
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer CTA */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="bg-amber-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-amber-600"
          >
            Fazer Novo Pedido
          </button>
        </div>
      </div>
    </div>
  );
}
