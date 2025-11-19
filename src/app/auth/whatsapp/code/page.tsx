'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { WhatsAppCodeAuth } from '@/components/auth/WhatsAppCodeAuth';
import { AlertCircle } from 'lucide-react';

function WhatsAppCodeAuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const storeId = searchParams?.get('store_id');
  const redirectTo = searchParams?.get('redirect_to') || '/checkout/authentication';

  useEffect(() => {
    if (!storeId) {
      // Redireciona se não houver store_id
      router.push('/');
    }
  }, [storeId, router]);

  if (!storeId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Erro</h1>
            <p className="text-gray-600">
              Identificador da loja não fornecido. Por favor, acesse o cardápio corretamente.
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <WhatsAppCodeAuth
            storeId={storeId}
            redirectTo={redirectTo}
            onAuthSuccess={(token, user) => {
              // Token já é armazenado pelo serviço
              console.log('Autenticação bem-sucedida:', { token, user });
            }}
          />
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          🔒 Sua comunicação é segura e protegida
        </p>
      </div>
    </div>
  );
}

export default function WhatsAppCodeAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600">Carregando...</p>
            </div>
          </div>
        </div>
      }
    >
      <WhatsAppCodeAuthContent />
    </Suspense>
  );
}
