'use client';

import Link from 'next/link';
import { ExternalLink, Table, Truck, Store, AlertCircle } from 'lucide-react';

export default function TestFlow() {
  const testUrls = [
    {
      title: 'Mesa válida',
      description: 'Teste com QR Code de mesa válido (URL será limpa para /menu)',
      url: '/menu?store=12345678901234&table=8aec3ad1-7d84-4860-83ca-1e1031c4332a',
      icon: <Table className="w-5 h-5" />,
      color: 'green'
    },
    {
      title: 'Delivery válido',
      description: 'Teste com delivery válido (URL será limpa para /menu)',
      url: '/menu?store=12345678901234&isDelivery=true',
      icon: <Truck className="w-5 h-5" />,
      color: 'blue'
    },
    {
      title: 'Loja inválida',
      description: 'Teste com ID de loja inválido (vai para 404-restaurant)',
      url: '/menu?store=123&table=8aec3ad1-7d84-4860-83ca-1e1031c4332a',
      icon: <Store className="w-5 h-5" />,
      color: 'red'
    },
    {
      title: 'Mesa inválida',
      description: 'Teste com ID de mesa inválido (vai para 404-table)',
      url: '/menu?store=12345678901234&table=123',
      icon: <Table className="w-5 h-5" />,
      color: 'orange'
    },
    {
      title: 'Link malformado',
      description: 'Teste sem parâmetros (vai para 404-invalid)',
      url: '/menu',
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'gray'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Teste de Fluxo - DigiMenu
          </h1>
          <p className="text-gray-600 mb-8">
            Teste diferentes cenários de navegação e tratamento de erros
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-left">
                <h3 className="text-sm font-medium text-blue-800 mb-1">
                  Como funciona:
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• IDs de loja devem ter pelo menos 10 caracteres</li>
                  <li>• IDs de mesa devem ter pelo menos 10 caracteres</li>
                  <li>• Dados são salvos no localStorage/sessionStorage</li>
                  <li>• Navegação entre páginas mantém o contexto</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Test URLs */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {testUrls.map((test, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg shadow-sm border-l-4 ${
                test.color === 'green' ? 'border-green-500' :
                test.color === 'blue' ? 'border-blue-500' :
                test.color === 'red' ? 'border-red-500' :
                test.color === 'orange' ? 'border-orange-500' :
                'border-gray-500'
              } p-6`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${
                    test.color === 'green' ? 'bg-green-100 text-green-600' :
                    test.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    test.color === 'red' ? 'bg-red-100 text-red-600' :
                    test.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-100 text-gray-600'
                  } mr-3`}>
                    {test.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{test.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                  </div>
                </div>
              </div>
              
                             <div className="bg-gray-50 rounded-md p-3 mb-4">
                 <code className="text-xs text-gray-700 break-all">
                   localhost:3000{test.url}
                 </code>
               </div>
              
              <Link
                href={test.url}
                className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  test.color === 'green' ? 'bg-green-600 hover:bg-green-700 text-white' :
                  test.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                  test.color === 'red' ? 'bg-red-600 hover:bg-red-700 text-white' :
                  test.color === 'orange' ? 'bg-orange-600 hover:bg-orange-700 text-white' :
                  'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Testar
              </Link>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Como testar o fluxo completo:
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-amber-100 text-amber-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                1
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Teste um cenário válido</h3>
                <p className="text-gray-600 text-sm">Clique em "Mesa válida" ou "Delivery válido" para testar o fluxo normal.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-amber-100 text-amber-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                2
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Navegue pelo menu</h3>
                <p className="text-gray-600 text-sm">Adicione itens ao carrinho e observe que o contexto é mantido.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-amber-100 text-amber-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                3
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Teste o checkout</h3>
                <p className="text-gray-600 text-sm">Tente ir para o checkout e verifique se os dados persistem.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-amber-100 text-amber-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                4
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Teste cenários de erro</h3>
                <p className="text-gray-600 text-sm">Clique nos cenários de erro para ver as páginas 404 específicas.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Clear Storage */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Limpar Storage e Recarregar
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Use para resetar todos os dados salvos e testar novamente
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <div className="flex items-center justify-center mb-2">
            <span className="text-amber-600 font-bold text-lg mr-1">digi</span>
            <span className="text-gray-700 font-bold text-lg">menu</span>
          </div>
          <p className="text-sm text-gray-500">
            Sistema de gerenciamento de cardápio digital
          </p>
        </div>
      </div>
    </div>
  );
} 