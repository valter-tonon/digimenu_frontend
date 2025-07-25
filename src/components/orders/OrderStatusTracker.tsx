'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  XCircle, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface OrderStatus {
  id: number;
  status: string;
  updated_at: string;
  estimated_delivery_time?: string;
}

interface OrderStatusTrackerProps {
  order: OrderStatus;
  onStatusUpdate?: (orderId: number, newStatus: string) => void;
}

const statusSteps = [
  { key: 'pending', label: 'Pendente', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { key: 'confirmed', label: 'Confirmado', icon: AlertCircle, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { key: 'preparing', label: 'Preparando', icon: Package, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { key: 'ready', label: 'Pronto', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
  { key: 'delivered', label: 'Entregue', icon: Truck, color: 'text-green-600', bgColor: 'bg-green-100' },
  { key: 'cancelled', label: 'Cancelado', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' }
];

export function OrderStatusTracker({ order, onStatusUpdate }: OrderStatusTrackerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Encontrar o índice do status atual
  useEffect(() => {
    const stepIndex = statusSteps.findIndex(step => step.key === order.status.toLowerCase());
    setCurrentStepIndex(stepIndex >= 0 ? stepIndex : 0);
  }, [order.status]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Simular atualização de status (em produção, faria uma chamada API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (onStatusUpdate) {
        onStatusUpdate(order.id, order.status);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Status do Pedido</h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Timeline de Status */}
      <div className="relative">
        {statusSteps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;

          return (
            <div key={step.key} className="flex items-center mb-6 last:mb-0">
              {/* Linha conectora */}
              {index > 0 && (
                <div className={`absolute left-6 top-0 w-0.5 h-6 transform -translate-x-1/2 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}

              {/* Ícone do status */}
              <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                isCurrent 
                  ? `${step.bgColor} ${step.color} border-current` 
                  : isCompleted 
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-gray-100 text-gray-400 border-gray-300'
              }`}>
                <StepIcon className="w-5 h-5" />
              </div>

              {/* Informações do status */}
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${
                      isCurrent ? 'text-gray-800' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </h4>
                    {isCurrent && (
                      <p className="text-sm text-gray-600 mt-1">
                        Atualizado às {formatTime(order.updated_at)}
                      </p>
                    )}
                  </div>
                  
                  {isCurrent && order.estimated_delivery_time && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Tempo estimado</p>
                      <p className="text-sm font-medium text-gray-800">
                        {order.estimated_delivery_time}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status atual destacado */}
      <div className={`mt-6 p-4 rounded-lg ${statusSteps[currentStepIndex]?.bgColor}`}>
        <div className="flex items-center gap-3">
          {(() => {
            const StepIcon = statusSteps[currentStepIndex]?.icon;
            return StepIcon ? <StepIcon className={`w-5 h-5 ${statusSteps[currentStepIndex]?.color}`} /> : null;
          })()}
          <div>
            <p className={`font-medium ${statusSteps[currentStepIndex]?.color}`}>
              Status atual: {statusSteps[currentStepIndex]?.label}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Última atualização: {formatTime(order.updated_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 