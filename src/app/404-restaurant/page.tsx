'use client';

import Link from 'next/link';
import { ArrowLeft, Store, AlertCircle } from 'lucide-react';

export default function RestaurantNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Ícone de erro */}
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <Store className="w-12 h-12 text-red-600" />
          </div>
        </div>

        {/* Título e descrição */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Restaurante não encontrado
        </h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          O restaurante que você está tentando acessar não foi encontrado ou pode estar temporariamente indisponível.
        </p>

        {/* Alertas informativos */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-left">
              <h3 className="text-sm font-medium text-amber-800 mb-1">
                Possíveis causas:
              </h3>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• QR Code inválido ou expirado</li>
                <li>• Restaurante temporariamente indisponível</li>
                <li>• Link digitado incorretamente</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-4">
          <button
            onClick={() => window.history.back()}
            className="w-full bg-amber-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-amber-700 transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Tentar novamente
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

        {/* Informações de contato */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">
            Precisa de ajuda?
          </p>
          <p className="text-sm text-gray-600">
            Entre em contato com o suporte ou com o restaurante diretamente.
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