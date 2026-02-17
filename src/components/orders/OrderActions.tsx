'use client';

import { useState } from 'react';
import { 
  RotateCcw, 
  Star, 
  MessageCircle, 
  Share2, 
  Download,
  AlertTriangle
} from 'lucide-react';

interface OrderActionsProps {
  orderId: number;
  orderNumber: string;
  status: string;
  onRepeatOrder?: (orderId: number) => void;
  onRateOrder?: (orderId: number) => void;
  onContactSupport?: (orderId: number) => void;
}

export function OrderActions({ 
  orderId, 
  orderNumber, 
  status, 
  onRepeatOrder, 
  onRateOrder, 
  onContactSupport 
}: OrderActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRepeatOrder = async () => {
    setIsLoading(true);
    try {
      if (onRepeatOrder) {
        await onRepeatOrder(orderId);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareOrder = () => {
    const shareData = {
      title: `Pedido #${orderNumber}`,
      text: `Confira meu pedido #${orderNumber} no DigiMenu!`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback para copiar link
      navigator.clipboard.writeText(window.location.href);
      // Aqui você poderia mostrar um toast de sucesso
    }
  };

  const handleDownloadReceipt = () => {
    // Simular download do comprovante
    const receiptContent = `
      COMPROVANTE DE PEDIDO
      =====================
      Pedido: #${orderNumber}
      Data: ${new Date().toLocaleDateString('pt-BR')}
      Status: ${status}
      
      Obrigado por escolher o DigiMenu!
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedido-${orderNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const canRepeat = ['delivered', 'cancelled'].includes(status.toLowerCase());
  const canRate = status.toLowerCase() === 'delivered';
  const canCancel = ['pending', 'confirmed'].includes(status.toLowerCase());

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Ações do Pedido</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Repetir Pedido - apenas para pedidos entregues/finalizados */}
        {canRepeat && (
          <button
            onClick={handleRepeatOrder}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 p-3 border border-amber-300 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm font-medium">Repetir Pedido</span>
          </button>
        )}

        {/* Avaliar Pedido */}
        {canRate && (
          <button
            onClick={() => onRateOrder?.(orderId)}
            className="flex items-center justify-center gap-2 p-3 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors"
          >
            <Star className="w-4 h-4" />
            <span className="text-sm font-medium">Avaliar</span>
          </button>
        )}

        {/* Cancelar Pedido */}
        {canCancel && (
          <button
            onClick={() => {
              if (confirm('Tem certeza que deseja cancelar este pedido?')) {
                // Implementar cancelamento
                console.log('Cancelando pedido:', orderId);
              }
            }}
            className="flex items-center justify-center gap-2 p-3 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Cancelar</span>
          </button>
        )}

        {/* Contatar Suporte - apenas para pedidos não entregues */}
        {status.toLowerCase() !== 'delivered' && status.toLowerCase() !== 'cancelled' && (
          <button
            onClick={() => onContactSupport?.(orderId)}
            className="flex items-center justify-center gap-2 p-3 border border-green-300 rounded-lg text-green-700 hover:bg-green-50 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Contatar</span>
          </button>
        )}

        {/* Compartilhar */}
        <button
          onClick={handleShareOrder}
          className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm font-medium">Compartilhar</span>
        </button>

        {/* Baixar Comprovante */}
        <button
          onClick={handleDownloadReceipt}
          className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">Comprovante</span>
        </button>
      </div>

      {/* Informações adicionais */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Número do pedido:</strong> #{orderNumber}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          <strong>Status:</strong> {status}
        </p>
      </div>
    </div>
  );
} 