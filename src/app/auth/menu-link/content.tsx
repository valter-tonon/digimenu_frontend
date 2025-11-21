'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface VerificationState {
  loading: boolean;
  success: boolean;
  error: string | null;
  customerName: string | null;
  restaurantName: string | null;
}

export default function MenuLinkAuthContent() {
  const searchParams = useSearchParams() || new URLSearchParams();
  const router = useRouter();
  const [state, setState] = useState<VerificationState>({
    loading: true,
    success: false,
    error: null,
    customerName: null,
    restaurantName: null,
  });

  const token = searchParams?.get('token');
  const phone = searchParams?.get('phone');

  useEffect(() => {
    verifyToken();
  }, [token, phone]);

  const verifyToken = async () => {
    if (!token || !phone) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Token ou telefone inválido. Por favor, tente novamente.',
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/v1/menu-auth/verify-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao verificar token');
      }

      // Armazenar token JWT na sessão
      if (data.data?.token) {
        sessionStorage.setItem('menu_auth_token', data.data.token);
        localStorage.setItem('customer_phone', phone);
        localStorage.setItem('customer_name', data.data.customer_name || '');
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        success: true,
        customerName: data.data?.customer_name,
        restaurantName: data.data?.restaurant_name,
      }));

      // Redirecionar para o cardápio após 2 segundos
      setTimeout(() => {
        router.push('/menu');
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao verificar token';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  };

  const handleRetry = () => {
    verifyToken();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-md mb-4">
            <svg
              className="w-8 h-8 text-orange-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verificando Acesso</h1>
          <p className="text-gray-600">Aguarde enquanto autenticamos sua sessão...</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {state.loading && (
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 mb-6">
                <div className="w-full h-full border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600 text-center font-medium">Verificando seu acesso...</p>
            </div>
          )}

          {state.success && (
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 mb-6 flex items-center justify-center bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
                {state.customerName ? `Bem-vindo, ${state.customerName}!` : 'Acesso Verificado!'}
              </h2>
              <p className="text-gray-600 text-center mb-6">
                {state.restaurantName ? `Confira nosso cardápio em ${state.restaurantName}` : 'Carregando cardápio...'}
              </p>
              <p className="text-sm text-gray-500 text-center">
                Você será redirecionado em breve...
              </p>
            </div>
          )}

          {state.error && (
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 mb-6 flex items-center justify-center bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Acesso Inválido</h2>
              <p className="text-gray-600 text-center mb-6">{state.error}</p>

              <div className="space-y-3 w-full">
                <button
                  onClick={handleRetry}
                  className="w-full py-3 px-4 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Tentar Novamente
                </button>
                <Link
                  href="/"
                  className="w-full py-3 px-4 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors text-center"
                >
                  Voltar ao Início
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 p-4 bg-white rounded-lg shadow-sm">
          <p className="text-xs text-gray-600 text-center mb-3">
            Este link é exclusivo e pode ser usado apenas uma vez.
          </p>
          <div className="text-xs text-gray-500 space-y-1">
            <p>📱 Acessado via WhatsApp</p>
            <p>🔒 Conexão segura garantida</p>
          </div>
        </div>
      </div>
    </div>
  );
}
