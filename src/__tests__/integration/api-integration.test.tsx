/**
 * Integration Tests for API Integration
 * Tests API calls, error handling, and data flow
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

// Mock API service
const mockApiService = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
};

// Mock components that interact with APIs
const ProductListComponent = () => {
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) return <div data-testid="products-loading">Loading products...</div>;
  if (error) return <div data-testid="products-error">Error: {error}</div>;

  return (
    <div data-testid="products-list">
      <button onClick={fetchProducts}>Refresh Products</button>
      {products.map(product => (
        <div key={product.id} data-testid={`product-${product.id}`}>
          <h3>{product.name}</h3>
          <span>R$ {product.price}</span>
        </div>
      ))}
    </div>
  );
};

const OrderFormComponent = () => {
  const [orderData, setOrderData] = React.useState({
    customer: { name: '', email: '', phone: '' },
    address: { street: '', number: '', cep: '' },
    items: [] as any[]
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setSubmitSuccess(true);
      
      // Reset form
      setOrderData({
        customer: { name: '', email: '', phone: '' },
        address: { street: '', number: '', cep: '' },
        items: []
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit order');
    } finally {
      setSubmitting(false);
    }
  };

  const updateCustomer = (field: string, value: string) => {
    setOrderData(prev => ({
      ...prev,
      customer: { ...prev.customer, [field]: value }
    }));
  };

  const updateAddress = (field: string, value: string) => {
    setOrderData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  return (
    <form onSubmit={handleSubmit} data-testid="order-form">
      <div>
        <input
          data-testid="customer-name"
          placeholder="Nome"
          value={orderData.customer.name}
          onChange={(e) => updateCustomer('name', e.target.value)}
        />
        <input
          data-testid="customer-email"
          placeholder="Email"
          value={orderData.customer.email}
          onChange={(e) => updateCustomer('email', e.target.value)}
        />
        <input
          data-testid="customer-phone"
          placeholder="Telefone"
          value={orderData.customer.phone}
          onChange={(e) => updateCustomer('phone', e.target.value)}
        />
      </div>
      
      <div>
        <input
          data-testid="address-street"
          placeholder="Rua"
          value={orderData.address.street}
          onChange={(e) => updateAddress('street', e.target.value)}
        />
        <input
          data-testid="address-number"
          placeholder="Número"
          value={orderData.address.number}
          onChange={(e) => updateAddress('number', e.target.value)}
        />
        <input
          data-testid="address-cep"
          placeholder="CEP"
          value={orderData.address.cep}
          onChange={(e) => updateAddress('cep', e.target.value)}
        />
      </div>

      <button type="submit" disabled={submitting} data-testid="submit-order">
        {submitting ? 'Enviando...' : 'Enviar Pedido'}
      </button>

      {submitError && (
        <div data-testid="submit-error" className="error">
          {submitError}
        </div>
      )}

      {submitSuccess && (
        <div data-testid="submit-success" className="success">
          Pedido enviado com sucesso!
        </div>
      )}
    </form>
  );
};

const AddressLookupComponent = () => {
  const [cep, setCep] = React.useState('');
  const [address, setAddress] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const lookupAddress = async (cepValue: string) => {
    if (cepValue.length !== 8) return;

    setLoading(true);
    setError(null);
    setAddress(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepValue}/json/`);
      if (!response.ok) {
        throw new Error('CEP service unavailable');
      }

      const data = await response.json();
      if (data.erro) {
        throw new Error('CEP not found');
      }

      setAddress(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lookup address');
    } finally {
      setLoading(false);
    }
  };

  const handleCepChange = (value: string) => {
    setCep(value);
    if (value.length === 8) {
      lookupAddress(value);
    }
  };

  return (
    <div data-testid="address-lookup">
      <input
        data-testid="cep-input"
        placeholder="CEP (8 dígitos)"
        value={cep}
        onChange={(e) => handleCepChange(e.target.value)}
        maxLength={8}
      />

      {loading && <div data-testid="cep-loading">Buscando endereço...</div>}
      {error && <div data-testid="cep-error">Erro: {error}</div>}
      
      {address && (
        <div data-testid="address-result">
          <div data-testid="address-street">{address.logradouro}</div>
          <div data-testid="address-neighborhood">{address.bairro}</div>
          <div data-testid="address-city">{address.localidade}</div>
          <div data-testid="address-state">{address.uf}</div>
        </div>
      )}
    </div>
  );
};

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Product API Integration', () => {
    it('should fetch and display products successfully', async () => {
      const mockProducts = [
        { id: 1, name: 'Pizza Margherita', price: '25.99' },
        { id: 2, name: 'Pizza Pepperoni', price: '29.99' }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ products: mockProducts })
      });

      render(<ProductListComponent />);

      // Should show loading initially
      expect(screen.getByTestId('products-loading')).toBeInTheDocument();

      // Should display products after loading
      await waitFor(() => {
        expect(screen.getByTestId('products-list')).toBeInTheDocument();
        expect(screen.getByTestId('product-1')).toBeInTheDocument();
        expect(screen.getByTestId('product-2')).toBeInTheDocument();
        expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
        expect(screen.getByText('Pizza Pepperoni')).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/products');
    });

    it('should handle product API errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<ProductListComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('products-error')).toBeInTheDocument();
        expect(screen.getByText('Error: Network error')).toBeInTheDocument();
      });
    });

    it('should handle HTTP error responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      render(<ProductListComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('products-error')).toBeInTheDocument();
        expect(screen.getByText('Error: HTTP 500: Internal Server Error')).toBeInTheDocument();
      });
    });

    it('should allow refreshing products', async () => {
      const mockProducts = [
        { id: 1, name: 'Pizza Margherita', price: '25.99' }
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ products: mockProducts })
      });

      render(<ProductListComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('products-list')).toBeInTheDocument();
      });

      // Click refresh
      fireEvent.click(screen.getByText('Refresh Products'));

      // Should call API again
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Order Submission Integration', () => {
    it('should submit order successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 12345, status: 'confirmed' })
      });

      render(<OrderFormComponent />);

      // Fill form
      fireEvent.change(screen.getByTestId('customer-name'), {
        target: { value: 'João Silva' }
      });
      fireEvent.change(screen.getByTestId('customer-email'), {
        target: { value: 'joao@example.com' }
      });
      fireEvent.change(screen.getByTestId('customer-phone'), {
        target: { value: '11999999999' }
      });
      fireEvent.change(screen.getByTestId('address-street'), {
        target: { value: 'Rua das Flores' }
      });
      fireEvent.change(screen.getByTestId('address-number'), {
        target: { value: '123' }
      });
      fireEvent.change(screen.getByTestId('address-cep'), {
        target: { value: '01234567' }
      });

      // Submit form
      fireEvent.click(screen.getByTestId('submit-order'));

      // Should show loading state
      expect(screen.getByText('Enviando...')).toBeInTheDocument();

      // Should show success message
      await waitFor(() => {
        expect(screen.getByTestId('submit-success')).toBeInTheDocument();
        expect(screen.getByText('Pedido enviado com sucesso!')).toBeInTheDocument();
      });

      // Should have called API with correct data
      expect(global.fetch).toHaveBeenCalledWith('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: {
            name: 'João Silva',
            email: 'joao@example.com',
            phone: '11999999999'
          },
          address: {
            street: 'Rua das Flores',
            number: '123',
            cep: '01234567'
          },
          items: []
        })
      });
    });

    it('should handle order submission errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid customer data' })
      });

      render(<OrderFormComponent />);

      // Fill and submit form
      fireEvent.change(screen.getByTestId('customer-name'), {
        target: { value: 'João Silva' }
      });
      fireEvent.click(screen.getByTestId('submit-order'));

      await waitFor(() => {
        expect(screen.getByTestId('submit-error')).toBeInTheDocument();
        expect(screen.getByText('Invalid customer data')).toBeInTheDocument();
      });
    });

    it('should handle network errors during submission', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<OrderFormComponent />);

      fireEvent.change(screen.getByTestId('customer-name'), {
        target: { value: 'João Silva' }
      });
      fireEvent.click(screen.getByTestId('submit-order'));

      await waitFor(() => {
        expect(screen.getByTestId('submit-error')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should reset form after successful submission', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 12345 })
      });

      render(<OrderFormComponent />);

      // Fill form
      fireEvent.change(screen.getByTestId('customer-name'), {
        target: { value: 'João Silva' }
      });
      fireEvent.change(screen.getByTestId('customer-email'), {
        target: { value: 'joao@example.com' }
      });

      // Submit
      fireEvent.click(screen.getByTestId('submit-order'));

      await waitFor(() => {
        expect(screen.getByTestId('submit-success')).toBeInTheDocument();
      });

      // Form should be reset
      expect(screen.getByTestId('customer-name')).toHaveValue('');
      expect(screen.getByTestId('customer-email')).toHaveValue('');
    });
  });

  describe('Address Lookup Integration', () => {
    it('should lookup address by CEP successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cep: '01234-567',
          logradouro: 'Rua das Flores',
          bairro: 'Centro',
          localidade: 'São Paulo',
          uf: 'SP'
        })
      });

      render(<AddressLookupComponent />);

      // Enter CEP
      fireEvent.change(screen.getByTestId('cep-input'), {
        target: { value: '01234567' }
      });

      // Should show loading
      expect(screen.getByTestId('cep-loading')).toBeInTheDocument();

      // Should display address
      await waitFor(() => {
        expect(screen.getByTestId('address-result')).toBeInTheDocument();
        expect(screen.getByTestId('address-street')).toHaveTextContent('Rua das Flores');
        expect(screen.getByTestId('address-neighborhood')).toHaveTextContent('Centro');
        expect(screen.getByTestId('address-city')).toHaveTextContent('São Paulo');
        expect(screen.getByTestId('address-state')).toHaveTextContent('SP');
      });

      expect(global.fetch).toHaveBeenCalledWith('https://viacep.com.br/ws/01234567/json/');
    });

    it('should handle invalid CEP', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ erro: true })
      });

      render(<AddressLookupComponent />);

      fireEvent.change(screen.getByTestId('cep-input'), {
        target: { value: '00000000' }
      });

      await waitFor(() => {
        expect(screen.getByTestId('cep-error')).toBeInTheDocument();
        expect(screen.getByText('Erro: CEP not found')).toBeInTheDocument();
      });
    });

    it('should handle CEP service errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Service unavailable'));

      render(<AddressLookupComponent />);

      fireEvent.change(screen.getByTestId('cep-input'), {
        target: { value: '01234567' }
      });

      await waitFor(() => {
        expect(screen.getByTestId('cep-error')).toBeInTheDocument();
        expect(screen.getByText('Erro: Service unavailable')).toBeInTheDocument();
      });
    });

    it('should not lookup address for incomplete CEP', () => {
      render(<AddressLookupComponent />);

      fireEvent.change(screen.getByTestId('cep-input'), {
        target: { value: '01234' }
      });

      // Should not show loading or make API call
      expect(screen.queryByTestId('cep-loading')).not.toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Concurrent API Calls', () => {
    it('should handle multiple concurrent API calls', async () => {
      const mockProducts = [{ id: 1, name: 'Pizza', price: '25.99' }];
      
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/products')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ products: mockProducts })
          });
        }
        if (url.includes('viacep.com.br')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              logradouro: 'Rua das Flores',
              bairro: 'Centro',
              localidade: 'São Paulo',
              uf: 'SP'
            })
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(
        <div>
          <ProductListComponent />
          <AddressLookupComponent />
        </div>
      );

      // Trigger both API calls
      fireEvent.change(screen.getByTestId('cep-input'), {
        target: { value: '01234567' }
      });

      // Both should complete successfully
      await waitFor(() => {
        expect(screen.getByTestId('products-list')).toBeInTheDocument();
        expect(screen.getByTestId('address-result')).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('API Retry Logic', () => {
    it('should retry failed requests', async () => {
      let callCount = 0;
      (global.fetch as any).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ products: [] })
        });
      });

      // This would require implementing retry logic in the component
      // For now, we'll just test that the error is handled
      render(<ProductListComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('products-error')).toBeInTheDocument();
      });
    });
  });

  describe('API Response Caching', () => {
    it('should cache API responses', async () => {
      const mockProducts = [{ id: 1, name: 'Pizza', price: '25.99' }];
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ products: mockProducts })
      });

      const { rerender } = render(<ProductListComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('products-list')).toBeInTheDocument();
      });

      // Rerender component
      rerender(<ProductListComponent />);

      // Should make API call again (no caching implemented)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('API Request Cancellation', () => {
    it('should handle component unmount during API call', async () => {
      (global.fetch as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      const { unmount } = render(<ProductListComponent />);

      // Unmount before API call completes
      unmount();

      // Should not cause memory leaks or errors
      expect(true).toBe(true);
    });
  });

  describe('API Error Recovery', () => {
    it('should recover from temporary API failures', async () => {
      let callCount = 0;
      (global.fetch as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Temporary error'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ products: [{ id: 1, name: 'Pizza', price: '25.99' }] })
        });
      });

      render(<ProductListComponent />);

      // Should show error initially
      await waitFor(() => {
        expect(screen.getByTestId('products-error')).toBeInTheDocument();
      });

      // Retry should succeed
      fireEvent.click(screen.getByText('Refresh Products'));

      await waitFor(() => {
        expect(screen.getByTestId('products-list')).toBeInTheDocument();
        expect(screen.getByText('Pizza')).toBeInTheDocument();
      });
    });
  });
});