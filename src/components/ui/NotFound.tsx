'use client';

import Link from 'next/link';

export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4 py-12">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-800">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mt-4">Página não encontrada</h2>
        <p className="text-gray-600 mt-2 mb-8">
          A página que você está procurando não existe ou não está disponível.
        </p>
        <p className="text-gray-600 mb-8">
          Para acessar o menu, você precisa de um link válido com um identificador de mesa ou loja.
        </p>
        <Link 
          href="/"
          className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
        >
          Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
} 