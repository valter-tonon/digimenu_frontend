'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCartStore } from '@/store/cart-store';
import { useAuth } from '@/hooks/use-auth';
import { useUserTracking } from '@/hooks/useUserTracking';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { createOrder } from '@/services/api';
import { toast } from 'react-hot-toast';
import { Trash2, Plus, Minus, MapPin, ChevronRight, Loader2 } from 'lucide-react';
import { useStoreStatus } from '@/infrastructure/context/StoreStatusContext';

export default function CartPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, customer } = useAuth();
  const { userId, source, initializeTracking, associateWithOrder } = useUserTracking();
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const storeId = params.storeId as string;
  const tableId = params.tableId as string;
  
  // Cart store
  const { 
    items, 
    totalPrice, 
    totalItems, 
    removeItem, 
    updateItem, 
    clearCart,
    deliveryMode,
    setDeliveryMode,
    setContext
  } = useCartStore();

  // Configura o contexto ao carregar a página
  useEffect(() => {
    setContext(storeId, tableId);
  }, [storeId, tableId, setContext]);

  // Formatação de preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleDeliveryModeToggle = () => {
    const newMode = !deliveryMode;
    setDeliveryMode(newMode);
    
    // Se estiver mudando para delivery e não estiver autenticado, mostra modal de login
    if (newMode && !isAuthenticated) {
      setShowLoginModal(true);
    }
  };

  const handleQuantityChange = (id: number, currentQuantity: number, change: number) => {
    const newQuantity = Math.max(1, currentQuantity + change);
    updateItem(id, { quantity: newQuantity });
  };

  const { isStoreOpen } = useStoreStatus();

  const handleSubmitOrder = async () => {
    // Verificar se o carrinho tem itens
    if (items.length === 0) {
      toast.error('Adicione itens ao carrinho para fazer um pedido');
      return;
    }

    // Verificar se o restaurante está aberto
    if (!isStoreOpen) {
      toast.error('Restaurante fechado. Não é possível finalizar pedidos no momento.');
      return;
    }
    
    // Verificar se o usuário está autenticado quando for delivery
    if (deliveryMode && !isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    setSubmitting(true);
    
    try {
      const orderData = {
        token_company: storeId,
        table: !deliveryMode ? tableId : undefined,
        products: items.map(item => ({
          identify: item.identify,
          quantity: item.quantity,
          notes: item.notes,
          additionals: item.additionals?.map(add => ({
            id: add.id,
            quantity: add.quantity
          }))
        })),
        comment,
        type: deliveryMode ? 'delivery' : 'local',
        customer_id: customer?.id,
        // Dados de rastreamento do usuário
        user_tracking: {
          user_id: userId,
          source: source,
          device_id: userId // Usando userId como deviceId por simplicidade
        }
      };
      
      const response = await createOrder(orderData);
      
      // Associar pedido ao histórico do usuário
      if (response.data?.identify) {
        associateWithOrder(response.data.identify);
      }
      
      toast.success('Pedido realizado com sucesso!');
      clearCart();
      
      // Redirecionar para página de sucesso ou de detalhes do pedido
      router.push(`/${storeId}/${tableId}/orders/${response.data.identify}`);
    } catch (error) {
      console.error('Erro ao enviar pedido:', error);
      toast.error('Não foi possível realizar o pedido. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Inicializar rastreamento do usuário
  useEffect(() => {
    initializeTracking();
  }, [initializeTracking]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-4">
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="w-6 h-6 rotate-180" />
            </button>
            <h1 className="text-2xl font-bold">Carrinho</h1>
          </div>
          
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Carrinho vazio</h2>
            <p className="text-gray-600 mb-6">Adicione alguns itens ao seu carrinho para começar.</p>
            <button
              onClick={() => router.push(`/${storeId}/${tableId}`)}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Ver cardápio
            </button>
          </div>
        </div>
        <BottomNavigation storeId={storeId} tableId={tableId} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <h1 className="text-2xl font-bold">Carrinho</h1>
        </div>
        

        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Lista de itens */}
          <ul className="divide-y divide-gray-200">
            {items.map((item) => (
              <li key={item.id} className="p-4">
                <div className="flex items-start">
                  {item.image && (
                    <div className="flex-shrink-0 mr-4">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                    {item.notes && (
                      <p className="text-sm text-gray-500 mt-1">Obs: {item.notes}</p>
                    )}
                    {item.additionals && item.additionals.length > 0 && (
                      <div className="mt-1">
                        <p className="text-sm text-gray-500">Adicionais:</p>
                        <ul className="text-sm text-gray-600">
                          {item.additionals.map((add, index) => (
                            <li key={index}>• {add.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center">
                        <button
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-l-md"
                          onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 h-8 flex items-center justify-center bg-gray-50">
                          {item.quantity}
                        </span>
                        <button
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-r-md"
                          onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="font-medium mr-3">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        <button
                          className="text-red-500"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          {/* Observações do pedido */}
          <div className="p-4 border-t">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
              Observações do pedido
            </label>
            <textarea
              id="comment"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Alguma observação? Ex: sem cebola, bem passado, etc."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>
          </div>
          
          {/* Resumo do pedido */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex justify-between mb-2">
              <span>Itens ({totalItems()})</span>
              <span>{formatPrice(totalPrice())}</span>
            </div>
            
            {/* Poderia adicionar taxas, descontos etc aqui */}
            
            <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
              <span>Total</span>
              <span>{formatPrice(totalPrice())}</span>
            </div>
          </div>
          
          {/* Botão de finalização */}
          <div className="p-4 border-t">
            {deliveryMode ? (
              <button
                className="w-full py-3 bg-primary text-white rounded-md font-medium flex items-center justify-center"
                onClick={() => router.push(`/${storeId}/checkout`)}
              >
                Ir para Checkout
              </button>
            ) : (
              <button
                className={`w-full py-3 rounded-md font-medium flex items-center justify-center transition-colors ${
                  isStoreOpen 
                    ? 'bg-primary text-white hover:bg-primary-dark' 
                    : 'bg-gray-400 text-white cursor-not-allowed'
                }`}
                onClick={handleSubmitOrder}
                disabled={submitting || !isStoreOpen}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  isStoreOpen ? 'Finalizar pedido' : 'Restaurante Fechado'
                )}
              </button>
            )}
            
            <button
              className="w-full mt-2 py-2 text-gray-500 flex items-center justify-center"
              onClick={() => router.push(`/${storeId}/${tableId}`)}
            >
              Continuar comprando
            </button>
          </div>
        </div>
      )}
      
      {/* Modal de login para delivery */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Login necessário</h3>
            <p className="text-gray-600 mb-4">
              Para fazer pedidos de delivery, você precisa estar logado.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLoginModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  router.push(`/${storeId}/login?redirect=checkout`);
                }}
                className="flex-1 py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-dark"
              >
                Fazer Login
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="h-16"></div>
      <BottomNavigation storeId={storeId} tableId={tableId} />
    </div>
  );
} 