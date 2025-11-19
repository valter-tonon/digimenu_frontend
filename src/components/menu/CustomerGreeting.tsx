'use client';

import { useState } from 'react';
import { useMenuAuth } from '@/infrastructure/hooks/useMenuAuth';

interface CustomerGreetingProps {
  customerName: string;
  customerPhone: string;
}

export default function CustomerGreeting({
  customerName,
  customerPhone,
}: CustomerGreetingProps) {
  const { logout } = useMenuAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  // Format phone for display
  const displayPhone = customerPhone
    ? `${customerPhone.slice(0, 2)} ${customerPhone.slice(2)}`
    : '';

  return (
    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Left side - Greeting */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white bg-opacity-20">
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Bem-vindo, {customerName}! 👋</h1>
              <p className="text-orange-100 text-sm mt-1">
                📱 {displayPhone}
              </p>
            </div>
          </div>

          {/* Right side - Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <span className="text-sm font-medium">Menu</span>
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50">
                <button
                  onClick={() => {
                    window.location.href = '/orders';
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
                >
                  <span>📦</span>
                  <span className="text-sm">Meus Pedidos</span>
                </button>
                <button
                  onClick={() => {
                    window.location.href = '/account';
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
                >
                  <span>👤</span>
                  <span className="text-sm">Minha Conta</span>
                </button>
                <div className="border-t border-gray-200 my-2"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                >
                  <span>🚪</span>
                  <span className="text-sm">Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 24h Window Info */}
        <div className="mt-4 bg-white bg-opacity-10 rounded-lg p-3 border border-white border-opacity-20">
          <p className="text-sm text-orange-50">
            ⏰ Seu acesso ao cardápio expira em <strong>24 horas</strong> a partir do primeiro acesso
          </p>
        </div>
      </div>
    </div>
  );
}
