'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items: cartItems } = useCartStore();

  useEffect(() => {
    // Verificar se há itens no carrinho
    if (cartItems.length === 0) {
      toast.error('Carrinho vazio. Redirecionando para o menu...');
      router.push('/menu');
      return;
    }

    // Redirecionar para primeira etapa do checkout
    router.replace('/checkout/authentication');
  }, [cartItems, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-amber-500" />
        <p className="text-gray-600">Iniciando checkout...</p>
      </div>
    </div>
  );
}