'use client';

/**
 * Componente de autenticação WhatsApp simplificado para checkout
 *
 * Funcionalidades:
 * - Apenas um fluxo: enviar código via WhatsApp
 * - Reconhece usuário existente automaticamente
 * - Cria novo usuário se necessário
 * - Sem opções de login/cadastro manual
 * - Sem opção de checkout como visitante
 * - Integrado com sessão de checkout
 */

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CodeInput } from '@/components/auth/CodeInput';
import { whatsappAuthService } from '@/services/whatsappAuth';
import { MessageCircle, CheckCircle, AlertCircle, Phone, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CheckoutWhatsAppAuthProps {
  storeId: string;
  onAuthSuccess?: (token: string, user: any) => void;
}

type AuthStep = 'phone' | 'name' | 'code' | 'success' | 'error';

interface AuthState {
  step: AuthStep;
  phone: string;
  name: string;
  code: string;
  error: string | null;
  isLoading: boolean;
  attemptsLeft: number;
  locked: boolean;
  userExists: boolean | null;
}

export const CheckoutWhatsAppAuth: React.FC<CheckoutWhatsAppAuthProps> = ({
  storeId,
  onAuthSuccess
}) => {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    step: 'phone',
    phone: '',
    name: '',
    code: '',
    error: null,
    isLoading: false,
    attemptsLeft: 3,
    locked: false,
    userExists: null
  });

  // Step 1: Verificar usuário e solicitar código
  const handleRequestCode = useCallback(async () => {
    if (!state.phone.trim()) {
      setState(prev => ({ ...prev, error: 'Por favor, insira seu número de telefone' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Verificar se usuário existe
      const userCheck = await whatsappAuthService.checkUserExists(state.phone, storeId);

      if (!userCheck.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: userCheck.message || 'Erro ao verificar usuário'
        }));
        toast.error(userCheck.message || 'Erro ao verificar usuário');
        return;
      }

      // Se usuário não existe, mostrar campo de nome
      if (!userCheck.exists) {
        setState(prev => ({
          ...prev,
          step: 'name',
          isLoading: false,
          userExists: false
        }));
        return;
      }

      // Se usuário existe, enviar código diretamente
      await sendCode(state.phone, storeId);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao verificar usuário';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      toast.error(errorMessage);
    }
  }, [state.phone, storeId]);

  // Função auxiliar para enviar código
  const sendCode = useCallback(async (phone: string, tenantId: string, customerName?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await whatsappAuthService.requestAuthenticationCode(
        phone,
        tenantId,
        customerName
      );

      if (result.success) {
        setState(prev => ({
          ...prev,
          step: 'code',
          isLoading: false,
          code: '',
          error: null,
          attemptsLeft: 3,
          locked: false
        }));

        toast.success('Código enviado via WhatsApp! 📱');
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.message || 'Erro ao solicitar código'
        }));
        toast.error(result.message || 'Erro ao solicitar código');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao solicitar código';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      toast.error(errorMessage);
    }
  }, []);

  // Step 1.5: Enviar código após preencher nome
  const handleSubmitName = useCallback(async () => {
    if (!state.name.trim()) {
      setState(prev => ({ ...prev, error: 'Por favor, insira seu nome' }));
      return;
    }

    if (state.name.trim().length < 2) {
      setState(prev => ({ ...prev, error: 'Nome deve ter pelo menos 2 caracteres' }));
      return;
    }

    await sendCode(state.phone, storeId, state.name.trim());
  }, [state.phone, state.name, storeId, sendCode]);

  // Step 2: Validar código
  const handleValidateCode = useCallback(async (code: string) => {
    if (code.length !== 6) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await whatsappAuthService.validateAuthenticationCode(
        state.phone,
        code,
        storeId
      );

      if (result.success) {
        setState(prev => ({
          ...prev,
          step: 'success',
          isLoading: false,
          code
        }));

        toast.success('Autenticação bem-sucedida! ✅');

        // Callback se fornecido - a página pai cuidará do redirecionamento
        if (onAuthSuccess && result.user) {
          setTimeout(() => {
            // Obter o JWT armazenado pelo serviço (validateAuthenticationCode já armazenou)
            const jwt = whatsappAuthService.getCurrentJWT();
            console.log('✅ Autenticação completa, redirecionando...', {
              jwt: jwt ? jwt.substring(0, 20) + '...' : null,
              user: result.user,
              token: result.token ? result.token.substring(0, 20) + '...' : null
            });
            onAuthSuccess(jwt || result.token || '', result.user);
          }, 500);
        } else {
          console.warn('⚠️ onAuthSuccess não fornecido ou user não encontrado', {
            hasCallback: !!onAuthSuccess,
            hasUser: !!result.user
          });
        }
      } else {
        if (result.locked) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Código bloqueado. Solicite um novo código.',
            locked: true,
            step: 'error'
          }));
          toast.error('Código bloqueado após muitas tentativas');
        } else {
          const newAttemptsLeft = Math.max(0, state.attemptsLeft - 1);

          if (newAttemptsLeft === 0) {
            setState(prev => ({
              ...prev,
              isLoading: false,
              error: 'Código incorreto. Solicite um novo código.',
              step: 'error',
              attemptsLeft: 0,
              locked: true
            }));
            toast.error('Muitas tentativas. Solicite um novo código.');
          } else {
            setState(prev => ({
              ...prev,
              isLoading: false,
              error: `Código inválido. ${newAttemptsLeft} tentativa${newAttemptsLeft !== 1 ? 's' : ''} restante${newAttemptsLeft !== 1 ? 's' : ''}`,
              attemptsLeft: newAttemptsLeft
            }));
            toast.error(`Código inválido (${newAttemptsLeft} tentativas restantes)`);
          }
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao validar código';
      setState(prev => ({
        ...prev,
        isLoading: false,
        step: 'error',
        error: errorMessage
      }));
      toast.error(errorMessage);
    }
  }, [state.phone, storeId, state.attemptsLeft, onAuthSuccess, router]);

  // Voltar para a entrada de telefone
  const handleBackToPhone = useCallback(() => {
    setState(prev => ({
      ...prev,
      step: 'phone',
      code: '',
      error: null,
      attemptsLeft: 3,
      locked: false
    }));
  }, []);

  // Solicitar novo código
  const handleRequestNewCode = useCallback(() => {
    setState(prev => ({
      ...prev,
      step: 'phone',
      code: '',
      error: null,
      attemptsLeft: 3,
      locked: false
    }));
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* STEP 1: Phone Input */}
      {state.step === 'phone' && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <MessageCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Autentique-se
            </h2>
            <p className="text-gray-600">
              Insira seu número de telefone para receber um código de acesso
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  placeholder="(XX) XXXXX-XXXX"
                  value={state.phone}
                  onChange={(e) => setState(prev => ({ ...prev, phone: e.target.value }))}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !state.isLoading) {
                      handleRequestCode();
                    }
                  }}
                  disabled={state.isLoading}
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-gray-900 font-medium placeholder-gray-500"
                />
              </div>
            </div>

            {state.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{state.error}</p>
              </div>
            )}

            <button
              onClick={handleRequestCode}
              disabled={state.isLoading || !state.phone.trim()}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {state.isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Enviando código...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5" />
                  <span>Enviar Código</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            🔒 Seu número é protegido. Você receberá um código de 6 dígitos no WhatsApp.
          </p>
        </div>
      )}

      {/* STEP 1.5: Name Input (for new users) */}
      {state.step === 'name' && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Complete seu Cadastro
            </h2>
            <p className="text-gray-600">
              Para continuar, precisamos do seu nome completo
            </p>
            <div className="mt-2">
              <input
                type="text"
                value={state.phone}
                disabled
                className="w-full max-w-xs text-center px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 font-semibold"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                placeholder="Seu nome completo"
                value={state.name}
                onChange={(e) => setState(prev => ({ ...prev, name: e.target.value }))}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !state.isLoading && state.name.trim().length >= 2) {
                    handleSubmitName();
                  }
                }}
                disabled={state.isLoading}
                autoFocus
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 font-medium placeholder-gray-500"
              />
            </div>

            {state.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{state.error}</p>
              </div>
            )}

            <button
              onClick={handleSubmitName}
              disabled={state.isLoading || !state.name.trim() || state.name.trim().length < 2}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {state.isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Enviando código...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5" />
                  <span>Enviar Código</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col space-y-3">
            <button
              onClick={() => setState(prev => ({ ...prev, step: 'phone', name: '', error: null }))}
              disabled={state.isLoading}
              className="w-full py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Usar outro número
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            🔒 Seus dados são protegidos. Você receberá um código de 6 dígitos no WhatsApp.
          </p>
        </div>
      )}

      {/* STEP 2: Code Input */}
      {state.step === 'code' && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Digite o Código
            </h2>
            <div className="text-gray-600 text-center">
              <p>Insira o código de 6 dígitos enviado para</p>
              <div className="mt-2">
                <input
                  type="text"
                  value={state.phone}
                  disabled
                  className="w-full max-w-xs text-center px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 font-semibold"
                />
              </div>
            </div>
          </div>

          <CodeInput
            length={6}
            isLoading={state.isLoading}
            disabled={state.isLoading}
            error={state.error}
            onComplete={handleValidateCode}
            onCodeChange={(code) => setState(prev => ({ ...prev, code }))}
          />

          <div className="flex flex-col space-y-3">
            <button
              onClick={handleBackToPhone}
              disabled={state.isLoading}
              className="w-full py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Usar outro número
            </button>

            <button
              onClick={handleRequestNewCode}
              disabled={state.isLoading}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Não recebeu o código? Enviar novamente
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            O código expira em 15 minutos. Você tem {state.attemptsLeft} tentativas.
          </p>
        </div>
      )}

      {/* STEP 3: Success */}
      {state.step === 'success' && (
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Autenticação Bem-sucedida!
            </h2>
            <p className="text-gray-600">
              Continuando com seu pedido...
            </p>
          </div>

          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        </div>
      )}

      {/* STEP 4: Error */}
      {state.step === 'error' && (
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Erro na Autenticação
            </h2>
            <p className="text-gray-600">{state.error}</p>
          </div>

          <button
            onClick={handleRequestNewCode}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            Solicitar Novo Código
          </button>
        </div>
      )}
    </div>
  );
};

export default CheckoutWhatsAppAuth;
