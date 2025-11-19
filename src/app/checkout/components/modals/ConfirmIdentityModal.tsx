'use client';

import { useState } from 'react';
import { CheckoutState } from '@/services/checkoutStateMachine';
import { Loader2, User, MapPin, AlertCircle, RotateCcw, Edit2 } from 'lucide-react';

interface ConfirmIdentityModalProps {
  state: CheckoutState;
  onConfirm: () => void;
  onEditData: () => void;
  onChangeAccount: () => void;
  isLoading?: boolean;
}

/**
 * Modal para confirmar identidade de usuário autenticado
 *
 * Responsabilidades:
 * - Mostrar dados do usuário autenticado
 * - Opção de confirmar e continuar
 * - Opção de editar dados
 * - Opção de trocar de conta
 */
export default function ConfirmIdentityModal({
  state,
  onConfirm,
  onEditData,
  onChangeAccount,
  isLoading = false,
}: ConfirmIdentityModalProps) {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-8 text-white text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Confirme sua Identidade</h2>
          <p className="text-amber-50 text-sm">Verifique seus dados antes de continuar</p>
        </div>

        {/* Content */}
        <div className="px-6 py-8 space-y-6">
          {/* User Info */}
          {state.customerData && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 mb-1">Nome</p>
                  <p className="font-semibold text-gray-900 truncate">{state.customerData.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-gray-200">
                <div className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1 text-center">📱</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 mb-1">Telefone</p>
                  <p className="font-semibold text-gray-900">{state.customerData.phone}</p>
                </div>
              </div>

              {state.customerData.email && (
                <div className="flex items-start gap-3 pt-2 border-t border-gray-200">
                  <div className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1 text-center">✉️</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 mb-1">E-mail</p>
                    <p className="font-semibold text-gray-900 truncate">{state.customerData.email}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Address Info (if exists) */}
          {state.selectedAddress && (
            <div className="bg-blue-50 rounded-lg p-4 space-y-3 border border-blue-100">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-blue-700 font-medium mb-1">Endereço de Entrega</p>
                  <p className="text-sm text-blue-900">
                    {state.selectedAddress.street}, {state.selectedAddress.number}
                    {state.selectedAddress.complement && ` - ${state.selectedAddress.complement}`}
                  </p>
                  <p className="text-sm text-blue-900">
                    {state.selectedAddress.neighborhood}, {state.selectedAddress.city}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info Message */}
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Todos os dados estão corretos? Se sim, clique em <strong>Confirmar</strong> para continuar.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 space-y-3 border-t">
          {/* Primary Action - Confirm */}
          <button
            onClick={onConfirm}
            disabled={isLoading}
            onMouseEnter={() => setHoveredButton('confirm')}
            onMouseLeave={() => setHoveredButton(null)}
            className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              hoveredButton === 'confirm' && !isLoading
                ? 'bg-green-600 text-white shadow-lg scale-105'
                : 'bg-green-500 text-white hover:bg-green-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            ✅ Confirmar
          </button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onEditData}
              disabled={isLoading}
              onMouseEnter={() => setHoveredButton('edit')}
              onMouseLeave={() => setHoveredButton(null)}
              className={`py-2 px-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                hoveredButton === 'edit' && !isLoading
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
              } disabled:opacity-50`}
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </button>

            <button
              onClick={onChangeAccount}
              disabled={isLoading}
              onMouseEnter={() => setHoveredButton('change')}
              onMouseLeave={() => setHoveredButton(null)}
              className={`py-2 px-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                hoveredButton === 'change' && !isLoading
                  ? 'bg-gray-300 text-gray-800 border border-gray-400'
                  : 'bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300'
              } disabled:opacity-50`}
            >
              <RotateCcw className="w-4 h-4" />
              Trocar
            </button>
          </div>

          {/* Info Text */}
          <p className="text-xs text-gray-600 text-center pt-2">
            Você pode voltar e editar os dados a qualquer momento
          </p>
        </div>
      </div>
    </div>
  );
}
