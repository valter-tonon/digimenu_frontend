'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Clock, Truck, User, MapPin, CreditCard } from 'lucide-react';
import { OrderDetails } from '@/components/orders/OrderDetails';
import { OrderStatusTracker } from '@/components/orders/OrderStatusTracker';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StoreHeader } from '@/components/menu/StoreHeader';
import { toast } from 'react-hot-toast';

interface Order {
  id: number;
  uuid: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  customer?: {
    id: number;
    name: string;
    phone: string;
  };
  delivery_address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
  };
  table_number?: number;
  estimated_delivery_time?: string;
  payment_method?: string;
  notes?: string;
}

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  additionals?: {
    id: number;
    name: string;
    price: number;
  }[];
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storeData, setStoreData] = useState<any>(null);

  // Carregar detalhes do pedido
  useEffect(() => {
    const loadOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/v1/orders/${orderId}`);
        if (!response.ok) {
          throw new Error('Pedido não encontrado');
        }
        
        const data = await response.json();
        setOrder(data.data);
        
        // Carregar dados da loja se disponível
        if (data.data.tenant_id) {
          try {
            const storeResponse = await fetch(`/api/v1/tenants/${data.data.tenant_id}`);
            const storeData = await storeResponse.json();
            setStoreData(storeData.data);
          } catch (err) {
            console.error('Erro ao carregar dados da loja:', err);
          }
        }
      } catch (err: any) {
        console.error('Erro ao carregar detalhes do pedido:', err);
        setError(err.message || 'Erro ao carregar detalhes do pedido');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrderDetails();
    }
  }, [orderId]);

  // WebSocket para atualizações em tempo real
  useEffect(() => {
    if (!orderId || typeof window === 'undefined') return;

    const ws = new WebSocket(`ws://localhost:6001/orders`);
    
    ws.onopen = () => {
      console.log('WebSocket conectado para atualizações de pedidos');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'order_updated' && data.order.identify === orderId) {
          setOrder(prevOrder => prevOrder ? { ...prevOrder, ...data.order } : null);
        }
      } catch (err) {
        console.error('Erro ao processar mensagem WebSocket:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('Erro na conexão WebSocket:', error);
    };

    return () => {
      ws.close();
    };
  }, [orderId]);

  const handleBackToMenu = () => {
    // Tentar voltar para a página anterior ou para o menu
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleViewHistory = () => {
    router.push('/orders');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-4">❌</div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">Erro ao carregar pedido</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-x-4">
              <button 
                onClick={handleBackToMenu}
                className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
              >
                Voltar ao Menu
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-gray-500 text-lg mb-4">📋</div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">Pedido não encontrado</h1>
            <p className="text-gray-600 mb-4">O pedido solicitado não foi encontrado.</p>
            <button 
              onClick={handleBackToMenu}
              className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
            >
              Voltar ao Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <StoreHeader 
              storeName={storeData?.name || 'Restaurante'}
              storeLogo={storeData?.logo}
              subtitle={`Pedido #${order.order_number}`}
            />
            <button
              onClick={handleBackToMenu}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-amber-500 transition-colors rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Status do Pedido */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Status do Pedido</h2>
            <OrderStatusTracker 
              status={order.status}
              estimatedTime={order.estimated_delivery_time}
            />
          </div>

          {/* Detalhes do Pedido */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <OrderDetails 
              order={order}
              onClose={() => {}}
              onRepeatOrder={() => {}}
              onRateOrder={() => {}}
              onContactSupport={() => {}}
            />
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleBackToMenu}
              className="flex-1 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
            >
              Fazer Novo Pedido
            </button>
            <button
              onClick={handleViewHistory}
              className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Ver Histórico
            </button>
          </div>
        </div>
      </main>
    </div>
  );
} 