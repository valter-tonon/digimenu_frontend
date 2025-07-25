/**
 * Componente para processamento automático de QR Code
 * 
 * Processa automaticamente parâmetros de QR Code na inicialização
 * e gerencia estados de loading, sucesso e erro.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useAutoQRCodeAccess } from '@/hooks/useQRCodeAccess';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

interface QRCodeProcessorProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  showUI?: boolean;
  autoRedirect?: boolean;
  redirectDelay?: number;
}

export const QRCodeProcessor: React.FC<QRCodeProcessorProps> = ({
  onSuccess,
  onError,
  showUI = true,
  autoRedirect = true,
  redirectDelay = 2000
}) => {
  const qrAccess = useAutoQRCodeAccess();
  const auth = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);

  // Efeito para lidar com sucesso
  useEffect(() => {
    if (qrAccess.isSuccess && qrAccess.hasSession) {
      setShowSuccess(true);
      onSuccess?.();

      if (autoRedirect) {
        setTimeout(() => {
          // Redireciona para o menu da loja
          const storeId = qrAccess.accessData?.storeId;
          if (storeId) {
            window.location.href = `/menu/${storeId}`;
          }
        }, redirectDelay);
      }
    }
  }, [qrAccess.isSuccess, qrAccess.hasSession, onSuccess, autoRedirect, redirectDelay, qrAccess.accessData]);

  // Efeito para lidar com erro
  useEffect(() => {
    if (qrAccess.error) {
      onError?.(qrAccess.error);
    }
  }, [qrAccess.error, onError]);

  // Se não deve mostrar UI, retorna null
  if (!showUI) {
    return null;
  }

  // Se não há parâmetros de QR Code, não renderiza nada
  if (!qrAccess.hasQRCodeParams()) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <AnimatePresence mode="wait">
          {qrAccess.isProcessing && (
            <ProcessingState key="processing" />
          )}
          
          {qrAccess.isSuccess && showSuccess && (
            <SuccessState 
              key="success" 
              accessData={qrAccess.accessData}
              redirectDelay={redirectDelay}
            />
          )}
          
          {qrAccess.error && (
            <ErrorState 
              key="error" 
              error={qrAccess.error}
              onRetry={qrAccess.retryAccess}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/**
 * Estado de processamento
 */
const ProcessingState: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="text-center"
  >
    <div className="mb-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      Processando acesso...
    </h3>
    <p className="text-gray-600">
      Validando informações do QR Code
    </p>
  </motion.div>
);

/**
 * Estado de sucesso
 */
interface SuccessStateProps {
  accessData: any;
  redirectDelay: number;
}

const SuccessState: React.FC<SuccessStateProps> = ({ accessData, redirectDelay }) => {
  const [countdown, setCountdown] = useState(Math.ceil(redirectDelay / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="text-center"
    >
      <div className="mb-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Acesso autorizado!
      </h3>
      
      <div className="text-gray-600 mb-4">
        {accessData?.isDelivery ? (
          <p>Acesso para delivery configurado</p>
        ) : (
          <p>Mesa {accessData?.tableId} - Acesso configurado</p>
        )}
      </div>

      {countdown > 0 && (
        <div className="text-sm text-gray-500">
          Redirecionando em {countdown} segundo{countdown !== 1 ? 's' : ''}...
        </div>
      )}
    </motion.div>
  );
};

/**
 * Estado de erro
 */
interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="text-center"
  >
    <div className="mb-4">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    </div>
    
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      Erro no acesso
    </h3>
    
    <p className="text-gray-600 mb-6">
      {error}
    </p>

    <div className="flex gap-3 justify-center">
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Tentar novamente
      </button>
      
      <button
        onClick={() => window.location.href = '/'}
        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
      >
        Voltar ao início
      </button>
    </div>
  </motion.div>
);

/**
 * Hook para usar o QRCodeProcessor programaticamente
 */
export const useQRCodeProcessor = () => {
  const qrAccess = useAutoQRCodeAccess();
  const auth = useAuth();

  const processQRCode = async (url: string) => {
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;
      
      await qrAccess.processQRCodeAccess(params);
      
      return {
        success: true,
        data: qrAccess.accessData
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  };

  return {
    processQRCode,
    isProcessing: qrAccess.isProcessing,
    isSuccess: qrAccess.isSuccess,
    error: qrAccess.error,
    hasSession: auth.session !== null
  };
};

export default QRCodeProcessor;