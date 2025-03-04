'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TestRedirectPage() {
  const [storeId, setStoreId] = useState('1234567890123');
  const [tableId, setTableId] = useState('66f8abf2-bafa-4760-ac73-b1b22d4dbece');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Teste de Redirecionamento</h1>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="storeId">
            ID da Loja:
          </label>
          <input
            id="storeId"
            type="text"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2" htmlFor="tableId">
            ID da Mesa:
          </label>
          <input
            id="tableId"
            type="text"
            value={tableId}
            onChange={(e) => setTableId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">Opções de Redirecionamento:</h2>
          
          <div>
            <h3 className="text-md font-medium text-gray-600 mb-2">1. Usando Link do Next.js:</h3>
            <Link 
              href={`/${storeId}/${tableId}`}
              className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Ir para /{storeId}/{tableId}
            </Link>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-600 mb-2">2. Usando Link direto para o menu:</h3>
            <Link 
              href={`/menu?store=${storeId}&table=${tableId}`}
              className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Ir para /menu?store={storeId}&table={tableId}
            </Link>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-600 mb-2">3. Usando window.location:</h3>
            <button 
              onClick={() => window.location.href = `/${storeId}/${tableId}`}
              className="block w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Navegar para /{storeId}/{tableId}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 