'use client';

import { useState, useEffect } from 'react';
import { X, Shield, Info } from 'lucide-react';
import { useUserTracking } from '@/services/userTracking';

interface CookieConsentBannerProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

export function CookieConsentBanner({ onAccept, onDecline }: CookieConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { isOptedOut, trackUser, optOut } = useUserTracking();

  useEffect(() => {
    // Verificar se o usuário já fez uma escolha
    const hasConsent = localStorage.getItem('cookie_consent');
    const isUserOptedOut = isOptedOut();
    
    // Mostrar banner apenas se não há consentimento e não optou por sair
    if (!hasConsent && !isUserOptedOut) {
      setIsVisible(true);
    }
  }, [isOptedOut]);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    trackUser(); // Iniciar rastreamento
    setIsVisible(false);
    onAccept?.();
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    optOut(); // Marcar como opt-out
    setIsVisible(false);
    onDecline?.();
  };

  const handleDismiss = () => {
    // Fechar sem fazer nada (usuário pode decidir depois)
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-cookie-banner bg-white border-t shadow-lg">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-4">
            <div className="flex items-center mb-2">
              <Shield className="w-5 h-5 text-primary mr-2" />
              <h3 className="font-semibold text-gray-800">Cookies e Privacidade</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              Utilizamos cookies para melhorar sua experiência, personalizar conteúdo e analisar o uso do site. 
              Seus dados são tratados conforme nossa política de privacidade e a LGPD.
            </p>

            {showDetails && (
              <div className="bg-gray-50 p-3 rounded-lg mb-3 text-sm text-gray-700">
                <h4 className="font-medium mb-2">Como usamos seus dados:</h4>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>Identificação:</strong> ID único para reconhecer visitas recorrentes</li>
                  <li>• <strong>Fonte de acesso:</strong> Como você chegou ao nosso site (WhatsApp, Google, etc.)</li>
                  <li>• <strong>Histórico de pedidos:</strong> Para facilitar pedidos futuros</li>
                  <li>• <strong>Preferências:</strong> Lembrar suas configurações</li>
                </ul>
                <p className="mt-2 text-xs">
                  <strong>Seus direitos:</strong> Você pode optar por não ser rastreado a qualquer momento. 
                  Os dados são armazenados localmente no seu dispositivo e não são compartilhados com terceiros.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleAccept}
                className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
              >
                Aceitar Cookies
              </button>
              
              <button
                onClick={handleDecline}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Recusar
              </button>
              
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-primary text-sm font-medium hover:underline flex items-center"
              >
                <Info className="w-4 h-4 mr-1" />
                {showDetails ? 'Menos detalhes' : 'Mais detalhes'}
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}