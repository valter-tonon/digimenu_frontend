'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Plus, Edit3, Trash2, Home, Building, Star, Loader2, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { whatsappAuthService } from '@/services/whatsappAuth';
import {
  getCustomerAddresses,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  setDefaultAddress,
  validateAddressByCep,
  findCustomerByPhone,
  type CustomerAddress,
  type AddressFormData,
} from '@/services/customerService';

interface AddressManagerProps {
  /** ID do cliente (opcional - detecta automaticamente via auth) */
  customerId?: number;
}

const EMPTY_FORM: AddressFormData = {
  label: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  zip_code: '',
  reference: '',
  delivery_instructions: '',
  is_default: false,
};

export function AddressManager({ customerId: propCustomerId }: AddressManagerProps) {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resolvedCustomerId, setResolvedCustomerId] = useState<number | null>(propCustomerId || null);
  const [formData, setFormData] = useState<AddressFormData>({ ...EMPTY_FORM });

  // Resolver o ID do cliente (Customer ID, NÃO User ID)
  // O WhatsApp auth armazena o User ID, mas os endpoints de endereço usam Customer ID.
  // Precisamos buscar o Customer pelo telefone para obter o ID correto.
  const resolveCustomerId = useCallback(async (): Promise<number | null> => {
    if (propCustomerId) return propCustomerId;

    const storedAuth = whatsappAuthService.getStoredAuth();

    // Buscar customer pelo telefone para obter o Customer ID real
    const phone = storedAuth?.user?.phone;
    const tenantId = storedAuth?.user?.tenant_id;
    if (phone) {
      const result = await findCustomerByPhone(phone, tenantId);
      if (result.success && result.data?.id) {
        return result.data.id;
      }
    }

    return null;
  }, [propCustomerId]);

  // Carregar endereços do cliente
  const loadAddresses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const customerId = await resolveCustomerId();

      if (!customerId) {
        setError('Você precisa estar autenticado para gerenciar endereços.');
        setIsLoading(false);
        return;
      }

      setResolvedCustomerId(customerId);

      const result = await getCustomerAddresses(customerId);

      if (result.success && result.data) {
        setAddresses(result.data);
      } else {
        setError(result.message || 'Erro ao carregar endereços.');
      }
    } catch (err) {
      console.error('Erro ao carregar endereços:', err);
      setError('Erro ao carregar endereços. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [resolveCustomerId]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // Limpar mensagem de sucesso após 3 segundos
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleAddNew = () => {
    setEditingAddress(null);
    setFormData({
      ...EMPTY_FORM,
      is_default: addresses.length === 0,
    });
    setShowForm(true);
    setError(null);
  };

  const handleEdit = (address: CustomerAddress) => {
    setEditingAddress(address);
    setFormData({
      label: address.label || '',
      street: address.street || '',
      number: address.number || '',
      complement: address.complement || '',
      neighborhood: address.neighborhood || '',
      city: address.city || '',
      state: address.state || '',
      zip_code: address.zip_code || '',
      reference: address.reference || '',
      delivery_instructions: address.delivery_instructions || '',
      is_default: address.is_default || false,
    });
    setShowForm(true);
    setError(null);
  };

  const handleDelete = async (addressId: number) => {
    if (!confirm('Tem certeza que deseja excluir este endereço?')) return;
    if (!resolvedCustomerId) return;

    setError(null);

    try {
      const result = await deleteCustomerAddress(resolvedCustomerId, addressId);

      if (result.success) {
        setAddresses(prev => prev.filter(addr => addr.id !== addressId));
        setSuccessMessage('Endereço excluído com sucesso!');
      } else {
        setError(result.message || 'Erro ao excluir endereço.');
      }
    } catch (err) {
      console.error('Erro ao excluir endereço:', err);
      setError('Erro ao excluir endereço. Tente novamente.');
    }
  };

  const handleSave = async () => {
    if (!resolvedCustomerId) return;

    // Validação básica
    if (!formData.label.trim()) {
      setError('Informe um nome para o endereço (ex: Casa, Trabalho).');
      return;
    }
    if (!formData.street.trim()) {
      setError('Informe a rua.');
      return;
    }
    if (!formData.number.trim()) {
      setError('Informe o número.');
      return;
    }
    if (!formData.neighborhood.trim()) {
      setError('Informe o bairro.');
      return;
    }
    if (!formData.city.trim()) {
      setError('Informe a cidade.');
      return;
    }
    if (!formData.state.trim()) {
      setError('Informe o estado.');
      return;
    }
    if (!formData.zip_code.trim()) {
      setError('Informe o CEP.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Limpar CEP para envio (apenas números)
      const cleanData = {
        ...formData,
        zip_code: formData.zip_code.replace(/\D/g, ''),
      };

      if (editingAddress) {
        // Atualizando endereço existente
        const result = await updateCustomerAddress(resolvedCustomerId, editingAddress.id, cleanData);

        if (result.success && result.data) {
          setAddresses(prev =>
            prev.map(addr => addr.id === editingAddress.id ? result.data! : addr)
          );
          setShowForm(false);
          setEditingAddress(null);
          setSuccessMessage('Endereço atualizado com sucesso!');
        } else {
          setError(result.message || 'Erro ao atualizar endereço.');
        }
      } else {
        // Adicionando novo endereço
        const result = await addCustomerAddress(resolvedCustomerId, cleanData);

        if (result.success && result.data) {
          // Se marcou como padrão, atualizar os outros
          if (cleanData.is_default) {
            setAddresses(prev => [
              ...prev.map(addr => ({ ...addr, is_default: false })),
              result.data!,
            ]);
          } else {
            setAddresses(prev => [...prev, result.data!]);
          }
          setShowForm(false);
          setSuccessMessage('Endereço adicionado com sucesso!');
        } else {
          setError(result.message || 'Erro ao adicionar endereço.');
        }
      }
    } catch (err) {
      console.error('Erro ao salvar endereço:', err);
      setError('Erro ao salvar endereço. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAddress(null);
    setError(null);
  };

  const handleSetDefault = async (addressId: number) => {
    if (!resolvedCustomerId) return;

    setError(null);

    try {
      const result = await setDefaultAddress(resolvedCustomerId, addressId);

      if (result.success) {
        setAddresses(prev =>
          prev.map(addr => ({
        ...addr,
            is_default: addr.id === addressId,
          }))
        );
        setSuccessMessage('Endereço padrão atualizado!');
      } else {
        setError(result.message || 'Erro ao definir endereço padrão.');
      }
    } catch (err) {
      console.error('Erro ao definir endereço padrão:', err);
      setError('Erro ao definir endereço padrão. Tente novamente.');
    }
  };

  // Buscar endereço pelo CEP
  const handleCepSearch = async () => {
    const cep = formData.zip_code.replace(/\D/g, '');
    if (cep.length !== 8) {
      setError('CEP deve ter 8 dígitos.');
      return;
    }

    setIsSearchingCep(true);
    setError(null);

    try {
      const result = await validateAddressByCep(cep);

      if (result.success && result.data) {
        setFormData(prev => ({
          ...prev,
          street: result.data!.street || prev.street,
          neighborhood: result.data!.neighborhood || prev.neighborhood,
          city: result.data!.city || prev.city,
          state: result.data!.state || prev.state,
          zip_code: result.data!.zip_code || prev.zip_code,
        }));
      } else {
        setError(result.message || 'CEP não encontrado.');
      }
    } catch (err) {
      setError('Erro ao consultar CEP.');
    } finally {
      setIsSearchingCep(false);
    }
  };

  const getTypeIcon = (label: string | null | undefined) => {
    const lower = (label || '').toLowerCase();
    if (lower.includes('casa') || lower.includes('home')) return <Home className="w-4 h-4" />;
    if (lower.includes('trabalho') || lower.includes('work') || lower.includes('escritório')) return <Building className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Carregando endereços...</p>
        </div>
      </div>
    );
  }

  // Estado de erro sem dados
  if (error && !resolvedCustomerId) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-2">Erro ao carregar endereços</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={loadAddresses}
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

      {error && resolvedCustomerId && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Gerenciar Endereços</h2>
        {!showForm && (
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar Endereço
        </button>
        )}
      </div>

      {/* Lista de endereços */}
      {!showForm && (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`p-4 border rounded-lg ${
                address.is_default
                  ? 'border-amber-300 bg-amber-50' 
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeIcon(address.label)}
                    <span className="font-medium text-gray-900">{address.label || 'Endereço'}</span>
                    {address.is_default && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Padrão
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-700 mb-1">
                    {address.street}, {address.number}
                    {address.complement && ` - ${address.complement}`}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {address.neighborhood}, {address.city} - {address.state}
                  </p>
                  <p className="text-gray-600 text-sm">
                    CEP: {address.zip_code?.replace(/(\d{5})(\d{3})/, '$1-$2')}
                  </p>
                  {address.reference && (
                    <p className="text-gray-500 text-xs mt-1">
                      Ref: {address.reference}
                    </p>
                  )}
                  {address.delivery_instructions && (
                    <p className="text-gray-500 text-xs mt-1">
                      Instruções: {address.delivery_instructions}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  {!address.is_default && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                      title="Definir como padrão"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(address)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {addresses.length === 0 && (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum endereço cadastrado</h3>
              <p className="text-gray-600 mb-4">Adicione seu primeiro endereço para facilitar os pedidos</p>
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors mx-auto"
              >
                <Plus className="w-4 h-4" />
                Adicionar Endereço
              </button>
            </div>
          )}
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingAddress ? 'Editar Endereço' : 'Adicionar Novo Endereço'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome/Label do endereço */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Endereço *
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Ex: Casa, Trabalho, Academia"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* CEP com busca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CEP *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.zip_code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                    const formatted = value.replace(/(\d{5})(\d{1,3})/, '$1-$2');
                    setFormData(prev => ({ ...prev, zip_code: formatted }));
                  }}
                  placeholder="00000-000"
                  className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={handleCepSearch}
                  disabled={isSearchingCep}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                  title="Buscar CEP"
                >
                  {isSearchingCep ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Rua */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rua *
              </label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                placeholder="Nome da rua"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Número */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número *
              </label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                placeholder="123"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Complemento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complemento
              </label>
              <input
                type="text"
                value={formData.complement}
                onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))}
                placeholder="Apto, Bloco, etc."
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Bairro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bairro *
              </label>
              <input
                type="text"
                value={formData.neighborhood}
                onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                placeholder="Nome do bairro"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Cidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Nome da cidade"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado *
              </label>
              <select
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Selecione...</option>
                {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
                  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
                ].map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>

            {/* Referência */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ponto de Referência
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                placeholder="Ex: Próximo ao supermercado, em frente à padaria"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Instruções de entrega */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instruções de Entrega
              </label>
              <textarea
                value={formData.delivery_instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_instructions: e.target.value }))}
                placeholder="Ex: Deixar com o porteiro, tocar interfone 45"
                rows={2}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>

            {/* Endereço padrão */}
            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                  className="mr-2 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">Definir como endereço padrão</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-amber-500 text-white py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Endereço'
              )}
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 
