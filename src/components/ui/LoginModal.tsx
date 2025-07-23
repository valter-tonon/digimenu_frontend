'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal">
      <div className="bg-white rounded-2xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Entrar</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Login com telefone */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de telefone
            </label>
            <input
              type="tel"
              placeholder="(00) 00000-0000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button className="w-full bg-primary text-white py-3 rounded-lg mt-3 font-medium hover:bg-primary-dark transition-colors">
              Continuar
            </button>
          </div>

          {/* Divisor */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-gray-200 w-full"></div>
            <span className="bg-white px-4 text-sm text-gray-500 absolute">ou</span>
          </div>

          {/* Login com redes sociais */}
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <Image src="/images/google-icon.png" alt="Google" width={20} height={20} />
              <span className="text-gray-700 font-medium">Continuar com Google</span>
            </button>
            
            <button className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <Image src="/images/facebook-icon.png" alt="Facebook" width={20} height={20} />
              <span className="text-gray-700 font-medium">Continuar com Facebook</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 