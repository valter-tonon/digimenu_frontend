'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Phone, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { whatsappAuthService } from '@/services/whatsappAuth';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { toast } from 'react-hot-toast';

enum LoginStep {
  PHONE_INPUT,
  CODE_VERIFICATION
}

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const { login } = useAuth();

  const [step, setStep] = useState<LoginStep>(LoginStep.PHONE_INPUT);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const storeId = params?.storeId as string;
  const tableId = params?.tableId as string;

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Por favor, informe um número de telefone válido');
      return;
    }

    setIsLoading(true);

    try {
      const response = await whatsappAuthService.requestAuthenticationCode(phoneNumber, storeId);

      if (response.success) {
        setStep(LoginStep.CODE_VERIFICATION);
        toast.success('Código enviado para seu WhatsApp');
      } else {
        toast.error(response.message || 'Erro ao solicitar código');
      }
    } catch (error) {
      console.error('Erro ao solicitar código:', error);
      toast.error('Não foi possível enviar o código de verificação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Por favor, informe o código de 6 dígitos');
      return;
    }

    setIsLoading(true);

    try {
      const response = await whatsappAuthService.validateAuthenticationCode(
        phoneNumber,
        verificationCode,
        storeId
      );

      if (response.success && response.token) {
        login(response.token);
        toast.success('Login realizado com sucesso!');
        router.push(`/${storeId}/${tableId}`);
      } else {
        toast.error(response.message || response.error || 'Código inválido');
      }
    } catch (error) {
      console.error('Erro ao verificar código:', error);
      toast.error('Código inválido ou expirado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 pb-20">
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-center mb-6">
            {step === LoginStep.PHONE_INPUT ? 'Acesse sua conta' : 'Verificar código'}
          </h1>

          {step === LoginStep.PHONE_INPUT ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Número de WhatsApp
                </label>
                <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                  <div className="bg-gray-100 p-2 border-r border-gray-300">
                    <Phone className="w-5 h-5 text-gray-500" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    className="flex-1 py-2 px-3 focus:outline-none"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Você receberá um código de verificação no WhatsApp
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-primary text-white rounded-md flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : null}
                Receber código
              </button>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                  Código de verificação
                </label>
                <input
                  id="code"
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  Informe o código enviado para {phoneNumber}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md flex items-center justify-center"
                  onClick={() => setStep(LoginStep.PHONE_INPUT)}
                  disabled={isLoading}
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Voltar
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-primary text-white rounded-md flex items-center justify-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : null}
                  Verificar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <BottomNavigation storeId={storeId} tableId={tableId} />
    </div>
  );
} 