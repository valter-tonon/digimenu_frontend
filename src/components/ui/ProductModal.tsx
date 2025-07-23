'use client';

import { useState } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'react-hot-toast';
import { useStoreStatus } from '@/infrastructure/context/StoreStatusContext';

interface Additional {
  id: string;
  name: string;
  price: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  additionals?: Additional[];
}

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const { isStoreOpen } = useStoreStatus();
  const [quantity, setQuantity] = useState(1);
  const [selectedAdditionals, setSelectedAdditionals] = useState<string[]>([]);
  const [observations, setObservations] = useState('');
  const addItem = useCartStore((state) => state.addItem);

  const additionalTotal = product.additionals?.reduce((total, additional) => {
    return selectedAdditionals.includes(additional.id) 
      ? total + additional.price 
      : total;
  }, 0) || 0;

  const totalPrice = (product.price + additionalTotal) * quantity;

  const handleAddToCart = () => {
    if (!isStoreOpen) {
      toast.error('Restaurante fechado. Não é possível adicionar itens ao carrinho no momento.');
      return;
    }

    const selectedAdditionalsDetails = product.additionals?.filter(
      add => selectedAdditionals.includes(add.id)
    ).map(add => ({
      id: parseInt(add.id),
      name: add.name,
      price: add.price,
      quantity: 1
    })) || [];

    addItem({
      productId: parseInt(product.id),
      identify: product.uuid,
      name: product.name,
      price: product.price,
      quantity: quantity,
      additionals: selectedAdditionalsDetails,
      notes: observations.trim(),
      image: product.image
    });
    
    toast.success('Item adicionado ao carrinho!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {product.image && (
            <div className="mb-4">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}
          
          <p className="text-gray-600 mb-4">{product.description}</p>
          
          {product.additionals && product.additionals.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Adicionais</h3>
              <div className="space-y-2">
                {product.additionals.map((additional) => (
                  <label key={additional.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedAdditionals.includes(additional.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAdditionals([...selectedAdditionals, additional.id]);
                          } else {
                            setSelectedAdditionals(selectedAdditionals.filter(id => id !== additional.id));
                          }
                        }}
                        className="mr-2"
                        disabled={!isStoreOpen}
                      />
                      <span className="text-gray-700">{additional.name}</span>
                    </div>
                    <span className="text-gray-600">R$ {additional.price.toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Alguma observação especial?"
              disabled={!isStoreOpen}
            />
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <span className="text-xl font-bold text-secondary">
              R$ {totalPrice.toFixed(2)}
            </span>
            
            <div className="flex items-center gap-3 bg-white border-2 border-gray-200 rounded-lg p-1 shadow-sm">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-1 hover:bg-gray-100 rounded-full text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isStoreOpen}
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="w-8 text-center font-semibold text-secondary text-lg">
                {quantity}
              </span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="p-1 hover:bg-gray-100 rounded-full text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isStoreOpen}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className={`w-full py-4 rounded-lg font-semibold text-lg shadow-md transition-colors ${
              isStoreOpen 
                ? 'bg-primary text-white hover:bg-primary-hover' 
                : 'bg-gray-400 text-white cursor-not-allowed'
            }`}
            disabled={!isStoreOpen}
          >
            {isStoreOpen ? `Adicionar • R$ ${totalPrice.toFixed(2)}` : 'Restaurante Fechado'}
          </button>
        </div>
      </div>
    </div>
  );
} 