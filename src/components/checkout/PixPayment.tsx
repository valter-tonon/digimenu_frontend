'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Smartphone, Clock } from 'lucide-react';

export interface PixPaymentProps {
  orderId: string;
  amount: number;
  pixCode?: string;
  qrCodeUrl?: string;
  onPaymentConfirmed?: () => void;
  className?: string;
}

export function PixPayment({
  orderId,
  amount,
  pixCode,
  qrCodeUrl,
  onPaymentConfirmed,
  className = ''
}: PixPaymentProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'confirmed' | 'expired'>('pending');

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0 && paymentStatus === 'pending') {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setPaymentStatus('expired');
    }
  }, [timeLeft, paymentStatus]);

  // Format time display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Copy PIX code to clipboard
  const copyPixCode = async () => {
    if (pixCode) {
      try {
        await navigator.clipboard.writeText(pixCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy PIX code:', err);
      }
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Simulate payment confirmation (in real app, this would come from webhook)
  const simulatePaymentConfirmation = () => {
    setPaymentStatus('confirmed');
    onPaymentConfirmed?.();
  };

  if (paymentStatus === 'confirmed') {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-6 text-center ${className}`}>
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          Pagamento Confirmado!
        </h3>
        <p className="text-green-700">
          Seu pagamento PIX foi processado com sucesso.
        </p>
      </div>
    );
  }

  if (paymentStatus === 'expired') {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 text-center ${className}`}>
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          PIX Expirado
        </h3>
        <p className="text-red-700 mb-4">
          O tempo para pagamento expirou. Gere um novo PIX para continuar.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Gerar Novo PIX
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Smartphone className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Pagamento PIX
        </h3>
        <p className="text-gray-600">
          Escaneie o QR Code ou copie o código PIX
        </p>
      </div>

      {/* Amount and Timer */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Valor a pagar:</span>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(amount)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Tempo restante:</span>
          <span className={`text-sm font-medium ${timeLeft < 300 ? 'text-red-600' : 'text-green-600'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* QR Code */}
      <div className="text-center mb-6">
        <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
          {qrCodeUrl ? (
            <img 
              src={qrCodeUrl} 
              alt="QR Code PIX" 
              className="w-48 h-48 mx-auto"
            />
          ) : (
            <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded">
              <div className="text-center">
                <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Gerando QR Code...
                </p>
              </div>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Abra o app do seu banco e escaneie o código
        </p>
      </div>

      {/* PIX Code */}
      {pixCode && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ou copie o código PIX:
          </label>
          <div className="flex">
            <input
              type="text"
              value={pixCode}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm font-mono"
            />
            <button
              onClick={copyPixCode}
              className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors flex items-center"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copiar
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-blue-800 mb-2">Como pagar:</h4>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Abra o app do seu banco</li>
          <li>2. Escolha a opção PIX</li>
          <li>3. Escaneie o QR Code ou cole o código</li>
          <li>4. Confirme o pagamento</li>
        </ol>
      </div>

      {/* Development: Simulate payment button */}
      {process.env.NODE_ENV === 'development' && (
        <div className="border-t pt-4">
          <button
            onClick={simulatePaymentConfirmation}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
          >
            [DEV] Simular Pagamento Confirmado
          </button>
        </div>
      )}

      {/* Status */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Aguardando confirmação do pagamento...
        </p>
        <div className="flex justify-center mt-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  );
}