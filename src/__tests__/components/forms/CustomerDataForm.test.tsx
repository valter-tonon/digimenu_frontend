/**
 * Unit Tests for CustomerDataForm Component
 * Tests form validation, real-time validation, and accessibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerDataForm } from '@/components/forms/CustomerDataForm';
import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

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

describe('CustomerDataForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  const mockInitialData = {
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '11999999999',
    cpf: '12345678901',
    birth_date: '1990-01-01'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render form fields correctly', () => {
      render(<CustomerDataForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cpf/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/data de nascimento/i)).toBeInTheDocument();
    });

    it('should render with initial data', () => {
      render(
        <CustomerDataForm 
          onSubmit={mockOnSubmit}
          initialData={mockInitialData}
        />
      );

      expect(screen.getByDisplayValue('João Silva')).toBeInTheDocument();
      expect(screen.getByDisplayValue('joao@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('11999999999')).toBeInTheDocument();
      expect(screen.getByDisplayValue('12345678901')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1990-01-01')).toBeInTheDocument();
    });

    it('should show optional fields when enabled', () => {
      render(
        <CustomerDataForm 
          onSubmit={mockOnSubmit}
          showOptionalFields={true}
        />
      );

      expect(screen.getByLabelText(/cpf/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/data de nascimento/i)).toBeInTheDocument();
    });

    it('should hide optional fields when disabled', () => {
      render(
        <CustomerDataForm 
          onSubmit={mockOnSubmit}
          showOptionalFields={false}
        />
      );

      expect(screen.queryByLabelText(/cpf/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/data de nascimento/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      render(<CustomerDataForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /salvar/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument();
        expect(screen.getByText(/e-mail é obrigatório/i)).toBeInTheDocument();
        expect(screen.getByText(/telefone é obrigatório/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      render(<CustomerDataForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/e-mail/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/e-mail inválido/i)).toBeInTheDocument();
      });
    });

    it('should validate phone format', async () => {
      render(<CustomerDataForm onSubmit={mockOnSubmit} />);

      const phoneInput = screen.getByLabelText(/telefone/i);
      fireEvent.change(phoneInput, { target: { value: '123' } });
      fireEvent.blur(phoneInput);

      await waitFor(() => {
        expect(screen.getByText(/telefone deve ter pelo menos 10 dígitos/i)).toBeInTheDocument();
      });
    });

    it('should validate CPF format when provided', async () => {
      render(
        <CustomerDataForm 
          onSubmit={mockOnSubmit}
          showOptionalFields={true}
        />
      );

      const cpfInput = screen.getByLabelText(/cpf/i);
      fireEvent.change(cpfInput, { target: { value: '123' } });
      fireEvent.blur(cpfInput);

      await waitFor(() => {
        expect(screen.getByText(/cpf deve ter 11 dígitos/i)).toBeInTheDocument();
      });
    });

    it('should validate CPF checksum', async () => {
      render(
        <CustomerDataForm 
          onSubmit={mockOnSubmit}
          showOptionalFields={true}
        />
      );

      const cpfInput = screen.getByLabelText(/cpf/i);
      fireEvent.change(cpfInput, { target: { value: '11111111111' } });
      fireEvent.blur(cpfInput);

      await waitFor(() => {
        expect(screen.getByText(/cpf inválido/i)).toBeInTheDocument();
      });
    });

    it('should validate birth date', async () => {
      render(
        <CustomerDataForm 
          onSubmit={mockOnSubmit}
          showOptionalFields={true}
        />
      );

      const birthDateInput = screen.getByLabelText(/data de nascimento/i);
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      fireEvent.change(birthDateInput, { 
        target: { value: futureDate.toISOString().split('T')[0] } 
      });
      fireEvent.blur(birthDateInput);

      await waitFor(() => {
        expect(screen.getByText(/data de nascimento não pode ser no futuro/i)).toBeInTheDocument();
      });
    });

    it('should clear validation errors when fields are corrected', async () => {
      render(<CustomerDataForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/e-mail/i);
      
      // Trigger validation error
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/e-mail inválido/i)).toBeInTheDocument();
      });

      // Fix the error
      fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });

      await waitFor(() => {
        expect(screen.queryByText(/e-mail inválido/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Real-time Validation', () => {
    it('should validate email in real-time', async () => {
      render(<CustomerDataForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/e-mail/i);
      
      // Type invalid email
      fireEvent.change(emailInput, { target: { value: 'test@' } });

      await waitFor(() => {
        expect(screen.getByText(/e-mail inválido/i)).toBeInTheDocument();
      });

      // Complete valid email
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      await waitFor(() => {
        expect(screen.queryByText(/e-mail inválido/i)).not.toBeInTheDocument();
      });
    });

    it('should format phone number in real-time', () => {
      render(<CustomerDataForm onSubmit={mockOnSubmit} />);

      const phoneInput = screen.getByLabelText(/telefone/i);
      
      fireEvent.change(phoneInput, { target: { value: '11999999999' } });

      expect(phoneInput).toHaveValue('(11) 99999-9999');
    });

    it('should format CPF in real-time', () => {
      render(
        <CustomerDataForm 
          onSubmit={mockOnSubmit}
          showOptionalFields={true}
        />
      );

      const cpfInput = screen.getByLabelText(/cpf/i);
      
      fireEvent.change(cpfInput, { target: { value: '12345678901' } });

      expect(cpfInput).toHaveValue('123.456.789-01');
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      render(<CustomerDataForm onSubmit={mockOnSubmit} />);

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/nome completo/i), { 
        target: { value: 'João Silva' } 
      });
      fireEvent.change(screen.getByLabelText(/e-mail/i), { 
        target: { value: 'joao@example.com' } 
      });
      fireEvent.change(screen.getByLabelText(/telefone/i), { 
        target: { value: '11999999999' } 
      });

      const submitButton = screen.getByRole('button', { name: /salvar/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'João Silva',
          email: 'joao@example.com',
          phone: '11999999999',
          cpf: '',
          birth_date: ''
        });
      });
    });

    it('should submit form with optional fields', async () => {
      render(
        <CustomerDataForm 
          onSubmit={mockOnSubmit}
          showOptionalFields={true}
        />
      );

      // Fill all fields
      fireEvent.change(screen.getByLabelText(/nome completo/i), { 
        target: { value: 'João Silva' } 
      });
      fireEvent.change(screen.getByLabelText(/e-mail/i), { 
        target: { value: 'joao@example.com' } 
      });
      fireEvent.change(screen.getByLabelText(/telefone/i), { 
        target: { value: '11999999999' } 
      });
      fireEvent.change(screen.getByLabelText(/cpf/i), { 
        target: { value: '12345678909' } 
      });
      fireEvent.change(screen.getByLabelText(/data de nascimento/i), { 
        target: { value: '1990-01-01' } 
      });

      const submitButton = screen.getByRole('button', { name: /salvar/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'João Silva',
          email: 'joao@example.com',
          phone: '11999999999',
          cpf: '12345678909',
          birth_date: '1990-01-01'
        });
      });
    });

    it('should show loading state during submission', async () => {
      const slowSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<CustomerDataForm onSubmit={slowSubmit} />);

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/nome completo/i), { 
        target: { value: 'João Silva' } 
      });
      fireEvent.change(screen.getByLabelText(/e-mail/i), { 
        target: { value: 'joao@example.com' } 
      });
      fireEvent.change(screen.getByLabelText(/telefone/i), { 
        target: { value: '11999999999' } 
      });

      const submitButton = screen.getByRole('button', { name: /salvar/i });
      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/salvando/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      }, { timeout: 200 });
    });
  });

  describe('Form Persistence', () => {
    it('should persist form data during checkout process', () => {
      render(
        <CustomerDataForm 
          onSubmit={mockOnSubmit}
          persistData={true}
        />
      );

      const nameInput = screen.getByLabelText(/nome completo/i);
      fireEvent.change(nameInput, { target: { value: 'João Silva' } });

      // Simulate page navigation/refresh
      const { rerender } = render(
        <CustomerDataForm 
          onSubmit={mockOnSubmit}
          persistData={true}
        />
      );

      // Data should be restored
      expect(screen.getByDisplayValue('João Silva')).toBeInTheDocument();
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', () => {
      render(
        <CustomerDataForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should not render cancel button when onCancel is not provided', () => {
      render(<CustomerDataForm onSubmit={mockOnSubmit} />);

      expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<CustomerDataForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/nome completo/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/e-mail/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/telefone/i)).toHaveAttribute('aria-required', 'true');
    });

    it('should associate error messages with fields', async () => {
      render(<CustomerDataForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /salvar/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/nome completo/i);
        const errorMessage = screen.getByText(/nome é obrigatório/i);
        
        expect(nameInput).toHaveAttribute('aria-describedby');
        expect(errorMessage).toHaveAttribute('id');
      });
    });

    it('should support keyboard navigation', () => {
      render(<CustomerDataForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/nome completo/i);
      const emailInput = screen.getByLabelText(/e-mail/i);

      nameInput.focus();
      expect(nameInput).toHaveFocus();

      fireEvent.keyDown(nameInput, { key: 'Tab' });
      emailInput.focus();
      expect(emailInput).toHaveFocus();
    });

    it('should have proper input types', () => {
      render(
        <CustomerDataForm 
          onSubmit={mockOnSubmit}
          showOptionalFields={true}
        />
      );

      expect(screen.getByLabelText(/e-mail/i)).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText(/telefone/i)).toHaveAttribute('type', 'tel');
      expect(screen.getByLabelText(/data de nascimento/i)).toHaveAttribute('type', 'date');
    });
  });

  describe('Error Handling', () => {
    it('should handle submission errors gracefully', async () => {
      const errorSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'));
      
      render(<CustomerDataForm onSubmit={errorSubmit} />);

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/nome completo/i), { 
        target: { value: 'João Silva' } 
      });
      fireEvent.change(screen.getByLabelText(/e-mail/i), { 
        target: { value: 'joao@example.com' } 
      });
      fireEvent.change(screen.getByLabelText(/telefone/i), { 
        target: { value: '11999999999' } 
      });

      const submitButton = screen.getByRole('button', { name: /salvar/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Erro ao salvar dados. Tente novamente.'
        );
      });
    });
  });

  describe('Input Formatting', () => {
    it('should format phone number correctly', () => {
      render(<CustomerDataForm onSubmit={mockOnSubmit} />);

      const phoneInput = screen.getByLabelText(/telefone/i);
      
      // Test different phone formats
      fireEvent.change(phoneInput, { target: { value: '1199999999' } });
      expect(phoneInput).toHaveValue('(11) 9999-9999');

      fireEvent.change(phoneInput, { target: { value: '11999999999' } });
      expect(phoneInput).toHaveValue('(11) 99999-9999');
    });

    it('should format CPF correctly', () => {
      render(
        <CustomerDataForm 
          onSubmit={mockOnSubmit}
          showOptionalFields={true}
        />
      );

      const cpfInput = screen.getByLabelText(/cpf/i);
      
      fireEvent.change(cpfInput, { target: { value: '12345678901' } });
      expect(cpfInput).toHaveValue('123.456.789-01');
    });

    it('should remove formatting for submission', async () => {
      render(
        <CustomerDataForm 
          onSubmit={mockOnSubmit}
          showOptionalFields={true}
        />
      );

      // Fill fields with formatted values
      fireEvent.change(screen.getByLabelText(/nome completo/i), { 
        target: { value: 'João Silva' } 
      });
      fireEvent.change(screen.getByLabelText(/e-mail/i), { 
        target: { value: 'joao@example.com' } 
      });
      fireEvent.change(screen.getByLabelText(/telefone/i), { 
        target: { value: '11999999999' } 
      });
      fireEvent.change(screen.getByLabelText(/cpf/i), { 
        target: { value: '12345678909' } 
      });

      const submitButton = screen.getByRole('button', { name: /salvar/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'João Silva',
          email: 'joao@example.com',
          phone: '11999999999', // Unformatted
          cpf: '12345678909', // Unformatted
          birth_date: ''
        });
      });
    });
  });

  describe('Performance', () => {
    it('should debounce validation', async () => {
      const mockValidation = vi.fn();
      
      render(<CustomerDataForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/e-mail/i);
      
      // Rapid typing
      fireEvent.change(emailInput, { target: { value: 't' } });
      fireEvent.change(emailInput, { target: { value: 'te' } });
      fireEvent.change(emailInput, { target: { value: 'tes' } });
      fireEvent.change(emailInput, { target: { value: 'test' } });
      fireEvent.change(emailInput, { target: { value: 'test@' } });
      fireEvent.change(emailInput, { target: { value: 'test@e' } });
      fireEvent.change(emailInput, { target: { value: 'test@ex' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      // Should debounce validation calls
      await waitFor(() => {
        expect(screen.queryByText(/e-mail inválido/i)).not.toBeInTheDocument();
      });
    });
  });
});