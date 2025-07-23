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

  const handleSubmitOrder = async () => {
    // Verificar se o carrinho tem itens
    if (items.length === 0) {
      toast.error('Adicione itens ao carrinho para fazer um pedido');
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

  return (
    <div className="container mx-auto p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6">Seu carrinho</h1>
      
      {/* Alternância entre Local e Delivery */}
      <div className="bg-white rounded-lg shadow mb-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium">Tipo de pedido</h2>
            <p className="text-sm text-gray-500">
              {deliveryMode ? 'Entrega em seu endereço' : 'Retirada no local'}
            </p>
          </div>
          
          <div className="flex items-center">
            <span className={`px-4 py-2 rounded-l-md ${!deliveryMode ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>
              Local
            </span>
            <button
              className={`px-4 py-2 rounded-r-md ${deliveryMode ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={handleDeliveryModeToggle}
            >
              Delivery
            </button>
          </div>
        </div>
        
        {deliveryMode && isAuthenticated && customer && (
          <div className="mt-3 pt-3 border-t flex items-center justify-between">
            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-primary mr-2 mt-0.5" />
              <div>
                <p className="font-medium">{customer.name}</p>
                <p className="text-sm text-gray-600">
                  {customer.addresses && customer.addresses.length > 0
                    ? customer.addresses[0].address
                    : 'Nenhum endereço cadastrado'}
                </p>
              </div>
            </div>
            <button 
              className="text-primary"
              onClick={() => router.push(`/${storeId}/${tableId}/profile/addresses`)}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
      
      {/* Itens do carrinho */}
      {items.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="mb-4">Seu carrinho está vazio</p>
          <button
            className="bg-primary text-white py-2 px-4 rounded-md"
            onClick={() => router.push(`/${storeId}/${tableId}`)}
          >
            Ver cardápio
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <li key={item.id} className="p-4">
                <div className="flex items-center">
                  {item.image && (
                    <div className="w-16 h-16 relative rounded overflow-hidden mr-3">
                      <Image
                        src={item.image}
                        alt={item.name}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    {item.notes && (
                      <p className="text-sm text-gray-500">{item.notes}</p>
                    )}
                    
                    {/* Adicionais */}
                    {item.additionals && item.additionals.length > 0 && (
                      <ul className="mt-1">
                        {item.additionals.map((add) => (
                          <li key={add.id} className="text-xs text-gray-500 flex justify-between">
                            <span>{add.quantity}x {add.name}</span>
                            <span>{formatPrice(add.price * add.quantity)}</span>
                          </li>
                        ))}
                      </ul>
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
                className="w-full py-3 bg-primary text-white rounded-md font-medium flex items-center justify-center"
                onClick={handleSubmitOrder}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Finalizar pedido'
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Identificação necessária</h2>
            <p className="mb-4">
              Para pedidos de delivery, é necessário fazer login para identificarmos seu endereço de entrega.
            </p>
            <div className="flex space-x-3">
              <button
                className="flex-1 py-2 border border-gray-300 rounded-md"
                onClick={() => setShowLoginModal(false)}
              >
                Cancelar
              </button>
              <button
                className="flex-1 py-2 bg-primary text-white rounded-md"
                onClick={() => router.push(`/${storeId}/${tableId}/login?redirect=cart`)}
              >
                Fazer login
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