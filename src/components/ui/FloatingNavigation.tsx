'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  History, 
  Home, 
  User, 
  Settings, 
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface FloatingNavigationProps {
  storeId: string;
  className?: string;
}

export function FloatingNavigation({ storeId, className = '' }: FloatingNavigationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`fixed bottom-20 right-4 z-40 ${className}`}>
      {/* Botão principal */}
      <div className="relative">
        <button
          onClick={toggleExpanded}
          className="bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
          aria-label="Menu de navegação"
        >
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </button>

        {/* Menu expandido */}
        {isExpanded && (
          <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[200px] overflow-hidden">
            {/* Histórico de Pedidos */}
            <Link
              href={`/${storeId}/orders`}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
              onClick={() => setIsExpanded(false)}
            >
              <History className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">Histórico de Pedidos</span>
            </Link>

            {/* Perfil do Usuário */}
            <Link
              href={`/${storeId}/profile`}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
              onClick={() => setIsExpanded(false)}
            >
              <User className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Meu Perfil</span>
            </Link>

            {/* Configurações */}
            <Link
              href={`/${storeId}/settings`}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setIsExpanded(false)}
            >
              <Settings className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Configurações</span>
            </Link>
          </div>
        )}
      </div>

      {/* Overlay para fechar o menu */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
} 