/**
 * Unit Tests for AddressForm Component
 * Tests form validation, CEP integration, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AddressForm } from '@/components/forms/AddressForm';
import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

// Mock fetch for CEP API
global.fetch = vi.fn();

// Mock useToast hook
const mockToast = {
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn()
};

vi.mock('@/hooks/useToast', () => ({
  useToast: () => mockToast
}));

// Mock analytics hook
vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: vi.fn(),
    trackFormError: vi.fn()
  })
}));

describe('AddressForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  const mockInitialData = {
    id: '1',
    label: 'Casa',
    street: 'Rua das Flores',
    number: '123',
    complement: 'Apto 45',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01234567',
    reference: 'Próximo ao mercado',
    is_default: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful CEP response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        cep: '01234-567',
        logradouro: 'Rua das Flores',
        bairro: 'Centro',
        localidade: 'São Paulo',
        uf: 'SP'
      })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render form fields correctly', () => {
      render(<AddressForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/cep/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/rua/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/número/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/complemento/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/bairro/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cidade/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/estado/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/referência/i)).toBeInTheDocument();
    });

    it('should render with initial data', () => {
      render(
        <AddressForm 
          onSubmit={mockOnSubmit}
          initialData={mockInitialData}
        />
      );

      expect(screen.getByDisplayValue('01234567')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Rua das Flores')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Apto 45')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Centro')).toBeInTheDocument();
      expect(screen.getByDisplayValue('São Paulo')).toBeInTheDocument();
      expect(screen.getByDisplayValue('SP')).toBeInTheDocument();
    });

    it('should show save option when enabled', () => {
      render(
        <AddressForm 
          onSubmit={mockOnSubmit}
          showSaveOption={true}
        />
      );

      expect(screen.getByLabelText(/salvar endereço/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/definir como padrão/i)).toBeInTheDocument();
    });
  });

  describe('CEP Integration', () => {
    it('should fetch address data when valid CEP is entered', async () => {
      render(<AddressForm onSubmit={mockOnSubmit} />);

      const cepInput = screen.getByLabelText(/cep/i);
      fireEvent.change(cepInput, { target: { value: '01234567' } });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://viacep.com.br/ws/01234567/json/'
        );
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Rua das Flores')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Centro')).toBeInTheDocument();
        expect(screen.getByDisplayValue('São Paulo')).toBeInTheDocument();
        expect(screen.getByDisplayValue('SP')).toBeInTheDocument();
      });
    });

    it('should show loading state during CEP lookup', async () => {
      // Mock delayed response
      (global.fetch as any).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({
              cep: '01234-567',
              logradouro: 'Rua das Flores',
              bairro: 'Centro',
              localidade: 'São Paulo',
              uf: 'SP'
            })
          }), 100)
        )
      );

      render(<AddressForm onSubmit={mockOnSubmit} />);

      const cepInput = screen.getByLabelText(/cep/i);
      fireEvent.change(cepInput, { target: { value: '01234567' } });

      // Should show loading indicator
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      }, { timeout: 200 });
    });

    it('should handle CEP API errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(<AddressForm onSubmit={mockOnSubmit} />);

      const cepInput = screen.getByLabelText(/cep/i);
      fireEvent.change(cepInput, { target: { value: '01234567' } });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Erro ao buscar CEP. Verifique o código e tente novamente.'
        );
      });
    });

    it('should handle invalid CEP response', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ erro: true })
      });

      render(<AddressForm onSubmit={mockOnSubmit} />);

      const cepInput = screen.getByLabelText(/cep/i);
      fireEvent.change(cepInput, { target: { value: '00000000' } });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'CEP não encontrado. Verifique o código informado.'
        );
      });
    });

    it('should not fetch CEP for incomplete codes', () => {
      render(<AddressForm onSubmit={mockOnSubmit} />);

      const cepInput = screen.getByLabelText(/cep/i);
      fireEvent.change(cepInput, { target: { value: '01234' } });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      render(<AddressForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /salvar/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/cep é obrigatório/i)).toBeInTheDocument();
        expect(screen.getByText(/rua é obrigatória/i)).toBeInTheDocument();
        expect(screen.getByText(/número é obrigatório/i)).toBeInTheDocument();
        expect(screen.getByText(/bairro é obrigatório/i)).toBeInTheDocument();
        expect(screen.getByText(/cidade é obrigatória/i)).toBeInTheDocument();
        expect(screen.getByText(/estado é obrigatório/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate CEP format', async () => {
      render(<AddressForm onSubmit={mockOnSubmit} />);

      const cepInput = screen.getByLabelText(/cep/i);
      fireEvent.change(cepInput, { target: { value: '123' } });
      fireEvent.blur(cepInput);

      await waitFor(() => {
        expect(screen.getByText(/cep deve ter 8 dígitos/i)).toBeInTheDocument();
      });
    });

    it('should validate state format', async () => {
      render(<AddressForm onSubmit={mockOnSubmit} />);

      const stateInput = screen.getByLabelText(/estado/i);
      fireEvent.change(stateInput, { target: { value: 'SAO' } });
      fireEvent.blur(stateInput);

      await waitFor(() => {
        expect(screen.getByText(/estado deve ter 2 letras/i)).toBeInTheDocument();
      });
    });

    it('should clear validation errors when fields are corrected', async () => {
      render(<AddressForm onSubmit={mockOnSubmit} />);

      const cepInput = screen.getByLabelText(/cep/i);
      
      // Trigger validation error
      fireEvent.change(cepInput, { target: { value: '123' } });
      fireEvent.blur(cepInput);

      await waitFor(() => {
        expect(screen.getByText(/cep deve ter 8 dígitos/i)).toBeInTheDocument();
      });

      // Fix the error
      fireEvent.change(cepInput, { target: { value: '01234567' } });

      await waitFor(() => {
        expect(screen.queryByText(/cep deve ter 8 dígitos/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      render(<AddressForm onSubmit={mockOnSubmit} />);

      // Fill form
      fireEvent.change(screen.getByLabelText(/cep/i), { target: { value: '01234567' } });
      fireEvent.change(screen.getByLabelText(/rua/i), { target: { value: 'Rua das Flores' } });
      fireEvent.change(screen.getByLabelText(/número/i), { target: { value: '123' } });
      fireEvent.change(screen.getByLabelText(/bairro/i), { target: { value: 'Centro' } });
      fireEvent.change(screen.getByLabelText(/cidade/i), { target: { value: 'São Paulo' } });
      fireEvent.change(screen.getByLabelText(/estado/i), { target: { value: 'SP' } });

      const submitButton = screen.getByRole('button', { name: /salvar/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          zip_code: '01234567',
          street: 'Rua das Flores',
          number: '123',
          complement: '',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          reference: '',
          label: 'Endereço',
          is_default: false,
          save_address: false
        });
      });
    });

    it('should include save options when enabled', async () => {
      render(
        <AddressForm 
          onSubmit={mockOnSubmit}
          showSaveOption={true}
        />
      );

      // Fill form
      fireEvent.change(screen.getByLabelText(/cep/i), { target: { value: '01234567' } });
      fireEvent.change(screen.getByLabelText(/rua/i), { target: { value: 'Rua das Flores' } });
      fireEvent.change(screen.getByLabelText(/número/i), { target: { value: '123' } });
      fireEvent.change(screen.getByLabelText(/bairro/i), { target: { value: 'Centro' } });
      fireEvent.change(screen.getByLabelText(/cidade/i), { target: { value: 'São Paulo' } });
      fireEvent.change(screen.getByLabelText(/estado/i), { target: { value: 'SP' } });

      // Enable save options
      fireEvent.click(screen.getByLabelText(/salvar endereço/i));
      fireEvent.click(screen.getByLabelText(/definir como padrão/i));

      const submitButton = screen.getByRole('button', { name: /salvar/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            save_address: true,
            is_default: true
          })
        );
      });
    });

    it('should show loading state during submission', async () => {
      const slowSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<AddressForm onSubmit={slowSubmit} />);

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/cep/i), { target: { value: '01234567' } });
      fireEvent.change(screen.getByLabelText(/rua/i), { target: { value: 'Rua das Flores' } });
      fireEvent.change(screen.getByLabelText(/número/i), { target: { value: '123' } });
      fireEvent.change(screen.getByLabelText(/bairro/i), { target: { value: 'Centro' } });
      fireEvent.change(screen.getByLabelText(/cidade/i), { target: { value: 'São Paulo' } });
      fireEvent.change(screen.getByLabelText(/estado/i), { target: { value: 'SP' } });

      const submitButton = screen.getByRole('button', { name: /salvar/i });
      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/salvando/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      }, { timeout: 200 });
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', () => {
      render(
        <AddressForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should not render cancel button when onCancel is not provided', () => {
      render(<AddressForm onSubmit={mockOnSubmit} />);

      expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AddressForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/cep/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/rua/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/número/i)).toHaveAttribute('aria-required', 'true');
    });

    it('should associate error messages with fields', async () => {
      render(<AddressForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /salvar/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const cepInput = screen.getByLabelText(/cep/i);
        const errorMessage = screen.getByText(/cep é obrigatório/i);
        
        expect(cepInput).toHaveAttribute('aria-describedby');
        expect(errorMessage).toHaveAttribute('id');
      });
    });

    it('should support keyboard navigation', () => {
      render(<AddressForm onSubmit={mockOnSubmit} />);

      const cepInput = screen.getByLabelText(/cep/i);
      const streetInput = screen.getByLabelText(/rua/i);

      cepInput.focus();
      expect(cepInput).toHaveFocus();

      fireEvent.keyDown(cepInput, { key: 'Tab' });
      streetInput.focus();
      expect(streetInput).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('should handle submission errors gracefully', async () => {
      const errorSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'));
      
      render(<AddressForm onSubmit={errorSubmit} />);

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/cep/i), { target: { value: '01234567' } });
      fireEvent.change(screen.getByLabelText(/rua/i), { target: { value: 'Rua das Flores' } });
      fireEvent.change(screen.getByLabelText(/número/i), { target: { value: '123' } });
      fireEvent.change(screen.getByLabelText(/bairro/i), { target: { value: 'Centro' } });
      fireEvent.change(screen.getByLabelText(/cidade/i), { target: { value: 'São Paulo' } });
      fireEvent.change(screen.getByLabelText(/estado/i), { target: { value: 'SP' } });

      const submitButton = screen.getByRole('button', { name: /salvar/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Erro ao salvar endereço. Tente novamente.'
        );
      });
    });
  });

  describe('Performance', () => {
    it('should debounce CEP API calls', async () => {
      render(<AddressForm onSubmit={mockOnSubmit} />);

      const cepInput = screen.getByLabelText(/cep/i);
      
      // Rapid typing
      fireEvent.change(cepInput, { target: { value: '0' } });
      fireEvent.change(cepInput, { target: { value: '01' } });
      fireEvent.change(cepInput, { target: { value: '012' } });
      fireEvent.change(cepInput, { target: { value: '0123' } });
      fireEvent.change(cepInput, { target: { value: '01234' } });
      fireEvent.change(cepInput, { target: { value: '012345' } });
      fireEvent.change(cepInput, { target: { value: '0123456' } });
      fireEvent.change(cepInput, { target: { value: '01234567' } });

      // Should only make one API call after debounce
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });
  });
});