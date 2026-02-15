'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Mail, Phone, Edit3, Save, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { whatsappAuthService } from '@/services/whatsappAuth';
import {
  findCustomerByPhone,
  getCustomerProfile,
  updateCustomerProfile,
  type CustomerData,
  type CustomerUpdateData,
} from '@/services/customerService';

/** Filtra emails fake gerados pelo sistema (ex: whatsapp_xxx@temp.local) */
function filterFakeEmail(email?: string | null): string {
  if (!email) return '';
  if (email.endsWith('@temp.local')) return '';
  if (email.endsWith('@placeholder.local')) return '';
  if (email.startsWith('whatsapp_')) return '';
  return email;
}

interface UserProfileProps {
  /** ID do cliente (opcional - se não informado, detecta automaticamente via auth) */
  customerId?: number;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  mobile_phone: string;
}

export function UserProfile({ customerId: propCustomerId }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    mobile_phone: '',
  });

  // Carregar dados do cliente
  const loadCustomerData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Tentar obter dados da autenticação WhatsApp
      const storedAuth = whatsappAuthService.getStoredAuth();
      const jwt = whatsappAuthService.getCurrentJWT();

      if (!storedAuth?.user && !propCustomerId) {
        setError('Você precisa estar autenticado para ver seu perfil.');
        setIsLoading(false);
        return;
      }

      // IMPORTANTE: O WhatsApp auth armazena o User ID (tabela users),
      // mas os endpoints de customer usam Customer ID (tabela customers).
      // Precisamos buscar o Customer pelo telefone para obter o ID correto.
      const phone = storedAuth?.user?.phone;
      const tenantId = storedAuth?.user?.tenant_id;

      // Primeiro, buscar por telefone para obter o Customer ID real
      if (phone) {
        const findResult = await findCustomerByPhone(phone, tenantId);
        if (findResult.success && findResult.data) {
          const customerId = findResult.data.id;

          // Tentar endpoint autenticado para dados completos (birth_date, preferences, etc.)
          if (jwt) {
            const profileResult = await getCustomerProfile(customerId, jwt);
            if (profileResult.success && profileResult.data) {
              setCustomer(profileResult.data);
              setFormData({
                name: profileResult.data.name || '',
                email: profileResult.data.email || '',
                phone: profileResult.data.phone || '',
                mobile_phone: profileResult.data.mobile_phone || '',
              });
              setIsLoading(false);
              return;
            }
          }

          // Usar dados básicos do findByPhone
          setCustomer(findResult.data);
          setFormData({
            name: findResult.data.name || '',
            email: findResult.data.email || '',
            phone: findResult.data.phone || '',
            mobile_phone: findResult.data.mobile_phone || '',
          });
          setIsLoading(false);
          return;
        }
      }

      // Último fallback: usar dados do auth local
      if (storedAuth?.user) {
        const user = storedAuth.user;
        const cleanEmail = filterFakeEmail(user.email);
        const localCustomer: CustomerData = {
          id: user.id,
          name: user.name,
          email: cleanEmail,
          phone: user.phone,
          active: true,
        };
        setCustomer(localCustomer);
        setFormData({
          name: user.name || '',
          email: cleanEmail,
          phone: user.phone || '',
          mobile_phone: '',
        });
      } else {
        setError('Não foi possível carregar seus dados.');
      }
    } catch (err) {
      console.error('Erro ao carregar dados do cliente:', err);
      setError('Erro ao carregar dados do perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [propCustomerId]);

  useEffect(() => {
    loadCustomerData();
  }, [loadCustomerData]);

  const handleSave = async () => {
    if (!customer) return;
    
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const jwt = whatsappAuthService.getCurrentJWT();

      if (!jwt) {
        setError('Sessão expirada. Por favor, faça login novamente.');
        setIsSaving(false);
        return;
      }

      const updateData: CustomerUpdateData = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone,
        mobile_phone: formData.mobile_phone || undefined,
      };

      const result = await updateCustomerProfile(customer.id, updateData, jwt);

      if (result.success) {
        // Atualizar dados locais
        if (result.data) {
          setCustomer(result.data);
        } else {
          setCustomer(prev => prev ? { ...prev, ...updateData } : prev);
        }

        // Atualizar dados do storedAuth para refletir no header
        try {
          const storedAuth = whatsappAuthService.getStoredAuth();
          if (storedAuth?.user) {
            const updatedAuth = {
              ...storedAuth,
              user: {
                ...storedAuth.user,
                name: formData.name || storedAuth.user.name,
                email: formData.email || undefined,
              },
            };
            // Salvar auth atualizado no localStorage (mesma chave do whatsappAuthService)
            localStorage.setItem('whatsapp_auth_jwt', JSON.stringify(updatedAuth));
            // Disparar evento para o header atualizar
            window.dispatchEvent(new Event('profile-updated'));
          }
        } catch (err) {
          console.error('Erro ao atualizar auth local:', err);
        }

        setIsEditing(false);
        setSuccessMessage('Perfil atualizado com sucesso!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        if (result.errors) {
          const firstError = Object.values(result.errors)[0];
          setError(Array.isArray(firstError) ? firstError[0] : String(firstError));
        } else {
          setError(result.message || 'Erro ao salvar perfil.');
        }
      }
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      setError('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        mobile_phone: customer.mobile_phone || '',
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  // Estado de erro sem dados
  if (error && !customer) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-2">Erro ao carregar perfil</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={loadCustomerData}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Mensagens de feedback */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{successMessage}</span>
        </div>
      )}

      {error && customer && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Informações Pessoais</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Editar
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
              <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar e informações básicas */}
        <div className="lg:col-span-1">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mx-auto mb-4">
                {customer?.image ? (
                  <img
                    src={customer.image}
                    alt="Avatar do usuário"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-amber-100">
                    <User className="w-16 h-16 text-amber-500" />
                  </div>
                )}
              </div>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {customer?.name || 'Sem nome'}
            </h3>
            
            {customer?.created_at && (
              <p className="text-sm text-gray-500">
                Cliente desde {new Date(customer.created_at).getFullYear()}
              </p>
            )}
          </div>
        </div>

        {/* Informações detalhadas */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Informações de contato */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Informações de Contato</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Nome
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Seu nome completo"
                    />
                  ) : (
                    <p className="text-gray-900">{customer?.name || '-'}</p>
                  )}
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    E-mail
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="seu@email.com"
                    />
                  ) : (
                    <p className="text-gray-900">{customer?.email || '-'}</p>
                  )}
                </div>
                
                {/* Telefone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Telefone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="(11) 99999-9999"
                    />
                  ) : (
                    <p className="text-gray-900">{customer?.phone || '-'}</p>
                  )}
            </div>

                {/* Telefone alternativo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Celular / Alternativo
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.mobile_phone}
                      onChange={(e) => handleInputChange('mobile_phone', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="(11) 99999-9999"
                    />
                  ) : (
                    <p className="text-gray-900">{customer?.mobile_phone || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Preferências alimentares (somente leitura por enquanto) */}
            {customer?.preferences && (
            <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Preferências</h4>
                <div className="space-y-3">
                  {customer.preferences.dietary_restrictions && customer.preferences.dietary_restrictions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Restrições Dietéticas
                  </label>
                    <div className="flex flex-wrap gap-2">
                        {customer.preferences.dietary_restrictions.map((restriction) => (
                        <span key={restriction} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {restriction}
                        </span>
                      ))}
                      </div>
                    </div>
                  )}

                  {customer.preferences.allergies && customer.preferences.allergies.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alergias
                  </label>
                    <div className="flex flex-wrap gap-2">
                        {customer.preferences.allergies.map((allergy) => (
                        <span key={allergy} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                          {allergy}
                        </span>
                      ))}
                      </div>
                    </div>
                  )}

                  {customer.preferences.preferred_payment_method && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                        Método de Pagamento Preferido
                  </label>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {customer.preferences.preferred_payment_method === 'pix' ? 'PIX' :
                          customer.preferences.preferred_payment_method === 'credit_card' ? 'Cartão de Crédito' :
                          customer.preferences.preferred_payment_method === 'debit_card' ? 'Cartão de Débito' :
                          customer.preferences.preferred_payment_method === 'cash' ? 'Dinheiro' :
                          customer.preferences.preferred_payment_method}
                        </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
