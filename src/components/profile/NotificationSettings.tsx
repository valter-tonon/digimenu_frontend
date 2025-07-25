'use client';

import { useState } from 'react';
import { Bell, Save, Smartphone, Mail, MessageSquare, Clock } from 'lucide-react';

interface NotificationSettings {
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  types: {
    orderStatus: boolean;
    promotions: boolean;
    newProducts: boolean;
    deliveryUpdates: boolean;
    orderReminders: boolean;
    birthdayOffers: boolean;
    loyaltyRewards: boolean;
  };
  schedule: {
    quietHours: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
}

export function NotificationSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    channels: {
      push: true,
      email: true,
      sms: false,
      whatsapp: true
    },
    types: {
      orderStatus: true,
      promotions: true,
      newProducts: false,
      deliveryUpdates: true,
      orderReminders: true,
      birthdayOffers: true,
      loyaltyRewards: true
    },
    schedule: {
      quietHours: true,
      startTime: '22:00',
      endTime: '08:00',
      timezone: 'America/Sao_Paulo'
    }
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implementar chamada real à API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Mostrar toast de sucesso
      console.log('Configurações de notificação salvas:', settings);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      // TODO: Mostrar toast de erro
    } finally {
      setIsSaving(false);
    }
  };

  const handleChannelChange = (channel: keyof NotificationSettings['channels'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: value
      }
    }));
  };

  const handleTypeChange = (type: keyof NotificationSettings['types'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: value
      }
    }));
  };

  const handleScheduleChange = (field: keyof NotificationSettings['schedule'], value: any) => {
    setSettings(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [field]: value
      }
    }));
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'push': return <Bell className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <Smartphone className="w-4 h-4" />;
      case 'whatsapp': return <MessageSquare className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'push': return 'Notificações Push';
      case 'email': return 'E-mail';
      case 'sms': return 'SMS';
      case 'whatsapp': return 'WhatsApp';
      default: return channel;
    }
  };

  const getChannelDescription = (channel: string) => {
    switch (channel) {
      case 'push': return 'Notificações no navegador e aplicativo';
      case 'email': return 'Receba notificações por e-mail';
      case 'sms': return 'Mensagens de texto para o seu celular';
      case 'whatsapp': return 'Mensagens diretas no WhatsApp';
      default: return '';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Configurações de Notificações</h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>

      <div className="space-y-8">
        {/* Canais de Notificação */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Canais de Notificação</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(settings.channels).map(([channel, enabled]) => (
              <div
                key={channel}
                className={`p-4 border rounded-lg transition-colors ${
                  enabled 
                    ? 'border-amber-300 bg-amber-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      enabled ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {getChannelIcon(channel)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{getChannelLabel(channel)}</h4>
                      <p className="text-sm text-gray-600">{getChannelDescription(channel)}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => handleChannelChange(channel as any, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tipos de Notificação */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tipos de Notificação</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            {Object.entries(settings.types).map(([type, enabled]) => (
              <label key={type} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div>
                  <span className="font-medium text-gray-900">
                    {type === 'orderStatus' && 'Status do Pedido'}
                    {type === 'promotions' && 'Promoções e Ofertas'}
                    {type === 'newProducts' && 'Novos Produtos'}
                    {type === 'deliveryUpdates' && 'Atualizações de Entrega'}
                    {type === 'orderReminders' && 'Lembretes de Pedido'}
                    {type === 'birthdayOffers' && 'Ofertas de Aniversário'}
                    {type === 'loyaltyRewards' && 'Recompensas de Fidelidade'}
                  </span>
                  <p className="text-sm text-gray-600">
                    {type === 'orderStatus' && 'Receba atualizações sobre o status do seu pedido'}
                    {type === 'promotions' && 'Fique por dentro das melhores ofertas'}
                    {type === 'newProducts' && 'Seja o primeiro a conhecer novos produtos'}
                    {type === 'deliveryUpdates' && 'Acompanhe a localização do entregador'}
                    {type === 'orderReminders' && 'Lembretes para finalizar pedidos abandonados'}
                    {type === 'birthdayOffers' && 'Ofertas especiais no seu aniversário'}
                    {type === 'loyaltyRewards' && 'Pontos e recompensas do programa de fidelidade'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => handleTypeChange(type as any, e.target.checked)}
                  className="w-4 h-4 text-amber-500 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 focus:ring-2"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Horário Silencioso */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Horário Silencioso</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-amber-500" />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.schedule.quietHours}
                  onChange={(e) => handleScheduleChange('quietHours', e.target.checked)}
                  className="mr-3"
                />
                <span className="text-sm text-gray-700">
                  Ativar horário silencioso (não receber notificações em horários específicos)
                </span>
              </label>
            </div>

            {settings.schedule.quietHours && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Início
                  </label>
                  <input
                    type="time"
                    value={settings.schedule.startTime}
                    onChange={(e) => handleScheduleChange('startTime', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fim
                  </label>
                  <input
                    type="time"
                    value={settings.schedule.endTime}
                    onChange={(e) => handleScheduleChange('endTime', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuso Horário
                  </label>
                  <select
                    value={settings.schedule.timezone}
                    onChange={(e) => handleScheduleChange('timezone', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                    <option value="America/Manaus">Manaus (GMT-4)</option>
                    <option value="America/Belem">Belém (GMT-3)</option>
                    <option value="America/Fortaleza">Fortaleza (GMT-3)</option>
                    <option value="America/Recife">Recife (GMT-3)</option>
                    <option value="America/Maceio">Maceió (GMT-3)</option>
                    <option value="America/Aracaju">Aracaju (GMT-3)</option>
                    <option value="America/Salvador">Salvador (GMT-3)</option>
                    <option value="America/Bahia">Bahia (GMT-3)</option>
                    <option value="America/Vitoria">Vitória (GMT-3)</option>
                    <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
                    <option value="America/Porto_Velho">Porto Velho (GMT-4)</option>
                    <option value="America/Cuiaba">Cuiabá (GMT-4)</option>
                    <option value="America/Campo_Grande">Campo Grande (GMT-4)</option>
                    <option value="America/Goiania">Goiânia (GMT-3)</option>
                    <option value="America/Boa_Vista">Boa Vista (GMT-4)</option>
                    <option value="America/Palmas">Palmas (GMT-3)</option>
                    <option value="America/Araguaina">Araguaína (GMT-3)</option>
                    <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                    <option value="America/Campo_Grande">Campo Grande (GMT-4)</option>
                    <option value="America/Cuiaba">Cuiabá (GMT-4)</option>
                    <option value="America/Porto_Velho">Porto Velho (GMT-4)</option>
                    <option value="America/Boa_Vista">Boa Vista (GMT-4)</option>
                    <option value="America/Manaus">Manaus (GMT-4)</option>
                    <option value="America/Eirunepe">Eirunepé (GMT-5)</option>
                    <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
                    <option value="America/Noronha">Fernando de Noronha (GMT-2)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-900 mb-2">✅ Configurações Ativas</h4>
          <p className="text-sm text-green-700">
            Suas configurações de notificação estão ativas. Você receberá notificações apenas pelos canais e tipos selecionados.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">🔔 Dica</h4>
          <p className="text-sm text-blue-700">
            Configure os canais e tipos de notificação que mais fazem sentido para você. 
            Isso ajuda a manter você informado sem ser excessivo.
          </p>
        </div>
      </div>
    </div>
  );
} 