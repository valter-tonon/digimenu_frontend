'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log de erro para depuração
    console.error('Erro na aplicação:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Erro inesperado</h1>
        <p className="text-gray-700 mb-4">
          Ocorreu um erro ao processar sua solicitação.
        </p>
        {error?.message && (
          <div className="bg-red-50 p-3 rounded-md mb-4">
            <p className="text-sm text-red-800 font-mono overflow-auto">
              {error.message}
            </p>
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-3 justify-between">
          <Link 
            href="/"
            className="px-4 py-2 text-center bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Voltar ao início
          </Link>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  );
} 