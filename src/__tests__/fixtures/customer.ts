export const mockCustomer = {
  id: 1,
  name: 'João Silva',
  phone: '(11) 99999-9999',
  email: 'joao@example.com',
  created_at: '2024-01-01T00:00:00Z'
};

export const mockDeliveryAddress = {
  id: 1,
  customer_id: 1,
  street: 'Rua das Flores',
  number: '123',
  complement: 'Apto 45',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zip_code: '01234-567',
  is_default: true,
  label: 'Casa'
};

export const mockCustomerAddresses = [
  mockDeliveryAddress,
  {
    id: 2,
    customer_id: 1,
    street: 'Av. Paulista',
    number: '1000',
    complement: 'Sala 101',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01310-100',
    is_default: false,
    label: 'Trabalho'
  }
];

export const mockQuickRegistrationData = {
  name: 'Maria Santos',
  phone: '(11) 88888-8888',
  email: 'maria@example.com',
  acceptTerms: true,
  storeId: '02efe224-e368-4a7a-a153-5fc49cd9c5ac'
};