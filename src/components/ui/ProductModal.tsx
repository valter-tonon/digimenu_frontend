'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Minus, Plus } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { toast } from 'sonner';
import { Additional } from '@/lib/mock-data';

interface ProductModalProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    additionals?: Additional[];
  };
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
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
    const selectedAdditionalsDetails = product.additionals?.filter(
      add => selectedAdditionals.includes(add.id)
    ) || [];

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      additionals: selectedAdditionalsDetails,
      observations: observations.trim(),
      totalPrice: totalPrice
    });
    
    toast.success('Item adicionado ao carrinho!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <button 
            onClick={onClose}
            className="absolute right-2 top-2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
          >
            <X className="w-6 h-6 text-secondary" />
          </button>
          <div className="relative h-64">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover rounded-t-lg"
            />
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-secondary mb-2">{product.name}</h2>
          <p className="text-gray-700 mb-4 text-base">{product.description}</p>
          
          {/* Adicionais */}
          {product.additionals && product.additionals.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Adicionais</h3>
              <div className="space-y-2">
                {product.additionals.map((additional) => (
                  <label 
                    key={additional.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
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
                        className="w-4 h-4 text-primary rounded focus:ring-primary"
                      />
                      <span className="text-gray-700">{additional.name}</span>
                    </div>
                    <span className="text-gray-600">+ R$ {additional.price.toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Observações</h3>
            <textarea
              placeholder="Ex: Sem cebola, molho à parte..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full p-3 border rounded-lg resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <span className="text-xl font-bold text-secondary">
              R$ {totalPrice.toFixed(2)}
            </span>
            
            <div className="flex items-center gap-3 bg-white border-2 border-gray-200 rounded-lg p-1 shadow-sm">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-1 hover:bg-gray-100 rounded-full text-secondary"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="w-8 text-center font-semibold text-secondary text-lg">
                {quantity}
              </span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="p-1 hover:bg-gray-100 rounded-full text-secondary"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full bg-primary text-white py-4 rounded-lg hover:bg-primary-hover transition-colors font-semibold text-lg shadow-md"
          >
            Adicionar • R$ {totalPrice.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
} 