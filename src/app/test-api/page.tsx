'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/infrastructure/api/apiClient';

export default function TestApiPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [url, setUrl] = useState('/menu?table=66f8abf2-bafa-4760-ac73-b1b22d4dbece');

  async function testApi() {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      console.log('Testando API:', url);
      const data = await apiClient.get(url);
      console.log('Resposta da API:', data);
      setResponse(data);
    } catch (err: any) {
      console.error('Erro ao testar API:', err.message);
      setError(err.message);
      
      if (err.response) {
        console.error('Status do erro:', err.response.status);
        console.error('Dados do erro:', err.response.data);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Teste de API</h1>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2" htmlFor="apiUrl">
            URL da API (relativa a {process.env.NEXT_PUBLIC_API_URL}):
          </label>
          <div className="flex">
            <input
              id="apiUrl"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={testApi}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            >
              {loading ? 'Testando...' : 'Testar'}
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Informações da API:</h2>
          <div className="bg-gray-100 p-3 rounded-md">
            <p><strong>Base URL:</strong> {process.env.NEXT_PUBLIC_API_URL}</p>
            <p><strong>URL Completa:</strong> {process.env.NEXT_PUBLIC_API_URL}{url}</p>
          </div>
        </div>
        
        {error && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Erro:</h2>
            <div className="bg-red-50 border border-red-200 p-3 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}
        
        {response && (
          <div>
            <h2 className="text-lg font-semibold text-green-600 mb-2">Resposta:</h2>
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-md overflow-auto max-h-96">
              <pre className="text-sm">{JSON.stringify(response, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 