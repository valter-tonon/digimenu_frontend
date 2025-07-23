'use client';

import Link from 'next/link';
import { ArrowLeft, AlertTriangle, HelpCircle, ExternalLink } from 'lucide-react';

export default function InvalidLink() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Ícone de erro */}
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
        </div>

        {/* Título e descrição */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Link inválido
        </h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          O link que você acessou é inválido ou está mal formatado. Verifique se digitou corretamente ou se o QR Code foi escaneado adequadamente.
        </p>

        {/* Alertas informativos */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <HelpCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-left">
              <h3 className="text-sm font-medium text-red-800 mb-1">
                Como resolver:
              </h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Verifique se o link foi digitado corretamente</li>
                <li>• Tente escanear o QR Code novamente</li>
                <li>• Solicite um novo QR Code ao estabelecimento</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Exemplos de URLs válidas */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="text-left">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Formatos de URL válidos:
            </h3>
            <div className="space-y-2 text-xs font-mono bg-white p-3 rounded border">
              <div className="text-blue-700">
                digimenu.com/menu?store=12345&table=67890
              </div>
              <div className="text-blue-700">
                digimenu.com/menu?store=12345&isDelivery=true
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-4">
          <button
            onClick={() => window.history.back()}
            className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>
          
          <p className="text-sm text-gray-500">
            ou
          </p>
          
          <Link
            href="/"
            className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Ir para página inicial
          </Link>
        </div>

        {/* Link para testar */}
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 mb-3">
            <strong>Quer testar?</strong> Use este link de exemplo:
          </p>
          <Link
            href="/menu?store=12345678901234&table=8aec3ad1-7d84-4860-83ca-1e1031c4332a"
            className="inline-flex items-center text-sm text-green-700 hover:text-green-800 font-medium"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Teste - Mesa de exemplo
          </Link>
        </div>

        {/* Informações de contato */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">
            Precisa de ajuda?
          </p>
          <p className="text-sm text-gray-600">
            Entre em contato com o suporte técnico ou com o estabelecimento.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8">
          <div className="flex items-center justify-center mb-2">
            <span className="text-amber-600 font-bold text-lg mr-1">digi</span>
            <span className="text-gray-700 font-bold text-lg">menu</span>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} DigiMenu. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
} 