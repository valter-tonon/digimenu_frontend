'use client';

import { X } from 'lucide-react';
import { useCartStore } from '@/store/cart';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Função para gerar uma chave única para cada item
const getItemKey = (item: any) => {
  const additionalsKey = item.additionals 
    ? item.additionals.map((a: any) => a.id).sort().join(',')
    : '';
  return `${item.id}-${additionalsKey}-${item.observations || ''}`;
};

export function CartModal({ isOpen, onClose }: CartModalProps) {
  const { items, removeItem, updateQuantity } = useCartStore();

  if (!isOpen) return null;

  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
      <div className="bg-white h-full w-full max-w-md p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Carrinho</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Seu carrinho está vazio</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6 max-h-[calc(100vh-250px)] overflow-y-auto">
              {items.map((item) => (
                <div key={getItemKey(item)} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-800">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        R$ {item.price.toFixed(2)}
                      </p>
                      {/* Mostrar adicionais selecionados */}
                      {item.additionals && item.additionals.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Adicionais:</p>
                          <ul className="text-sm text-gray-600">
                            {item.additionals.map((additional) => (
                              <li key={additional.id} className="flex justify-between">
                                <span>{additional.name}</span>
                                <span>+ R$ {additional.price.toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {/* Mostrar observações se houver */}
                      {item.observations && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Observações:</p>
                          <p className="text-sm text-gray-600">{item.observations}</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.id, item.additionals, item.observations)}
                      className="text-red-500 hover:text-red-600 text-sm"
                    >
                      Remover
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center">
                      <button
                        onClick={() => updateQuantity(
                          item.id, 
                          Math.max(1, item.quantity - 1),
                          item.additionals,
                          item.observations
                        )}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-l-lg border-r border-gray-200 transition-colors"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-medium text-gray-800 bg-gray-100 py-1">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(
                          item.id, 
                          item.quantity + 1,
                          item.additionals,
                          item.observations
                        )}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-r-lg border-l border-gray-200 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-medium text-gray-800">
                      R$ {item.totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-medium text-gray-800">Total</span>
                <span className="text-xl font-bold text-primary">
                  R$ {total.toFixed(2)}
                </span>
              </div>
              <button
                className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-hover transition-colors font-medium"
              >
                Finalizar Pedido
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 