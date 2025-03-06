'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function MenuError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log do erro para depuração
    console.error('Erro na página de menu:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-amber-500 mb-4">Ops! Algo deu errado</h1>
        <p className="text-lg text-gray-600 mb-8">
          Não foi possível carregar o cardápio. Por favor, tente novamente.
        </p>
        <div className="space-y-4">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-amber-500 text-white rounded-md font-medium hover:bg-amber-600 transition-colors"
          >
            Tentar novamente
          </button>
          <div className="mt-4">
            <Link href="/" className="text-amber-500 hover:underline">
              Voltar para a página inicial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 