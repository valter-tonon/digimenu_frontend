'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useWhatsAppAuth } from '@/hooks/use-whatsapp-auth';
import { Loader2, CheckCircle, AlertCircle, MessageCircle, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CallbackError {
  code: string;
  message: string;
  canRetry?: boolean;
}

function WhatsAppCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams() || new URLSearchParams();
  const params = useParams();
  const { verifyToken } = useWhatsAppAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired' | 'invalid'>('loading');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<CallbackError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Log access for audit purposes
  useEffect(() => {
    const logAccess = () => {
      const token = searchParams?.get('token');
      const user = searchParams?.get('user');
      const errorCode = searchParams?.get('code');
      const errorMessage = searchParams?.get('message');
      const pathParams = params?.params as string[] | undefined;
      
      // Log callback access
      console.log('WhatsApp callback accessed', {
        timestamp: new Date().toISOString(),
        hasToken: !!token,
        hasUser: !!user,
        hasError: !!(errorCode || errorMessage),
        pathParams: pathParams,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        fullUrl: window.location.href
      });
    };

    logAccess();
  }, [searchParams, params]);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if this is an error callback from backend
        const errorCode = searchParams.get('code');
        const errorMessage = searchParams.get('message');
        
        if (errorCode || errorMessage) {
          handleBackendError(errorCode, errorMessage);
          return;
        }

        // Check if this is a direct token callback from backend redirect
        const directToken = searchParams.get('token');
        const userJson = searchParams.get('user');
        
        if (directToken && userJson) {
          await handleDirectTokenCallback(directToken, userJson);
          return;
        }

        // Check for token in path parameters (magic link verification)
        const pathParams = params?.params as string[] | undefined;
        const pathToken = pathParams?.[0];
        
        if (pathToken) {
          await handleMagicLinkVerification(pathToken);
          return;
        }

        // No valid token found
        setStatus('error');
        setError({
          code: 'NO_TOKEN',
          message: 'Token não encontrado na URL',
          canRetry: true
        });
        setMessage('Link inválido ou malformado');
        
      } catch (err: any) {
        console.error('Callback handling error:', err);
        setStatus('error');
        setError({
          code: 'CALLBACK_ERROR',
          message: err.message || 'Erro inesperado no callback',
          canRetry: true
        });
        setMessage('Erro ao processar autenticação');
      }
    };

    handleCallback();
  }, [searchParams, params, verifyToken, router]);

  const handleBackendError = (code: string | null, message: string | null) => {
    console.error('Backend error in callback:', { code, message });
    
    switch (code) {
      case 'TOKEN_INVALID':
        setStatus('invalid');
        setError({
          code: 'TOKEN_INVALID',
          message: 'Link inválido ou expirado',
          canRetry: true
        });
        setMessage('O link que você clicou é inválido ou já foi usado');
        break;
        
      case 'TOKEN_EXPIRED':
        setStatus('expired');
        setError({
          code: 'TOKEN_EXPIRED',
          message: 'Link expirado',
          canRetry: true
        });
        setMessage('Este link expirou. Links mágicos são válidos por apenas 10 minutos');
        break;
        
      case 'VERIFICATION_FAILED':
        setStatus('error');
        setError({
          code: 'VERIFICATION_FAILED',
          message: 'Falha na verificação',
          canRetry: true
        });
        setMessage('Não foi possível verificar sua autenticação');
        break;
        
      default:
        setStatus('error');
        setError({
          code: code || 'UNKNOWN_ERROR',
          message: message || 'Erro desconhecido',
          canRetry: true
        });
        setMessage(message || 'Ocorreu um erro durante a autenticação');
    }
  };

  const handleDirectTokenCallback = async (token: string, userJson: string) => {
    try {
      // Parse user data
      const user = JSON.parse(decodeURIComponent(userJson));
      
      // Store the token and user data directly (this is already a valid JWT from backend)
      if (typeof window !== 'undefined') {
        const authData = {
          jwt: token,
          user: user,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
        };
        localStorage.setItem('whatsapp_auth_jwt', JSON.stringify(authData));
      }
      
      setStatus('success');
      setMessage('Autenticação realizada com sucesso!');
      
      // Log successful authentication
      console.log('Direct token authentication successful', {
        userId: user.id,
        timestamp: new Date().toISOString()
      });
      
      // Redirect to checkout after a short delay
      setTimeout(() => {
        router.push('/checkout');
      }, 2000);
      
    } catch (err: any) {
      console.error('Direct token callback error:', err);
      setStatus('error');
      setError({
        code: 'TOKEN_PROCESSING_ERROR',
        message: 'Erro ao processar token de autenticação',
        canRetry: true
      });
      setMessage('Falha ao processar dados de autenticação');
    }
  };

  const handleMagicLinkVerification = async (token: string) => {
    try {
      setStatus('loading');
      setMessage('Verificando link mágico...');
      
      // Use the verifyToken method from the hook
      await verifyToken(token);
      
      setStatus('success');
      setMessage('Autenticação realizada com sucesso!');
      
      // Log successful verification
      console.log('Magic link verification successful', {
        timestamp: new Date().toISOString()
      });
      
      // Redirect to checkout after a short delay
      setTimeout(() => {
        router.push('/checkout');
      }, 2000);
      
    } catch (err: any) {
      console.error('Magic link verification failed:', err);
      
      // Parse error details
      if (err.message?.includes('expired') || err.message?.includes('expirado')) {
        setStatus('expired');
        setError({
          code: 'TOKEN_EXPIRED',
          message: 'Link expirado',
          canRetry: true
        });
        setMessage('Este link expirou. Links mágicos são válidos por apenas 10 minutos');
      } else if (err.message?.includes('invalid') || err.message?.includes('inválido')) {
        setStatus('invalid');
        setError({
          code: 'TOKEN_INVALID',
          message: 'Link inválido',
          canRetry: true
        });
        setMessage('O link que você clicou é inválido ou já foi usado');
      } else {
        setStatus('error');
        setError({
          code: 'VERIFICATION_ERROR',
          message: err.message || 'Erro na verificação',
          canRetry: true
        });
        setMessage('Falha na autenticação. Tente novamente.');
      }
    }
  };

  const handleRetry = async () => {
    if (retryCount >= 3) {
      toast.error('Muitas tentativas. Solicite um novo link.');
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    try {
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to re-process the callback
      const pathParams = params?.params as string[] | undefined;
      const pathToken = pathParams?.[0];
      
      if (pathToken) {
        await handleMagicLinkVerification(pathToken);
      }
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleReturnToCheckout = () => {
    // Clear any stored auth data before returning
    if (typeof window !== 'undefined') {
      localStorage.removeItem('whatsapp_auth_jwt');
    }
    router.push('/checkout');
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center space-y-4">
            <div className="relative">
              <MessageCircle className="w-16 h-16 text-blue-500 mx-auto" />
              <Loader2 className="w-6 h-6 animate-spin absolute -bottom-1 -right-1 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Verificando Autenticação</h1>
            <p className="text-gray-600">
              Aguarde enquanto validamos seu link mágico...
            </p>
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            </div>
            <div className="text-xs text-gray-500 mt-4">
              Este processo pode levar alguns segundos
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Autenticação Realizada!</h1>
            <p className="text-gray-600">{message}</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                <p className="text-sm text-green-700">
                  Redirecionando você de volta ao checkout...
                </p>
              </div>
            </div>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Link Expirado</h1>
            <p className="text-gray-600">{message}</p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-700 mb-3">
                Os links mágicos expiram em 10 minutos por segurança.
              </p>
              <button
                onClick={handleReturnToCheckout}
                className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
              >
                Solicitar Novo Link
              </button>
            </div>
            {error && (
              <div className="text-xs text-gray-500 mt-2">
                Código do erro: {error.code}
              </div>
            )}
          </div>
        );

      case 'invalid':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Link Inválido</h1>
            <p className="text-gray-600">{message}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 mb-3">
                Este link pode ter sido usado anteriormente ou é inválido.
              </p>
              <button
                onClick={handleReturnToCheckout}
                className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
              >
                Solicitar Novo Link
              </button>
            </div>
            {error && (
              <div className="text-xs text-gray-500 mt-2">
                Código do erro: {error.code}
              </div>
            )}
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Erro na Autenticação</h1>
            <p className="text-gray-600">{message}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
              <p className="text-sm text-red-700">
                Não foi possível validar seu link mágico.
              </p>
              
              {error?.canRetry && retryCount < 3 && (
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isRetrying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Tentando novamente...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Tentar Novamente ({3 - retryCount} tentativas restantes)</span>
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={handleReturnToCheckout}
                className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
              >
                Solicitar Novo Link
              </button>
            </div>
            {error && (
              <div className="text-xs text-gray-500 mt-2">
                Código do erro: {error.code}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-6">
        {renderContent()}
        
        {status !== 'loading' && status !== 'success' && (
          <div className="mt-6 pt-4 border-t">
            <button
              onClick={handleReturnToCheckout}
              className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Voltar ao Checkout
            </button>
          </div>
        )}
        
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
            <div>Status: {status}</div>
            <div>Retry Count: {retryCount}</div>
            {error && <div>Error Code: {error.code}</div>}
            <div>URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
            <div>Params: {JSON.stringify(params)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WhatsAppCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </div>
    }>
      <WhatsAppCallbackContent />
    </Suspense>
  );
}