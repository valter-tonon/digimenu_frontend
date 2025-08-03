'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'react-hot-toast';
import { Loader2, ShoppingCart, ArrowLeft } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items: cartItems, totalPrice, totalItems } = useCartStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Small delay to ensure cart is loaded
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading) {
      // Verificar se há itens no carrinho
      if (cartItems.length === 0) {
        toast.error('Carrinho vazio. Redirecionando para o menu...');
        router.push('/menu');
        return;
      }

      // Redirecionar para primeira etapa do checkout
      router.replace('/checkout/authentication');
    }
  }, [cartItems, router, loading]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-amber-500" />
          <p className="text-gray-600">Iniciando checkout...</p>
        </div>
      </div>
    );
  }

  // Show cart summary while redirecting
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Finalizar Pedido</h1>
        </div>

        {/* Cart Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center mb-4">
            <ShoppingCart className="w-5 h-5 text-amber-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Resumo do Pedido</h2>
          </div>
          
          <div className="space-y-3 mb-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <div className="flex-1">
                  <span className="font-medium">{item.quantity}x {item.name}</span>
                  {item.additionals && item.additionals.length > 0 && (
                    <div className="text-gray-500 text-xs mt-1">
                      {item.additionals.map(add => add.name).join(', ')}
                    </div>
                  )}
                </div>
                <span className="font-medium">
                  {formatPrice(item.price * item.quantity + (item.additionals?.reduce((sum, add) => sum + (add.price * add.quantity), 0) || 0))}
                </span>
              </div>
            ))}
          </div>
          
          <div className="border-t pt-4 flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">
              Total ({totalItems()} itens)
            </span>
            <span className="text-xl font-bold text-amber-600">
              {formatPrice(totalPrice())}
            </span>
          </div>
        </div>

        {/* Loading indicator */}
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
          <p className="text-gray-600">Preparando checkout...</p>
        </div>
      </div>
    </div>
  );
}