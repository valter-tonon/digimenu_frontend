'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart-store';
import { useStoreStatus } from '@/infrastructure/context/StoreStatusContext';
import { Loader2 } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);

  const storeId = params?.storeId as string;
  const tableId = params?.tableId as string;

  // Cart store
  const {
    items,
    totalPrice,
    totalItems,
    removeItem,
    updateItem,
    clearCart,
    setContext
  } = useCartStore();

  // Store status com fallback seguro
  const storeStatus = useStoreStatus();
  const isStoreOpen = storeStatus?.isStoreOpen ?? true;
  
  // Simular carregamento inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Configura o contexto ao carregar a página
  useEffect(() => {
    if (storeId && tableId) {
      setContext(storeId, tableId);
    }
  }, [storeId, tableId, setContext]);

  // Formatação de preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleQuantityChange = (id: number, currentQuantity: number, change: number) => {
    const newQuantity = Math.max(1, currentQuantity + change);
    updateItem(id, { quantity: newQuantity });
  };

  const handleSubmitOrder = () => {
    if (items.length === 0) {
      alert('Adicione itens ao carrinho para fazer um pedido');
      return;
    }

    if (!isStoreOpen) {
      alert('Restaurante fechado. Não é possível finalizar pedidos no momento.');
      return;
    }

    // Redirecionar para o checkout apropriado baseado no tipo de pedido
    if (tableId) {
      // Pedido de mesa: redireciona para checkout-table
      router.push('/checkout-table');
    } else {
      // Pedido de delivery/retirada: redireciona para checkout-delivery
      router.push('/checkout-delivery');
    }
  };

  if (!storeId || !tableId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Parâmetros inválidos</h1>
          <p className="text-gray-600">Store ID ou Table ID não encontrados.</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-4">
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            >
              ← Voltar
            </button>
            <h1 className="text-2xl font-bold">Carrinho</h1>
          </div>

          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Carrinho vazio</h2>
            <p className="text-gray-600 mb-6">Adicione alguns itens ao seu carrinho para começar.</p>
            <button
              onClick={() => router.push(`/${storeId}/${tableId}`)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ver cardápio
            </button>
          </div>
        </div>
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
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold">Carrinho</h1>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Lista de itens */}
          <ul className="divide-y divide-gray-200">
            {items.map((item) => (
              <li key={item.id} className="p-4">
                <div className="flex items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                    {item.notes && (
                      <p className="text-sm text-gray-500 mt-1">Obs: {item.notes}</p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center">
                        <button
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-l-md"
                          onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                        >
                          -
                        </button>
                        <span className="w-8 h-8 flex items-center justify-center bg-gray-50">
                          {item.quantity}
                        </span>
                        <button
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-r-md"
                          onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                        >
                          +
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
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Resumo do pedido */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex justify-between mb-2">
              <span>Itens ({totalItems()})</span>
              <span>{formatPrice(totalPrice())}</span>
            </div>

            <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
              <span>Total</span>
              <span>{formatPrice(totalPrice())}</span>
            </div>
          </div>

          {/* Botão de finalização */}
          <div className="p-4 border-t">
            <button
              className={`w-full py-3 rounded-md font-medium flex items-center justify-center transition-colors ${isStoreOpen
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-400 text-white cursor-not-allowed'
                }`}
              onClick={handleSubmitOrder}
              disabled={!isStoreOpen}
            >
              {isStoreOpen ? 'Finalizar pedido' : 'Restaurante Fechado'}
            </button>

            <button
              className="w-full mt-2 py-2 text-gray-500 flex items-center justify-center"
              onClick={() => router.push(`/${storeId}/${tableId}`)}
            >
              Continuar comprando
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 