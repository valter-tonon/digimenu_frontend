'use client';

import { useState } from 'react';
import { Settings, Save, Clock, MapPin, CreditCard, Bell } from 'lucide-react';

interface Preferences {
  delivery: {
    preferredTime: string;
    maxWaitTime: number;
    autoConfirmOrders: boolean;
    savePaymentMethod: boolean;
  };
  notifications: {
    orderStatus: boolean;
    promotions: boolean;
    newProducts: boolean;
    deliveryUpdates: boolean;
  };
  privacy: {
    shareData: boolean;
    marketingEmails: boolean;
    locationServices: boolean;
  };
}

export function PreferencesSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>({
    delivery: {
      preferredTime: '30',
      maxWaitTime: 60,
      autoConfirmOrders: false,
      savePaymentMethod: true
    },
    notifications: {
      orderStatus: true,
      promotions: true,
      newProducts: false,
      deliveryUpdates: true
    },
    privacy: {
      shareData: false,
      marketingEmails: true,
      locationServices: true
    }
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implementar chamada real à API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Mostrar toast de sucesso
      console.log('Preferências salvas:', preferences);
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      // TODO: Mostrar toast de erro
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeliveryChange = (field: keyof Preferences['delivery'], value: any) => {
    setPreferences(prev => ({
      ...prev,
      delivery: {
        ...prev.delivery,
        [field]: value
      }
    }));
  };

  const handleNotificationChange = (field: keyof Preferences['notifications'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value
      }
    }));
  };

  const handlePrivacyChange = (field: keyof Preferences['privacy'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [field]: value
      }
    }));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Preferências de Pedido</h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Salvando...' : 'Salvar Preferências'}
        </button>
      </div>

      <div className="space-y-8">
        {/* Preferências de Entrega */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-medium text-gray-900">Preferências de Entrega</h3>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tempo de Entrega Preferido
              </label>
              <select
                value={preferences.delivery.preferredTime}
                onChange={(e) => handleDeliveryChange('preferredTime', e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">1 hora</option>
                <option value="90">1 hora e 30 minutos</option>
                <option value="120">2 horas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tempo Máximo de Espera
              </label>
              <select
                value={preferences.delivery.maxWaitTime}
                onChange={(e) => handleDeliveryChange('maxWaitTime', parseInt(e.target.value))}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>1 hora</option>
                <option value={90}>1 hora e 30 minutos</option>
                <option value={120}>2 horas</option>
                <option value={180}>3 horas</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.delivery.autoConfirmOrders}
                  onChange={(e) => handleDeliveryChange('autoConfirmOrders', e.target.checked)}
                  className="mr-3"
                />
                <span className="text-sm text-gray-700">
                  Confirmar pedidos automaticamente (sem precisar de confirmação manual)
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.delivery.savePaymentMethod}
                  onChange={(e) => handleDeliveryChange('savePaymentMethod', e.target.checked)}
                  className="mr-3"
                />
                <span className="text-sm text-gray-700">
                  Salvar método de pagamento para futuros pedidos
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Notificações */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-medium text-gray-900">Notificações</h3>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.notifications.orderStatus}
                onChange={(e) => handleNotificationChange('orderStatus', e.target.checked)}
                className="mr-3"
              />
              <span className="text-sm text-gray-700">
                Atualizações de status do pedido
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.notifications.promotions}
                onChange={(e) => handleNotificationChange('promotions', e.target.checked)}
                className="mr-3"
              />
              <span className="text-sm text-gray-700">
                Promoções e ofertas especiais
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.notifications.newProducts}
                onChange={(e) => handleNotificationChange('newProducts', e.target.checked)}
                className="mr-3"
              />
              <span className="text-sm text-gray-700">
                Novos produtos no cardápio
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.notifications.deliveryUpdates}
                onChange={(e) => handleNotificationChange('deliveryUpdates', e.target.checked)}
                className="mr-3"
              />
              <span className="text-sm text-gray-700">
                Atualizações sobre entrega (localização do entregador)
              </span>
            </label>
          </div>
        </div>

        {/* Privacidade */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-medium text-gray-900">Privacidade e Dados</h3>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.privacy.shareData}
                onChange={(e) => handlePrivacyChange('shareData', e.target.checked)}
                className="mr-3"
              />
              <span className="text-sm text-gray-700">
                Compartilhar dados de uso para melhorar a experiência
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.privacy.marketingEmails}
                onChange={(e) => handlePrivacyChange('marketingEmails', e.target.checked)}
                className="mr-3"
              />
              <span className="text-sm text-gray-700">
                Receber e-mails de marketing e novidades
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.privacy.locationServices}
                onChange={(e) => handlePrivacyChange('locationServices', e.target.checked)}
                className="mr-3"
              />
              <span className="text-sm text-gray-700">
                Permitir acesso à localização para melhorar a entrega
              </span>
            </label>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Dica</h4>
          <p className="text-sm text-blue-700">
            Suas preferências ajudam a personalizar sua experiência e tornar os pedidos mais rápidos e convenientes. 
            Você pode alterar essas configurações a qualquer momento.
          </p>
        </div>
      </div>
    </div>
  );
} 