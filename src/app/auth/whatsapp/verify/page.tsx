/**
 * Página de validação de magic link do WhatsApp
 * 
 * Processa automaticamente tokens de magic link e cria sessão
 * após validação bem-sucedida.
 */

'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { whatsappAuthService } from '@/services/whatsappAuth';
import { useAuth } from '@/hooks/useAuth';

interface ValidationState {
  isValidating: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
  sessionId: string | null;
  customerId: string | null;
}

const WhatsAppVerifyContent: React.FC = () => {
  const [state, setState] = useState<ValidationState>({
    isValidating: true,
    isSuccess: false,
    isError: false,
    error: null,
    sessionId: null,
    customerId: null
  });

  const searchParams = useSearchParams() || new URLSearchParams();
  const router = useRouter();
  const auth = useAuth();
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  /**
   * Processa token na montagem do componente
   */
  useEffect(() => {
    const token = searchParams?.get('token');
    
    if (!token) {
      setState({
        isValidating: false,
        isSuccess: false,
        isError: true,
        error: 'Token não fornecido na URL',
        sessionId: null,
        customerId: null
      });
      return;
    }

    validateToken(token);
  }, [searchParams]);

  /**
   * Valida token e cria sessão
   */
  const validateToken = async (token: string) => {
    try {
      setState(prev => ({
        ...prev,
        isValidating: true,
        error: null
      }));

      // Valida e cria sessão a partir do token
      const result = await whatsappAuthService.verifyToken(token);

      if (result.success && result.user) {
        setState({
          isValidating: false,
          isSuccess: true,
          isError: false,
          error: null,
          sessionId: result.user.uuid || null,
          customerId: result.user.id?.toString() || null
        });

        // Inicia countdown para redirecionamento
        startRedirectCountdown();

        console.log('Sessão criada via WhatsApp:', {
          sessionId: result.user.uuid,
          customerId: result.user.id
        });

      } else {
        setState({
          isValidating: false,
          isSuccess: false,
          isError: true,
          error: result.message || 'Erro ao validar token',
          sessionId: null,
          customerId: null
        });
      }

    } catch (error) {
      console.error('Erro ao validar token:', error);

      setState({
        isValidating: false,
        isSuccess: false,
        isError: true,
        error: 'Erro interno ao processar token',
        sessionId: null,
        customerId: null
      });
    }
  };

  /**
   * Inicia countdown para redirecionamento automático
   */
  const startRedirectCountdown = () => {
    let countdown = 5;
    setRedirectCountdown(countdown);

    const interval = setInterval(() => {
      countdown -= 1;
      setRedirectCountdown(countdown);

      if (countdown <= 0) {
        clearInterval(interval);
        redirectToMenu();
      }
    }, 1000);
  };

  /**
   * Redireciona para o menu da loja
   */
  const redirectToMenu = () => {
    // Tenta obter storeId da sessão ou URL
    const storeId = auth.session?.storeId || searchParams.get('store');
    
    if (storeId) {
      router.push(`/menu/${storeId}`);
    } else {
      router.push('/');
    }
  };

  /**
   * Tenta novamente com o mesmo token
   */
  const retryValidation = () => {
    const token = searchParams.get('token');
    if (token) {
      validateToken(token);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {state.isValidating && (
            <ValidationInProgress />
          )}

          {state.isSuccess && (
            <ValidationSuccess 
              customerId={state.customerId}
              redirectCountdown={redirectCountdown}
              onRedirectNow={redirectToMenu}
            />
          )}

          {state.isError && (
            <ValidationError 
              error={state.error}
              onRetry={retryValidation}
              onGoHome={() => router.push('/')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Estado de validação em progresso
 */
const ValidationInProgress: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-4"
  >
    <div className="w-16 h-16 mx-auto">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
    </div>
    
    <h1 className="text-xl font-semibold text-gray-900">
      Validando acesso...
    </h1>
    
    <p className="text-gray-600">
      Processando seu link de acesso via WhatsApp
    </p>
  </motion.div>
);

/**
 * Estado de validação bem-sucedida
 */
interface ValidationSuccessProps {
  customerId: string | null;
  redirectCountdown: number | null;
  onRedirectNow: () => void;
}

const ValidationSuccess: React.FC<ValidationSuccessProps> = ({
  customerId,
  redirectCountdown,
  onRedirectNow
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="space-y-6"
  >
    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>

    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">
        Acesso autorizado!
      </h1>
      
      <p className="text-gray-600">
        {customerId 
          ? 'Bem-vindo de volta! Sua sessão foi restaurada.'
          : 'Sessão criada com sucesso. Você pode fazer pedidos como visitante.'
        }
      </p>
    </div>

    {redirectCountdown !== null && redirectCountdown > 0 && (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          Redirecionando para o cardápio em {redirectCountdown} segundo{redirectCountdown !== 1 ? 's' : ''}...
        </p>
      </div>
    )}

    <div className="space-y-3">
      <button
        onClick={onRedirectNow}
        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        Ir para o cardápio agora
      </button>

      <p className="text-xs text-gray-500">
        Você pode fechar esta aba e continuar navegando
      </p>
    </div>
  </motion.div>
);

/**
 * Estado de erro na validação
 */
interface ValidationErrorProps {
  error: string | null;
  onRetry: () => void;
  onGoHome: () => void;
}

const ValidationError: React.FC<ValidationErrorProps> = ({
  error,
  onRetry,
  onGoHome
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>

    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">
        Erro na validação
      </h1>
      
      <p className="text-gray-600 mb-4">
        {error || 'Não foi possível validar seu link de acesso'}
      </p>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-red-800 mb-2">
          Possíveis causas:
        </h3>
        <ul className="text-sm text-red-700 space-y-1">
          <li>• Link expirado (válido por 15 minutos)</li>
          <li>• Link já foi utilizado</li>
          <li>• Link inválido ou corrompido</li>
        </ul>
      </div>
    </div>

    <div className="space-y-3">
      <button
        onClick={onRetry}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Tentar novamente
      </button>

      <button
        onClick={onGoHome}
        className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
      >
        Voltar ao início
      </button>

      <p className="text-xs text-gray-500">
        Se o problema persistir, solicite um novo link de acesso
      </p>
    </div>
  </motion.div>
);

/**
 * Componente principal com Suspense
 */
const WhatsAppVerifyPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
      </div>
    }>
      <WhatsAppVerifyContent />
    </Suspense>
  );
};

export default WhatsAppVerifyPage;