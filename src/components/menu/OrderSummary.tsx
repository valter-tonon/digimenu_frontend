'use client';

import { useState } from 'react';
import { useMenu } from '@/infrastructure/context/MenuContext';

interface OrderSummaryProps {
  onClose: () => void;
  isDelivery?: boolean;
  isStoreOpen?: boolean;
  minOrderValue?: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  categoryName?: string;
  observation?: string;
  additionals?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

export function OrderSummary({ onClose, isDelivery = false, isStoreOpen = true, minOrderValue = 0 }: OrderSummaryProps) {
  const menu = useMenu();
  const { cartItems, formatPrice, removeFromCart } = menu;
  const [isRemoving, setIsRemoving] = useState<Record<string, boolean>>({});
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'money'
  });
  const [step, setStep] = useState(isDelivery ? 'cart' : 'confirmation');
  const [isProcessing, setIsProcessing] = useState(false);

  // Calcular o total do pedido
  const total = cartItems.reduce((acc: number, item: CartItem) => {
    return acc + (item.price * item.quantity);
  }, 0);
  
  // Verificar se o valor mínimo foi atingido
  const isMinOrderValueReached = total >= minOrderValue || minOrderValue === 0;

  // Remover item do carrinho
  const handleRemoveItem = async (itemId: string) => {
    setIsRemoving(prev => ({ ...prev, [itemId]: true }));
    
    try {
      await removeFromCart(itemId);
    } catch (error) {
      console.error('Erro ao remover item:', error);
    } finally {
      setIsRemoving(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Agrupar itens por categoria para melhor visualização
  const itemsByCategory = cartItems.reduce((acc: Record<string, CartItem[]>, item: CartItem) => {
    const categoryName = item.categoryName || 'Sem categoria';
    
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    
    acc[categoryName].push(item);
    return acc;
  }, {});

  // Atualizar informações do cliente
  const handleCustomerInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Verificar se o formulário de entrega está preenchido
  const isDeliveryFormValid = () => {
    if (!isDelivery) return true;
    return customerInfo.name.trim() !== '' && 
           customerInfo.phone.trim() !== '' && 
           customerInfo.address.trim() !== '';
  };

  // Avançar para o próximo passo
  const handleNextStep = () => {
    if (step === 'cart') {
      setStep('delivery');
    } else if (step === 'delivery') {
      setStep('confirmation');
    }
  };

  // Voltar para o passo anterior
  const handlePreviousStep = () => {
    if (step === 'confirmation') {
      setStep(isDelivery ? 'delivery' : 'cart');
    } else if (step === 'delivery') {
      setStep('cart');
    }
  };

  // Finalizar o pedido
  const handleFinishOrder = async () => {
    if (!isStoreOpen || !isMinOrderValueReached) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Aqui você implementaria a lógica para enviar o pedido
      console.log('Pedido finalizado:', {
        items: cartItems,
        total,
        isDelivery,
        customerInfo: isDelivery ? customerInfo : null
      });
      
      // Simular tempo de processamento (remover na implementação real)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fechar o modal
      onClose();
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      alert('Erro ao finalizar o pedido. Por favor, tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
      
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {step === 'cart' && 'Resumo do Pedido'}
            {step === 'delivery' && 'Informações de Entrega'}
            {step === 'confirmation' && 'Confirmar Pedido'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-600">Seu carrinho está vazio</p>
          </div>
        ) : (
          <>
            {step === 'cart' && (
              <>
                <div className="space-y-6">
                  {Object.entries(itemsByCategory).map(([category, items]) => (
                    <div key={category} className="border-b pb-4">
                      <h3 className="font-medium text-gray-700 mb-2">{category}</h3>
                      <div className="space-y-3">
                        {items.map((item: CartItem) => (
                          <div key={item.id} className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <span className="font-medium text-gray-800">{item.quantity}x</span>
                                <span className="ml-2">{item.name}</span>
                              </div>
                              {item.additionals && item.additionals.length > 0 && (
                                <ul className="mt-1 ml-6 text-sm text-gray-600">
                                  {item.additionals.map((additional) => (
                                    <li key={additional.id}>
                                      + {additional.name} ({formatPrice(additional.price)})
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {item.observation && (
                                <p className="mt-1 ml-6 text-sm text-gray-600 italic">
                                  Obs: {item.observation}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={isRemoving[item.id]}
                                className="text-red-500 hover:text-red-700 text-sm mt-1 flex items-center"
                              >
                                {isRemoving[item.id] ? (
                                  <div className="h-3 w-3 border-t-transparent border-2 border-red-500 rounded-full animate-spin mr-1"></div>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                                Remover
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  
                  {/* Alerta de valor mínimo não atingido */}
                  {minOrderValue > 0 && !isMinOrderValueReached && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>
                          Valor mínimo para pedido é {formatPrice(minOrderValue)}. 
                          Adicione mais {formatPrice(minOrderValue - total)} para continuar.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 transition-colors mr-2"
                  >
                    Fechar
                  </button>
                  {isDelivery && (
                    <button
                      onClick={handleNextStep}
                      disabled={!isStoreOpen || !isMinOrderValueReached}
                      className={`px-4 py-2 rounded-md text-white transition-colors ${
                        isStoreOpen && isMinOrderValueReached
                          ? 'bg-amber-500 hover:bg-amber-600' 
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Continuar
                    </button>
                  )}
                  {!isDelivery && (
                    <button
                      onClick={handleFinishOrder}
                      disabled={!isStoreOpen || isProcessing || !isMinOrderValueReached}
                      className={`px-4 py-2 rounded-md text-white transition-colors ${
                        isStoreOpen && !isProcessing && isMinOrderValueReached
                          ? 'bg-amber-500 hover:bg-amber-600' 
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isProcessing ? (
                        <span className="flex items-center">
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Processando...
                        </span>
                      ) : (
                        'Finalizar Pedido'
                      )}
                    </button>
                  )}
                </div>
              </>
            )}

            {step === 'delivery' && (
              <>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={customerInfo.name}
                      onChange={handleCustomerInfoChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={customerInfo.phone}
                      onChange={handleCustomerInfoChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Endereço Completo
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={customerInfo.address}
                      onChange={handleCustomerInfoChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    ></textarea>
                  </div>
                  
                  <div>
                    <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                      Forma de Pagamento
                    </label>
                    <select
                      id="paymentMethod"
                      name="paymentMethod"
                      value={customerInfo.paymentMethod}
                      onChange={handleCustomerInfoChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="money">Dinheiro</option>
                      <option value="credit">Cartão de Crédito</option>
                      <option value="debit">Cartão de Débito</option>
                      <option value="pix">PIX</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handlePreviousStep}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 transition-colors mr-2"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={!isDeliveryFormValid() || !isStoreOpen}
                    className={`px-4 py-2 rounded-md text-white transition-colors ${
                      isDeliveryFormValid() && isStoreOpen
                        ? 'bg-amber-500 hover:bg-amber-600' 
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Continuar
                  </button>
                </div>
              </>
            )}

            {step === 'confirmation' && (
              <>
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <h3 className="font-medium text-gray-700 mb-2">Resumo do Pedido</h3>
                    <div className="space-y-2">
                      {cartItems.map((item: CartItem) => (
                        <div key={item.id} className="flex justify-between">
                          <span>{item.quantity}x {item.name}</span>
                          <span>{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {isDelivery && (
                    <div className="border-b pb-4">
                      <h3 className="font-medium text-gray-700 mb-2">Informações de Entrega</h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>Nome:</strong> {customerInfo.name}</p>
                        <p><strong>Telefone:</strong> {customerInfo.phone}</p>
                        <p><strong>Endereço:</strong> {customerInfo.address}</p>
                        <p>
                          <strong>Pagamento:</strong> {
                            customerInfo.paymentMethod === 'money' ? 'Dinheiro' :
                            customerInfo.paymentMethod === 'credit' ? 'Cartão de Crédito' :
                            customerInfo.paymentMethod === 'debit' ? 'Cartão de Débito' : 'PIX'
                          }
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total:</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                    
                    {/* Alerta de valor mínimo não atingido */}
                    {minOrderValue > 0 && !isMinOrderValueReached && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>
                            Valor mínimo para pedido é {formatPrice(minOrderValue)}. 
                            Adicione mais {formatPrice(minOrderValue - total)} para continuar.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handlePreviousStep}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 transition-colors mr-2"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleFinishOrder}
                    disabled={!isStoreOpen || isProcessing || !isMinOrderValueReached}
                    className={`px-4 py-2 rounded-md text-white transition-colors ${
                      isStoreOpen && !isProcessing && isMinOrderValueReached
                        ? 'bg-amber-500 hover:bg-amber-600' 
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isProcessing ? (
                      <span className="flex items-center">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processando...
                      </span>
                    ) : (
                      'Finalizar Pedido'
                    )}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
} 