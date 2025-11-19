'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

function AuthErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorCode, setErrorCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const code = searchParams.get('code') || 'UNKNOWN_ERROR';
    const message = searchParams.get('message') || 'Ocorreu um erro durante a autenticação';
    
    setErrorCode(code);
    setErrorMessage(decodeURIComponent(message));

    // Log error for audit
    console.error('Auth error page accessed', {
      code,
      message,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    });
  }, [searchParams]);

  const handleReturnToCheckout = () => {
    // Clear any stored auth data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('whatsapp_auth_jwt');
    }
    router.push('/checkout');
  };

  const handleRetry = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900">Erro na Autenticação</h1>
          
          <p className="text-gray-600">{errorMessage}</p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700 mb-3">
              Não foi possível completar sua autenticação via WhatsApp.
            </p>
            
            <div className="space-y-2">
              <button
                onClick={handleRetry}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tentar Novamente</span>
              </button>
              
              <button
                onClick={handleReturnToCheckout}
                className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
              >
                Solicitar Novo Link
              </button>
            </div>
          </div>
          
          {errorCode && (
            <div className="text-xs text-gray-500 mt-2">
              Código do erro: {errorCode}
            </div>
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <button
            onClick={handleReturnToCheckout}
            className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Checkout</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}