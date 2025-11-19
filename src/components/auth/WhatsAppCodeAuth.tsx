'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CodeInput } from './CodeInput';
import { whatsappAuthService } from '@/services/whatsappAuth';
import { MessageCircle, CheckCircle, AlertCircle, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface WhatsAppCodeAuthProps {
  storeId: string;
  onAuthSuccess?: (token: string, user: any) => void;
  redirectTo?: string;
}

type AuthStep = 'phone' | 'code' | 'success' | 'error';

interface AuthState {
  step: AuthStep;
  phone: string;
  code: string;
  error: string | null;
  isLoading: boolean;
  isNewUser: boolean;
  codeExpired: boolean;
  attemptsLeft: number;
}

export const WhatsAppCodeAuth: React.FC<WhatsAppCodeAuthProps> = ({
  storeId,
  onAuthSuccess,
  redirectTo = '/checkout'
}) => {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    step: 'phone',
    phone: '',
    code: '',
    error: null,
    isLoading: false,
    isNewUser: false,
    codeExpired: false,
    attemptsLeft: 3
  });

  // Step 1: Solicitar código
  const handleRequestCode = useCallback(async () => {
    if (!state.phone.trim()) {
      setState(prev => ({ ...prev, error: 'Por favor, insira seu número de telefone' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await whatsappAuthService.requestAuthenticationCode(
        state.phone,
        storeId
      );

      if (result.success) {
        setState(prev => ({
          ...prev,
          step: 'code',
          isLoading: false,
          isNewUser: false,
          code: '',
          error: null,
          attemptsLeft: 3
        }));

        toast.success('Código enviado via WhatsApp! 📱');
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.message || 'Erro ao solicitar código'
        }));
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
  }, [state.phone, storeId]);

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

        // Callback se fornecido
        if (onAuthSuccess && result.token && result.user) {
          onAuthSuccess(result.token, result.user);
        }

        // Redirecionar após 2 segundos
        setTimeout(() => {
          router.push(redirectTo);
        }, 2000);
      } else {
        if (result.locked) {
          setState(prev => ({
            ...prev,
            step: 'error',
            isLoading: false,
            error: 'Código bloqueado. Solicite um novo código.',
            codeExpired: true
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
              attemptsLeft: 0
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
  }, [state.phone, storeId, state.attemptsLeft, onAuthSuccess, redirectTo, router]);

  // Voltar para a entrada de telefone
  const handleBackToPhone = useCallback(() => {
    setState(prev => ({
      ...prev,
      step: 'phone',
      code: '',
      error: null,
      codeExpired: false,
      attemptsLeft: 3
    }));
  }, []);

  // Solicitar novo código
  const handleRequestNewCode = useCallback(() => {
    handleRequestCode();
  }, [handleRequestCode]);

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
              Autentique com WhatsApp
            </h2>
            <p className="text-gray-600">
              Insira seu número de telefone para receber um código
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
                    if (e.key === 'Enter') {
                      handleRequestCode();
                    }
                  }}
                  disabled={state.isLoading}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Enviando código...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5" />
                  <span>Receber Código</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            🔒 Seu número é protegido. Você receberá um código de 6 dígitos no WhatsApp.
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
            <p className="text-gray-600">
              Insira o código de 6 dígitos enviado para
              <br />
              <span className="font-semibold">{state.phone}</span>
            </p>
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
              Você será redirecionado em instantes...
            </p>
          </div>

          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
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

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-red-900">O que fazer:</h3>
            <ul className="text-sm text-red-800 space-y-1">
              <li>• Verifique se o código está correto</li>
              <li>• Código expira em 15 minutos</li>
              <li>• Pode ter sido bloqueado por muitas tentativas</li>
            </ul>
          </div>

          <div className="flex flex-col space-y-3">
            <button
              onClick={handleBackToPhone}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              Solicitar Novo Código
            </button>

            <button
              onClick={() => router.push('/checkout')}
              className="w-full py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppCodeAuth;
