'use client';

import { useState } from 'react';
import { User, Mail, Phone, MapPin, Edit3, Save, X, Camera } from 'lucide-react';

interface UserData {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  birthDate: string;
  gender: string;
  preferences: {
    dietaryRestrictions: string[];
    allergies: string[];
    favoriteCategories: string[];
  };
}

export function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '(11) 99999-9999',
    avatar: '/api/placeholder/150/150',
    birthDate: '1990-05-15',
    gender: 'Masculino',
    preferences: {
      dietaryRestrictions: ['Vegetariano'],
      allergies: ['Glúten'],
      favoriteCategories: ['Pizzas', 'Sobremesas']
    }
  });

  const [formData, setFormData] = useState<UserData>(userData);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implementar chamada real à API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      
      setUserData(formData);
      setIsEditing(false);
      // TODO: Mostrar toast de sucesso
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      // TODO: Mostrar toast de erro
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(userData);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof UserData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (type: keyof UserData['preferences'], value: string[]) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [type]: value
      }
    }));
  };

  return (
    <div className="p-6">
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
              <Save className="w-4 h-4" />
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
                {userData.avatar ? (
                  <img
                    src={userData.avatar}
                    alt="Avatar do usuário"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              {isEditing && (
                <button className="absolute bottom-2 right-2 bg-amber-500 text-white p-2 rounded-full hover:bg-amber-600 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="text-center bg-gray-50 border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              ) : (
                userData.name
              )}
            </h3>
            
            <p className="text-sm text-gray-500">Cliente desde 2023</p>
          </div>
        </div>

        {/* Informações detalhadas */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Informações de contato */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Informações de Contato</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    />
                  ) : (
                    <p className="text-gray-900">{userData.email}</p>
                  )}
                </div>
                
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
                    />
                  ) : (
                    <p className="text-gray-900">{userData.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Informações pessoais */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Informações Pessoais</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Nascimento
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => handleInputChange('birthDate', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {new Date(userData.birthDate).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gênero
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Não binário">Não binário</option>
                      <option value="Prefiro não informar">Prefiro não informar</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{userData.gender}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Preferências alimentares */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Preferências Alimentares</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Restrições Dietéticas
                  </label>
                  {isEditing ? (
                    <div className="space-y-2">
                      {['Vegetariano', 'Vegano', 'Sem glúten', 'Sem lactose', 'Sem açúcar'].map((restriction) => (
                        <label key={restriction} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.preferences.dietaryRestrictions.includes(restriction)}
                            onChange={(e) => {
                              const current = formData.preferences.dietaryRestrictions;
                              const updated = e.target.checked
                                ? [...current, restriction]
                                : current.filter(r => r !== restriction);
                              handlePreferenceChange('dietaryRestrictions', updated);
                            }}
                            className="mr-2"
                          />
                          {restriction}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {userData.preferences.dietaryRestrictions.map((restriction) => (
                        <span key={restriction} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {restriction}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alergias
                  </label>
                  {isEditing ? (
                    <div className="space-y-2">
                      {['Glúten', 'Lactose', 'Ovos', 'Amendoim', 'Frutos do mar'].map((allergy) => (
                        <label key={allergy} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.preferences.allergies.includes(allergy)}
                            onChange={(e) => {
                              const current = formData.preferences.allergies;
                              const updated = e.target.checked
                                ? [...current, allergy]
                                : current.filter(a => a !== allergy);
                              handlePreferenceChange('allergies', updated);
                            }}
                            className="mr-2"
                          />
                          {allergy}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {userData.preferences.allergies.map((allergy) => (
                        <span key={allergy} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categorias Favoritas
                  </label>
                  {isEditing ? (
                    <div className="space-y-2">
                      {['Pizzas', 'Hambúrgueres', 'Sobremesas', 'Bebidas', 'Saladas'].map((category) => (
                        <label key={category} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.preferences.favoriteCategories.includes(category)}
                            onChange={(e) => {
                              const current = formData.preferences.favoriteCategories;
                              const updated = e.target.checked
                                ? [...current, category]
                                : current.filter(c => c !== category);
                              handlePreferenceChange('favoriteCategories', updated);
                            }}
                            className="mr-2"
                          />
                          {category}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {userData.preferences.favoriteCategories.map((category) => (
                        <span key={category} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                          {category}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 