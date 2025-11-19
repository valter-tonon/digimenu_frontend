'use client';

import { useState, useCallback } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { CheckoutState, CustomerData } from '@/services/checkoutStateMachine';
import { toast } from 'react-hot-toast';
import { Loader2, User, Phone, Mail } from 'lucide-react';

interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
}

interface CustomerDataStepProps {
  state: CheckoutState;
  onNextStep: () => void;
  onSetLoading: (loading: boolean) => void;
  onSetError: (error: string | null) => void;
  onSetCustomerData: (data: CustomerData) => void;
  onMarkStepComplete: (step: 'customer_data') => void;
}

/**
 * Step de coleta de dados do cliente
 *
 * Responsabilidades:
 * - Renderizar formulário com nome, telefone e email
 * - Validar dados de entrada
 * - Salvar dados no estado global
 * - Avançar para próximo step
 */
export default function CustomerDataStep({
  state,
  onNextStep,
  onSetLoading,
  onSetError,
  onSetCustomerData,
  onMarkStepComplete,
}: CustomerDataStepProps) {
  const { data: contextData } = useAppContext();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: state.customerData?.name || '',
    phone: state.customerData?.phone || '',
    email: state.customerData?.email || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Formatação de telefone
  const formatPhone = useCallback((value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  }, []);

  // Handle input change
  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    let formattedValue = value;

    if (field === 'phone') {
      formattedValue = formatPhone(value);
    }

    setFormData((prev) => ({
      ...prev,
      [field]: formattedValue,
    }));

    // Limpar erro do campo
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Validação do formulário
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else {
      const numbersOnly = formData.phone.replace(/\D/g, '');
      if (numbersOnly.length < 10) {
        newErrors.phone = 'Telefone deve ter pelo menos 10 dígitos';
      }
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Submit do formulário
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setSubmitting(true);
    onSetLoading(true);

    try {
      // Salvar dados no estado global
      const customerData: CustomerData = {
        name: formData.name.trim(),
        phone: formData.phone.replace(/\D/g, ''), // Salvar apenas números
        email: formData.email.trim() || undefined,
      };

      onSetCustomerData(customerData);
      onMarkStepComplete('customer_data');

      console.log('✅ Dados do cliente salvos:', customerData);
      toast.success('Dados salvos com sucesso!');

      // Avançar para próximo step
      setTimeout(() => {
        onNextStep();
      }, 500);
    } catch (error: any) {
      console.error('❌ Erro ao salvar dados:', error);
      onSetError(error?.message || 'Erro ao salvar dados');
      toast.error('Erro ao salvar dados. Tente novamente.');
    } finally {
      setSubmitting(false);
      onSetLoading(false);
    }
  }, [validateForm, onSetCustomerData, onMarkStepComplete, onNextStep, onSetLoading, onSetError]);

  return (
    <div className="space-y-6">
      {/* Título da etapa */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mb-4">
          <User className="w-6 h-6 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Seus Dados</h2>
        <p className="text-gray-600">Precisamos de algumas informações para finalizar seu pedido</p>
      </div>

      {/* Formulário */}
      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome completo *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Seu nome completo"
              disabled={submitting}
              data-testid="customer-name"
            />
          </div>
          {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Telefone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                errors.phone ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="(11) 99999-9999"
              disabled={submitting}
              data-testid="customer-phone"
            />
          </div>
          {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
        </div>

        {/* E-mail */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            E-mail (opcional)
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="seu@email.com"
              disabled={submitting}
              data-testid="customer-email"
            />
          </div>
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Informação sobre privacidade */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Seus dados são utilizados apenas para processar seu pedido e não são compartilhados com
            terceiros.
          </p>
        </div>
      </div>
    </div>
  );
}
