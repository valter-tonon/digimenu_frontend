'use client';

import { useState } from 'react';
import { MapPin, Plus, Edit3, Trash2, Home, Building, Star } from 'lucide-react';

interface Address {
  id: number;
  type: 'home' | 'work' | 'other';
  name: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

export function AddressManager() {
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: 1,
      type: 'home',
      name: 'Casa',
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      isDefault: true
    },
    {
      id: 2,
      type: 'work',
      name: 'Trabalho',
      street: 'Av. Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      isDefault: false
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<Omit<Address, 'id'>>({
    type: 'home',
    name: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false
  });

  const handleAddNew = () => {
    setEditingAddress(null);
    setFormData({
      type: 'home',
      name: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      isDefault: addresses.length === 0
    });
    setShowForm(true);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      type: address.type,
      name: address.name,
      street: address.street,
      number: address.number,
      complement: address.complement || '',
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      isDefault: address.isDefault
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este endereço?')) return;

    try {
      // TODO: Implementar chamada real à API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAddresses(prev => prev.filter(addr => addr.id !== id));
      // TODO: Mostrar toast de sucesso
    } catch (error) {
      console.error('Erro ao excluir endereço:', error);
      // TODO: Mostrar toast de erro
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implementar chamada real à API
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (editingAddress) {
        // Editando endereço existente
        setAddresses(prev => prev.map(addr => 
          addr.id === editingAddress.id 
            ? { ...formData, id: addr.id }
            : addr
        ));
      } else {
        // Adicionando novo endereço
        const newAddress: Address = {
          ...formData,
          id: Math.max(...addresses.map(a => a.id)) + 1
        };
        setAddresses(prev => [...prev, newAddress]);
      }

      setShowForm(false);
      setEditingAddress(null);
      // TODO: Mostrar toast de sucesso
    } catch (error) {
      console.error('Erro ao salvar endereço:', error);
      // TODO: Mostrar toast de erro
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAddress(null);
  };

  const handleSetDefault = async (id: number) => {
    try {
      // TODO: Implementar chamada real à API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAddresses(prev => prev.map(addr => ({
        ...addr,
        isDefault: addr.id === id
      })));
      // TODO: Mostrar toast de sucesso
    } catch (error) {
      console.error('Erro ao definir endereço padrão:', error);
      // TODO: Mostrar toast de erro
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'home': return <Home className="w-4 h-4" />;
      case 'work': return <Building className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'home': return 'Casa';
      case 'work': return 'Trabalho';
      default: return 'Outro';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Gerenciar Endereços</h2>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar Endereço
        </button>
      </div>

      {/* Lista de endereços */}
      {!showForm && (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`p-4 border rounded-lg ${
                address.isDefault 
                  ? 'border-amber-300 bg-amber-50' 
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeIcon(address.type)}
                    <span className="font-medium text-gray-900">{address.name}</span>
                    {address.isDefault && (
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
                  <p className="text-gray-600 text-sm">CEP: {address.zipCode}</p>
                </div>

                <div className="flex gap-2">
                  {!address.isDefault && (
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Endereço
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="home">Casa</option>
                <option value="work">Trabalho</option>
                <option value="other">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Endereço
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Casa, Trabalho, Academia"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rua
              </label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                placeholder="Nome da rua"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número
              </label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                placeholder="123"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bairro
              </label>
              <input
                type="text"
                value={formData.neighborhood}
                onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                placeholder="Nome do bairro"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Nome da cidade"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                placeholder="SP"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CEP
              </label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                placeholder="00000-000"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Definir como endereço padrão</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-amber-500 text-white py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar Endereço'}
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