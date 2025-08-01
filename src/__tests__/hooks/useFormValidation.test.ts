import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormValidation, ValidationRule, FormConfig } from '@/hooks/useFormValidation';

describe('useFormValidation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should initialize with default values', () => {
      const initialValues = { name: 'John', email: '' };
      const { result } = renderHook(() => useFormValidation(initialValues));

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isValid).toBe(true);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.isDirty).toBe(false);
      expect(result.current.submitCount).toBe(0);
    });

    it('should update values correctly', () => {
      const { result } = renderHook(() => useFormValidation({ name: '' }));

      act(() => {
        result.current.setValue('name', 'John Doe');
      });

      expect(result.current.values.name).toBe('John Doe');
      expect(result.current.isDirty).toBe(true);
    });

    it('should set and clear errors', () => {
      const { result } = renderHook(() => useFormValidation({ name: '' }));

      act(() => {
        result.current.setError('name', { message: 'Name is required', type: 'required' });
      });

      expect(result.current.errors.name).toEqual({
        message: 'Name is required',
        type: 'required'
      });
      expect(result.current.isValid).toBe(false);

      act(() => {
        result.current.setError('name', null);
      });

      expect(result.current.errors.name).toBeNull();
      expect(result.current.isValid).toBe(true);
    });

    it('should manage touched state', () => {
      const { result } = renderHook(() => useFormValidation({ name: '' }));

      act(() => {
        result.current.setTouched('name', true);
      });

      expect(result.current.touched.name).toBe(true);
    });
  });

  describe('Validation Rules', () => {
    const config: FormConfig = {
      name: {
        rules: [
          { required: true },
          { minLength: 2 },
          { maxLength: 50 }
        ]
      },
      email: {
        rules: [
          { required: true },
          { email: true }
        ]
      },
      phone: {
        rules: [
          { phone: true }
        ]
      },
      cpf: {
        rules: [
          { cpf: true }
        ]
      },
      cep: {
        rules: [
          { cep: true }
        ]
      }
    };

    it('should validate required fields', async () => {
      const { result } = renderHook(() => 
        useFormValidation({ name: '', email: '' }, config)
      );

      const isValid = await act(async () => {
        return await result.current.validateForm();
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.name).toEqual({
        message: 'Este campo é obrigatório',
        type: 'required'
      });
      expect(result.current.errors.email).toEqual({
        message: 'Este campo é obrigatório',
        type: 'required'
      });
    });

    it('should validate minimum length', async () => {
      const { result } = renderHook(() => 
        useFormValidation({ name: 'A' }, config)
      );

      const isValid = await act(async () => {
        return await result.current.validateField('name');
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.name).toEqual({
        message: 'Mínimo de 2 caracteres',
        type: 'minLength'
      });
    });

    it('should validate maximum length', async () => {
      const { result } = renderHook(() => 
        useFormValidation({ name: 'A'.repeat(51) }, config)
      );

      const isValid = await act(async () => {
        return await result.current.validateField('name');
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.name).toEqual({
        message: 'Máximo de 50 caracteres',
        type: 'maxLength'
      });
    });

    it('should validate email format', async () => {
      const { result } = renderHook(() => 
        useFormValidation({ email: 'invalid-email' }, config)
      );

      const isValid = await act(async () => {
        return await result.current.validateField('email');
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.email).toEqual({
        message: 'Digite um email válido',
        type: 'email'
      });
    });

    it('should validate valid email format', async () => {
      const { result } = renderHook(() => 
        useFormValidation({ email: 'test@example.com' }, config)
      );

      const isValid = await act(async () => {
        return await result.current.validateField('email');
      });

      expect(isValid).toBe(true);
      expect(result.current.errors.email).toBeNull();
    });

    it('should validate phone format', async () => {
      const { result } = renderHook(() => 
        useFormValidation({ phone: '123' }, config)
      );

      const isValid = await act(async () => {
        return await result.current.validateField('phone');
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.phone).toEqual({
        message: 'Digite um telefone válido',
        type: 'phone'
      });
    });

    it('should validate valid phone format', async () => {
      const { result } = renderHook(() => 
        useFormValidation({ phone: '(11) 99999-9999' }, config)
      );

      const isValid = await act(async () => {
        return await result.current.validateField('phone');
      });

      expect(isValid).toBe(true);
      expect(result.current.errors.phone).toBeNull();
    });

    it('should validate CPF format', async () => {
      const { result } = renderHook(() => 
        useFormValidation({ cpf: '123.456.789-00' }, config)
      );

      const isValid = await act(async () => {
        return await result.current.validateField('cpf');
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.cpf).toEqual({
        message: 'Digite um CPF válido',
        type: 'cpf'
      });
    });

    it('should validate valid CPF format', async () => {
      const { result } = renderHook(() => 
        useFormValidation({ cpf: '111.444.777-35' }, config)
      );

      const isValid = await act(async () => {
        return await result.current.validateField('cpf');
      });

      expect(isValid).toBe(true);
      expect(result.current.errors.cpf).toBeNull();
    });

    it('should validate CEP format', async () => {
      const { result } = renderHook(() => 
        useFormValidation({ cep: '123' }, config)
      );

      const isValid = await act(async () => {
        return await result.current.validateField('cep');
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.cep).toEqual({
        message: 'Digite um CEP válido',
        type: 'cep'
      });
    });

    it('should validate valid CEP format', async () => {
      const { result } = renderHook(() => 
        useFormValidation({ cep: '12345-678' }, config)
      );

      const isValid = await act(async () => {
        return await result.current.validateField('cep');
      });

      expect(isValid).toBe(true);
      expect(result.current.errors.cep).toBeNull();
    });

    it('should validate pattern rules', async () => {
      const patternConfig: FormConfig = {
        code: {
          rules: [
            { pattern: /^[A-Z]{3}\d{3}$/, message: 'Código deve ter formato ABC123' }
          ]
        }
      };

      const { result } = renderHook(() => 
        useFormValidation({ code: 'invalid' }, patternConfig)
      );

      const isValid = await act(async () => {
        return await result.current.validateField('code');
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.code).toEqual({
        message: 'Código deve ter formato ABC123',
        type: 'pattern'
      });
    });

    it('should validate custom rules', async () => {
      const customConfig: FormConfig = {
        password: {
          rules: [
            { 
              custom: (value) => {
                if (value && value.length < 8) {
                  return 'Senha deve ter pelo menos 8 caracteres';
                }
                if (value && !/[A-Z]/.test(value)) {
                  return 'Senha deve conter pelo menos uma letra maiúscula';
                }
                return null;
              }
            }
          ]
        }
      };

      const { result } = renderHook(() => 
        useFormValidation({ password: 'weak' }, customConfig)
      );

      const isValid = await act(async () => {
        return await result.current.validateField('password');
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.password).toEqual({
        message: 'Senha deve ter pelo menos 8 caracteres',
        type: 'custom'
      });
    });
  });

  describe('Real-time Validation', () => {
    const config: FormConfig = {
      name: {
        rules: [{ required: true }],
        validateOnChange: true,
        debounceMs: 100
      },
      email: {
        rules: [{ email: true }],
        validateOnBlur: true
      }
    };

    it('should validate on change with debounce', async () => {
      const { result } = renderHook(() => 
        useFormValidation({ name: '' }, config)
      );

      act(() => {
        result.current.setValue('name', '');
      });

      // Should not validate immediately
      expect(result.current.errors.name).toBeUndefined();

      // Fast-forward debounce timer
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should validate after debounce
      await vi.waitFor(() => {
        expect(result.current.errors.name).toEqual({
          message: 'Este campo é obrigatório',
          type: 'required'
        });
      });
    });

    it('should validate on blur', async () => {
      const { result } = renderHook(() => 
        useFormValidation({ email: 'invalid' }, config)
      );

      await act(async () => {
        result.current.setTouched('email', true);
      });

      expect(result.current.errors.email).toEqual({
        message: 'Digite um email válido',
        type: 'email'
      });
    });
  });

  describe('Form Submission', () => {
    const config: FormConfig = {
      name: {
        rules: [{ required: true }]
      },
      email: {
        rules: [{ required: true, email: true }]
      }
    };

    it('should handle successful form submission', async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() => 
        useFormValidation({ name: 'John', email: 'john@example.com' }, config)
      );

      const handleSubmit = result.current.handleSubmit(onSubmit);

      await act(async () => {
        await handleSubmit();
      });

      expect(onSubmit).toHaveBeenCalledWith({ name: 'John', email: 'john@example.com' });
      expect(result.current.submitCount).toBe(1);
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should prevent submission with validation errors', async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() => 
        useFormValidation({ name: '', email: 'invalid' }, config)
      );

      const handleSubmit = result.current.handleSubmit(onSubmit);

      await act(async () => {
        await handleSubmit();
      });

      expect(onSubmit).not.toHaveBeenCalled();
      expect(result.current.submitCount).toBe(1);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.errors.name).toBeDefined();
      expect(result.current.errors.email).toBeDefined();
    });

    it('should mark all fields as touched on submission', async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() => 
        useFormValidation({ name: '', email: '' }, config)
      );

      const handleSubmit = result.current.handleSubmit(onSubmit);

      await act(async () => {
        await handleSubmit();
      });

      expect(result.current.touched.name).toBe(true);
      expect(result.current.touched.email).toBe(true);
    });

    it('should handle submission errors gracefully', async () => {
      const onSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const { result } = renderHook(() => 
        useFormValidation({ name: 'John', email: 'john@example.com' }, config)
      );

      const handleSubmit = result.current.handleSubmit(onSubmit);

      await act(async () => {
        await handleSubmit();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Form submission error:', expect.any(Error));
      expect(result.current.isSubmitting).toBe(false);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Form Reset and Recovery', () => {
    it('should reset form to initial values', () => {
      const initialValues = { name: 'John', email: 'john@example.com' };
      const { result } = renderHook(() => useFormValidation(initialValues));

      act(() => {
        result.current.setValue('name', 'Jane');
        result.current.setError('name', { message: 'Error', type: 'custom' });
        result.current.setTouched('name', true);
      });

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.submitCount).toBe(0);
    });

    it('should reset form with new values', () => {
      const initialValues = { name: 'John', email: 'john@example.com' };
      const newValues = { name: 'Jane', email: 'jane@example.com' };
      const { result } = renderHook(() => useFormValidation(initialValues));

      act(() => {
        result.current.resetForm(newValues);
      });

      expect(result.current.values).toEqual(newValues);
      expect(result.current.isDirty).toBe(false);
    });

    it('should reset individual fields', () => {
      const initialValues = { name: 'John', email: 'john@example.com' };
      const { result } = renderHook(() => useFormValidation(initialValues));

      act(() => {
        result.current.setValue('name', 'Jane');
        result.current.setError('name', { message: 'Error', type: 'custom' });
        result.current.setTouched('name', true);
      });

      act(() => {
        result.current.resetField('name');
      });

      expect(result.current.values.name).toBe('John');
      expect(result.current.errors.name).toBeNull();
      expect(result.current.touched.name).toBe(false);
      expect(result.current.values.email).toBe('john@example.com'); // Other fields unchanged
    });

    it('should clear all errors', () => {
      const { result } = renderHook(() => useFormValidation({ name: '', email: '' }));

      act(() => {
        result.current.setError('name', { message: 'Name error', type: 'required' });
        result.current.setError('email', { message: 'Email error', type: 'email' });
      });

      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.errors).toEqual({});
      expect(result.current.isValid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty validation rules', async () => {
      const { result } = renderHook(() => 
        useFormValidation({ name: 'John' }, {})
      );

      const isValid = await act(async () => {
        return await result.current.validateForm();
      });

      expect(isValid).toBe(true);
      expect(result.current.errors).toEqual({});
    });

    it('should skip validation for empty optional fields', async () => {
      const config: FormConfig = {
        optionalField: {
          rules: [{ minLength: 5 }]
        }
      };

      const { result } = renderHook(() => 
        useFormValidation({ optionalField: '' }, config)
      );

      const isValid = await act(async () => {
        return await result.current.validateField('optionalField');
      });

      expect(isValid).toBe(true);
      expect(result.current.errors.optionalField).toBeNull();
    });

    it('should handle custom validation returning null', async () => {
      const config: FormConfig = {
        field: {
          rules: [
            { custom: () => null }
          ]
        }
      };

      const { result } = renderHook(() => 
        useFormValidation({ field: 'value' }, config)
      );

      const isValid = await act(async () => {
        return await result.current.validateField('field');
      });

      expect(isValid).toBe(true);
      expect(result.current.errors.field).toBeNull();
    });

    it('should cleanup debounce timers on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const config: FormConfig = {
        name: {
          rules: [{ required: true }],
          validateOnChange: true,
          debounceMs: 1000
        }
      };

      const { result, unmount } = renderHook(() => 
        useFormValidation({ name: '' }, config)
      );

      act(() => {
        result.current.setValue('name', 'test');
      });

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });
});