/**
 * Exemplo de uso do serviço de autenticação WhatsApp
 * Este componente demonstra como usar o WhatsAppAuthService
 */

'use client';

import React, { useState } from 'react';
import { useWhatsAppAuth } from '@/hooks/use-whatsapp-auth';

interface WhatsAppAuthExampleProps {
  tenantId: string;
}

export const WhatsAppAuthExample: React.FC<WhatsAppAuthExampleProps> = ({ tenantId }) => {
  const [phone, setPhone] = useState('');
  const { state, requestMagicLink, verifyToken, validateStoredAuth, logout, reset } = useWhatsAppAuth();

  const handleRequestMagicLink = async () => {
    if (!phone.trim()) {
      alert('Por favor, informe um número de telefone');
      return;
    }

    await requestMagicLink(phone, tenantId);
  };

  const handleCheckStoredAuth = async () => {
    const isValid = await validateStoredAuth();
    alert(isValid ? 'Autenticação válida!' : 'Não há autenticação válida');
  };

  const handleLogout = () => {
    logout();
    alert('Logout realizado com sucesso');
  };

  const handleReset = () => {
    reset();
    setPhone('');
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">WhatsApp Auth Example</h2>
      
      {/* Status da autenticação */}
      <div className="mb-4 p-3 rounded-md bg-gray-100">
        <p><strong>Status:</strong> {state.isAuthenticated ? 'Autenticado' : 'Não autenticado'}</p>
        {state.user && (
          <div className="mt-2">
            <p><strong>Usuário:</strong> {state.user.name}</p>
            <p><strong>Telefone:</strong> {state.user.phone}</p>
          </div>
        )}
      </div>

      {/* Formulário de solicitação de link */}
      {!state.isAuthenticated && (
        <div className="mb-4">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Número de telefone:
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={state.isLoading}
          />
        </div>
      )}

      {/* Botões de ação */}
      <div className="space-y-2">
        {!state.isAuthenticated && (
          <button
            onClick={handleRequestMagicLink}
            disabled={state.isLoading || !phone.trim()}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.isLoading ? 'Enviando...' : 'Solicitar Link Mágico'}
          </button>
        )}

        <button
          onClick={handleCheckStoredAuth}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Verificar Auth Armazenada
        </button>

        {state.isAuthenticated && (
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        )}

        <button
          onClick={handleReset}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Reset
        </button>
      </div>

      {/* Mensagens de status */}
      {state.isLoading && (
        <div className="mt-4 p-3 bg-blue-100 text-blue-800 rounded-md">
          Processando...
        </div>
      )}

      {state.isSuccess && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md">
          {state.isAuthenticated ? 'Autenticado com sucesso!' : 'Link mágico enviado com sucesso!'}
          {state.expiresAt && (
            <p className="text-sm mt-1">
              Expira em: {state.expiresAt.toLocaleString()}
            </p>
          )}
        </div>
      )}

      {state.error && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
          <strong>Erro:</strong> {state.error}
        </div>
      )}

      {/* Instruções */}
      <div className="mt-6 p-3 bg-yellow-100 text-yellow-800 rounded-md text-sm">
        <strong>Como usar:</strong>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Informe seu número de telefone</li>
          <li>Clique em "Solicitar Link Mágico"</li>
          <li>Aguarde receber o link no WhatsApp</li>
          <li>Clique no link para ser autenticado</li>
        </ol>
      </div>
    </div>
  );
};