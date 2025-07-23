'use client';

import Link from 'next/link';
import { ArrowLeft, Clock, RefreshCw, AlertCircle } from 'lucide-react';

export default function SessionExpired() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Ícone de erro */}
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center">
            <Clock className="w-12 h-12 text-amber-600" />
          </div>
        </div>

        {/* Título e descrição */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Sessão expirada
        </h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          Sua sessão expirou ou não foram encontradas informações válidas. Para continuar, você precisa escanear novamente o QR Code da mesa ou acessar o link do restaurante.
        </p>

        {/* Alertas informativos */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-left">
              <h3 className="text-sm font-medium text-amber-800 mb-1">
                Por que isso acontece?
              </h3>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Dados temporários foram limpos do navegador</li>
                <li>• Muito tempo sem atividade</li>
                <li>• Troca de dispositivo ou navegador</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Como proceder */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <RefreshCw className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-left">
              <h3 className="text-sm font-medium text-blue-800 mb-1">
                Como continuar:
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Escaneie novamente o QR Code da sua mesa</li>
                <li>• Ou acesse o link direto do restaurante</li>
                <li>• Seus itens no carrinho serão mantidos se possível</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Recarregar página
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="w-full bg-amber-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-amber-700 transition-colors flex items-center justify-center"
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

        {/* Dica importante */}
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>💡 Dica:</strong> Para evitar isso no futuro, mantenha a aba do navegador aberta durante sua refeição.
          </p>
        </div>

        {/* Informações de contato */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">
            Ainda com dificuldades?
          </p>
          <p className="text-sm text-gray-600">
            Peça ajuda ao garçom para escanear o QR Code novamente.
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