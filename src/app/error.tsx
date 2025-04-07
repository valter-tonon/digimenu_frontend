'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Registrar o erro no console para depuração
    console.error('Erro na aplicação:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="bg-white border border-red-200 rounded-lg shadow-md p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Algo deu errado!</h2>
        <p className="text-gray-700 mb-4">
          Ocorreu um erro ao carregar esta página. Por favor, tente novamente.
        </p>
        <div className="bg-red-50 p-3 rounded-md mb-4">
          <p className="text-sm text-red-800 font-mono overflow-auto">
            {error.message}
          </p>
        </div>
        <div className="flex justify-between">
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Voltar para o início
          </button>
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