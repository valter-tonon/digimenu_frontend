'use client';

import { useCallback, useEffect, useState } from 'react';
import { useCheckoutStore } from '@/store/checkout-store';
import { CheckoutWhatsAppAuth } from '@/components/checkout/CheckoutWhatsAppAuth';
import { whatsappAuthService } from '@/services/whatsappAuth';
import { User, MapPin, RotateCcw, Loader2 } from 'lucide-react';

interface IdentificationPageProps {
  storeId: string;
  onComplete: () => void;
}

interface AuthenticatedUser {
  name: string;
  phone: string;
  email?: string;
}

/**
 * Página 1 do checkout de delivery: Identificação via telefone
 *
 * FLUXO:
 * 1. Verifica se já existe JWT válido no storage
 * 2. Se SIM → mostra modal de confirmação de identidade (nome, telefone)
 * 3. Se NÃO → mostra CheckoutWhatsAppAuth (fluxo de enviar código)
 */
export default function IdentificationPage({ storeId, onComplete }: IdentificationPageProps) {
  const { setCustomer } = useCheckoutStore();

  const [isChecking, setIsChecking] = useState(true);
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthenticatedUser | null>(null);
  const [showFullAuth, setShowFullAuth] = useState(false);

  // CAMADA 1: Verificar se já existe autenticação válida
  useEffect(() => {
    const checkExistingAuth = () => {
      try {
        const jwt = whatsappAuthService.getCurrentJWT();

        if (jwt) {
          const storedAuth = whatsappAuthService.getStoredAuth();
          if (storedAuth?.user) {
            console.log('🔐 [checkout-delivery] JWT válido encontrado, mostrando confirmação de identidade');
            setAuthenticatedUser({
              name: storedAuth.user.name,
              phone: storedAuth.user.phone,
              email: storedAuth.user.email,
            });
            setIsChecking(false);
            return;
          }
        }

        console.log('📝 [checkout-delivery] Sem JWT válido, mostrando fluxo de autenticação');
        setShowFullAuth(true);
        setIsChecking(false);
      } catch (error) {
        console.error('❌ [checkout-delivery] Erro ao verificar auth:', error);
        setShowFullAuth(true);
        setIsChecking(false);
      }
    };

    checkExistingAuth();
  }, []);

  // Handler: Confirmar identidade (usuário já autenticado)
  const handleConfirmIdentity = useCallback(() => {
    if (!authenticatedUser) return;

    console.log('✅ [checkout-delivery] Identidade confirmada:', authenticatedUser);

    // Salvar dados do cliente no store
    setCustomer({
      name: authenticatedUser.name,
      phone: authenticatedUser.phone,
      email: authenticatedUser.email,
    });

    // Salvar telefone em localStorage
    if (authenticatedUser.phone) {
      localStorage.setItem('customer_phone', authenticatedUser.phone);
    }

    // Avançar para a próxima página
    onComplete();
  }, [authenticatedUser, setCustomer, onComplete]);

  // Handler: Trocar de conta (limpa auth e mostra fluxo completo)
  const handleChangeAccount = useCallback(() => {
    console.log('🔄 [checkout-delivery] Usuário quer trocar de conta');
    whatsappAuthService.clearAuth();
    setAuthenticatedUser(null);
    setShowFullAuth(true);
  }, []);

  // Handler: Autenticação via WhatsApp concluída
  const handleAuthSuccess = useCallback(
    (token: string, user: any) => {
      console.log('✅ [checkout-delivery] Autenticação concluída:', user);

      // Salvar dados do cliente no store
      setCustomer({
        name: user.name,
        phone: user.phone,
        email: user.email,
      });

      // Salvar telefone em localStorage
      if (user.phone) {
        localStorage.setItem('customer_phone', user.phone);
      }

      // Avançar para a próxima página
      onComplete();
    },
    [setCustomer, onComplete]
  );

  // Loading enquanto verifica autenticação existente
  if (isChecking) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-amber-500" />
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // FLUXO A: Usuário já autenticado → Confirmar identidade
  if (authenticatedUser && !showFullAuth) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
            <User className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Confirme sua Identidade</h2>
          <p className="text-gray-600">
            Verifique seus dados antes de continuar
          </p>
        </div>

        {/* Dados do usuário */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 mb-1">Nome</p>
              <p className="font-semibold text-gray-900 truncate">{authenticatedUser.name}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-2 border-t border-gray-200">
            <div className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1 text-center">📱</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 mb-1">Telefone</p>
              <p className="font-semibold text-gray-900">{authenticatedUser.phone}</p>
            </div>
          </div>

          {authenticatedUser.email && (
            <div className="flex items-start gap-3 pt-2 border-t border-gray-200">
              <div className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1 text-center">✉️</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 mb-1">E-mail</p>
                <p className="font-semibold text-gray-900 truncate">{authenticatedUser.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="space-y-3">
          <button
            onClick={handleConfirmIdentity}
            className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            ✅ Confirmar e Continuar
          </button>

          <button
            onClick={handleChangeAccount}
            className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Usar outro número
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Se não é você, clique em &quot;Usar outro número&quot; para autenticar com outro telefone
        </p>
      </div>
    );
  }

  // FLUXO B: Sem autenticação → Fluxo completo de WhatsApp
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Identificação</h2>
        <p className="text-gray-600">
          Precisamos do seu telefone (WhatsApp) para confirmar seu pedido
        </p>
      </div>

      <CheckoutWhatsAppAuth
        storeId={storeId}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
