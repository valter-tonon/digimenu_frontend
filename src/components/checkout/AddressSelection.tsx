'use client';

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  Star, 
  StarOff, 
  Home, 
  Building, 
  Navigation,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { MagicCard } from '@/components/ui/magic-card';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { AddressForm } from '@/components/forms/AddressForm';
import { addressService } from '@/services/addressService';
import { 
  DeliveryAddress, 
  AddressSelectionProps 
} from '@/types/address';
import { cn } from '@/lib/utils';

type ViewMode = 'selection' | 'add' | 'edit';

export const AddressSelection: React.FC<AddressSelectionProps> = ({
  addresses,
  selectedAddressId,
  onAddressSelect,
  onAddNewAddress,
  onEditAddress,
  onDeleteAddress,
  isLoading = false,
  className
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);

  // Reset view mode when addresses change
  useEffect(() => {
    if (viewMode !== 'selection' && addresses.length === 0) {
      setViewMode('add');
    }
  }, [addresses.length, viewMode]);

  const handleAddAddress = () => {
    setEditingAddress(null);
    setViewMode('add');
    onAddNewAddress();
  };

  const handleEditAddress = (address: DeliveryAddress) => {
    setEditingAddress(address);
    setViewMode('edit');
    onEditAddress?.(address);
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!onDeleteAddress) return;
    
    setDeletingId(addressId);
    try {
      await onDeleteAddress(addressId);
      toast.success('Endereço excluído com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir endereço');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (addressId: number) => {
    setSettingDefaultId(addressId);
    try {
      await addressService.setDefaultAddress(addressId);
      toast.success('Endereço padrão definido!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao definir endereço padrão');
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleFormSubmit = (address: DeliveryAddress) => {
    onAddressSelect(address);
    setViewMode('selection');
  };

  const handleFormCancel = () => {
    setViewMode('selection');
    setEditingAddress(null);
  };

  const getAddressIcon = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('casa') || lowerLabel.includes('residência')) {
      return <Home className="w-4 h-4" />;
    } else if (lowerLabel.includes('trabalho') || lowerLabel.includes('escritório')) {
      return <Building className="w-4 h-4" />;
    }
    return <MapPin className="w-4 h-4" />;
  };

  const renderAddressCard = (address: DeliveryAddress) => {
    const isSelected = selectedAddressId === address.id;
    const isDeleting = deletingId === address.id;
    const isSettingDefault = settingDefaultId === address.id;

    return (
      <div
        key={address.id}
        className={cn(
          "cursor-pointer transition-all duration-200",
          isDeleting && "opacity-50 pointer-events-none"
        )}
        onClick={() => !isDeleting && onAddressSelect(address)}
      >
        <MagicCard
          className={cn(
            "p-4",
            isSelected
              ? "ring-2 ring-blue-500 bg-blue-50"
              : "hover:shadow-md"
          )}
        >
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            {/* Address Label and Default Badge */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 text-gray-700">
                {getAddressIcon(address.label)}
                <span className="font-medium">{address.label}</span>
              </div>
              {address.is_default && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                  <Star className="w-3 h-3 fill-current" />
                  <span>Padrão</span>
                </div>
              )}
            </div>

            {/* Full Address */}
            <div className="text-sm text-gray-600">
              <p>{addressService.formatAddressForDisplay(address)}</p>
              <p className="text-xs text-gray-500 mt-1">
                CEP: {addressService.formatCep(address.zip_code)}
              </p>
            </div>

            {/* Reference and Instructions */}
            {(address.reference || address.delivery_instructions) && (
              <div className="text-xs text-gray-500 space-y-1">
                {address.reference && (
                  <div className="flex items-center space-x-1">
                    <Navigation className="w-3 h-3" />
                    <span>{address.reference}</span>
                  </div>
                )}
                {address.delivery_instructions && (
                  <div className="flex items-start space-x-1">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{address.delivery_instructions}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 ml-4">
            {/* Set Default Button */}
            {!address.is_default && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetDefault(address.id!);
                }}
                disabled={isSettingDefault || isLoading}
                className="p-2 text-gray-400 hover:text-yellow-600 transition-colors disabled:opacity-50"
                title="Definir como padrão"
              >
                {isSettingDefault ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <StarOff className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Edit Button */}
            {onEditAddress && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditAddress(address);
                }}
                disabled={isLoading}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                title="Editar endereço"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}

            {/* Delete Button */}
            {onDeleteAddress && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Tem certeza que deseja excluir este endereço?')) {
                    handleDeleteAddress(address.id!);
                  }
                }}
                disabled={isDeleting || isLoading}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                title="Excluir endereço"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex items-center space-x-2 text-blue-600 text-sm">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>Endereço selecionado para entrega</span>
            </div>
          </div>
        )}
        </MagicCard>
      </div>
    );
  };

  const renderSelectionView = () => (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MapPin className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Endereço de Entrega
            </h3>
            <p className="text-sm text-gray-600">
              Selecione onde deseja receber seu pedido
            </p>
          </div>
        </div>

        {/* Add Address Button */}
        <ShimmerButton
          onClick={handleAddAddress}
          disabled={isLoading}
          className="px-4 py-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Endereço
        </ShimmerButton>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Carregando endereços...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && addresses.length === 0 && (
        <MagicCard className="p-8 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum endereço cadastrado
          </h4>
          <p className="text-gray-600 mb-4">
            Adicione um endereço para continuar com seu pedido
          </p>
          <ShimmerButton onClick={handleAddAddress}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Primeiro Endereço
          </ShimmerButton>
        </MagicCard>
      )}

      {/* Address List */}
      {!isLoading && addresses.length > 0 && (
        <div className="space-y-3">
          {addresses.map(renderAddressCard)}
        </div>
      )}
    </div>
  );

  const renderFormView = () => (
    <AddressForm
      onSubmit={handleFormSubmit}
      onCancel={handleFormCancel}
      initialData={editingAddress || undefined}
      showSaveOption={true}
      isLoading={isLoading}
      className={className}
    />
  );

  // Render based on current view mode
  switch (viewMode) {
    case 'add':
    case 'edit':
      return renderFormView();
    default:
      return renderSelectionView();
  }
};