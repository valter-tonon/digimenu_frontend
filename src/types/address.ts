/**
 * Address-related types for the delivery flow
 */

export interface DeliveryAddress {
  id?: number;
  customer_id?: number;
  label: string; // "Casa", "Trabalho", etc.
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  reference?: string;
  is_default: boolean;
  delivery_instructions?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  created_at?: string;
  updated_at?: string;
}

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export interface AddressFormData {
  label: string;
  zip_code: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  reference?: string;
  delivery_instructions?: string;
  is_default: boolean;
}

export interface AddressValidationError {
  field: string;
  message: string;
}

export interface AddressValidationResult {
  isValid: boolean;
  errors: AddressValidationError[];
}

export interface AddressFormProps {
  onSubmit: (address: DeliveryAddress) => void;
  onCancel?: () => void;
  initialData?: Partial<DeliveryAddress>;
  showSaveOption?: boolean;
  isLoading?: boolean;
  className?: string;
}

export interface AddressSelectionProps {
  addresses: DeliveryAddress[];
  selectedAddressId?: number;
  onAddressSelect: (address: DeliveryAddress) => void;
  onAddNewAddress: () => void;
  onEditAddress?: (address: DeliveryAddress) => void;
  onDeleteAddress?: (addressId: number) => void;
  isLoading?: boolean;
  className?: string;
}

// Brazilian states for validation
export const BRAZILIAN_STATES = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' }
] as const;

export type BrazilianStateCode = typeof BRAZILIAN_STATES[number]['code'];