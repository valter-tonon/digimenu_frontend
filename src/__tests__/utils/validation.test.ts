/**
 * Unit Tests for Validation Utilities
 * Tests form validation functions and helpers
 */

import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePhone,
  validateCPF,
  validateCEP,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  formatPhone,
  formatCPF,
  formatCEP,
  unformatPhone,
  unformatCPF,
  unformatCEP,
  isValidDate,
  isAdult,
  sanitizeInput,
  validatePassword,
  validateConfirmPassword
} from '@/utils/validation';

describe('Email Validation', () => {
  it('should validate correct email formats', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'user+tag@example.org',
      'user123@test-domain.com',
      'a@b.co'
    ];

    validEmails.forEach(email => {
      expect(validateEmail(email)).toBe(true);
    });
  });

  it('should reject invalid email formats', () => {
    const invalidEmails = [
      'invalid-email',
      '@example.com',
      'user@',
      'user@.com',
      'user..name@example.com',
      'user@example',
      '',
      'user name@example.com',
      'user@ex ample.com'
    ];

    invalidEmails.forEach(email => {
      expect(validateEmail(email)).toBe(false);
    });
  });

  it('should handle edge cases', () => {
    expect(validateEmail(null as any)).toBe(false);
    expect(validateEmail(undefined as any)).toBe(false);
    expect(validateEmail(' test@example.com ')).toBe(true); // Should trim
  });
});

describe('Phone Validation', () => {
  it('should validate correct phone formats', () => {
    const validPhones = [
      '11999999999',
      '1199999999',
      '(11) 99999-9999',
      '(11) 9999-9999',
      '+55 11 99999-9999',
      '11 99999-9999'
    ];

    validPhones.forEach(phone => {
      expect(validatePhone(phone)).toBe(true);
    });
  });

  it('should reject invalid phone formats', () => {
    const invalidPhones = [
      '123',
      '11999',
      '119999999999999',
      'abc1199999999',
      '',
      '00000000000'
    ];

    invalidPhones.forEach(phone => {
      expect(validatePhone(phone)).toBe(false);
    });
  });
});

describe('CPF Validation', () => {
  it('should validate correct CPF numbers', () => {
    const validCPFs = [
      '12345678909',
      '123.456.789-09',
      '98765432100',
      '987.654.321-00'
    ];

    validCPFs.forEach(cpf => {
      expect(validateCPF(cpf)).toBe(true);
    });
  });

  it('should reject invalid CPF numbers', () => {
    const invalidCPFs = [
      '11111111111', // All same digits
      '12345678901', // Invalid checksum
      '123456789',   // Too short
      '123456789012', // Too long
      'abc.def.ghi-jk', // Non-numeric
      '',
      '000.000.000-00'
    ];

    invalidCPFs.forEach(cpf => {
      expect(validateCPF(cpf)).toBe(false);
    });
  });

  it('should handle CPF edge cases', () => {
    expect(validateCPF(null as any)).toBe(false);
    expect(validateCPF(undefined as any)).toBe(false);
    expect(validateCPF(' 123.456.789-09 ')).toBe(true); // Should trim
  });
});

describe('CEP Validation', () => {
  it('should validate correct CEP formats', () => {
    const validCEPs = [
      '01234567',
      '01234-567',
      '12345678',
      '12345-678'
    ];

    validCEPs.forEach(cep => {
      expect(validateCEP(cep)).toBe(true);
    });
  });

  it('should reject invalid CEP formats', () => {
    const invalidCEPs = [
      '1234567',    // Too short
      '123456789',  // Too long
      'abcd-efgh',  // Non-numeric
      '',
      '00000-000'
    ];

    invalidCEPs.forEach(cep => {
      expect(validateCEP(cep)).toBe(false);
    });
  });
});

describe('Required Field Validation', () => {
  it('should validate required fields', () => {
    expect(validateRequired('test')).toBe(true);
    expect(validateRequired('0')).toBe(true);
    expect(validateRequired(0)).toBe(true);
    expect(validateRequired(false)).toBe(true);
  });

  it('should reject empty required fields', () => {
    expect(validateRequired('')).toBe(false);
    expect(validateRequired('   ')).toBe(false);
    expect(validateRequired(null)).toBe(false);
    expect(validateRequired(undefined)).toBe(false);
  });
});

describe('Length Validation', () => {
  it('should validate minimum length', () => {
    expect(validateMinLength('test', 3)).toBe(true);
    expect(validateMinLength('test', 4)).toBe(true);
    expect(validateMinLength('test', 5)).toBe(false);
  });

  it('should validate maximum length', () => {
    expect(validateMaxLength('test', 5)).toBe(true);
    expect(validateMaxLength('test', 4)).toBe(true);
    expect(validateMaxLength('test', 3)).toBe(false);
  });

  it('should handle edge cases for length validation', () => {
    expect(validateMinLength('', 0)).toBe(true);
    expect(validateMinLength('', 1)).toBe(false);
    expect(validateMaxLength('', 0)).toBe(true);
    expect(validateMaxLength('', 1)).toBe(true);
  });
});

describe('Phone Formatting', () => {
  it('should format phone numbers correctly', () => {
    expect(formatPhone('11999999999')).toBe('(11) 99999-9999');
    expect(formatPhone('1199999999')).toBe('(11) 9999-9999');
    expect(formatPhone('119999999')).toBe('11 9999-9999');
    expect(formatPhone('11999')).toBe('11999');
  });

  it('should unformat phone numbers', () => {
    expect(unformatPhone('(11) 99999-9999')).toBe('11999999999');
    expect(unformatPhone('(11) 9999-9999')).toBe('1199999999');
    expect(unformatPhone('+55 11 99999-9999')).toBe('5511999999999');
    expect(unformatPhone('11 99999-9999')).toBe('11999999999');
  });
});

describe('CPF Formatting', () => {
  it('should format CPF correctly', () => {
    expect(formatCPF('12345678909')).toBe('123.456.789-09');
    expect(formatCPF('123456789')).toBe('123.456.789');
    expect(formatCPF('12345')).toBe('12345');
  });

  it('should unformat CPF', () => {
    expect(unformatCPF('123.456.789-09')).toBe('12345678909');
    expect(unformatCPF('123.456.789')).toBe('123456789');
    expect(unformatCPF('12345')).toBe('12345');
  });
});

describe('CEP Formatting', () => {
  it('should format CEP correctly', () => {
    expect(formatCEP('01234567')).toBe('01234-567');
    expect(formatCEP('0123456')).toBe('0123456');
    expect(formatCEP('012345678')).toBe('012345678');
  });

  it('should unformat CEP', () => {
    expect(unformatCEP('01234-567')).toBe('01234567');
    expect(unformatCEP('01234567')).toBe('01234567');
    expect(unformatCEP('01234')).toBe('01234');
  });
});

describe('Date Validation', () => {
  it('should validate correct dates', () => {
    expect(isValidDate('2023-01-01')).toBe(true);
    expect(isValidDate('1990-12-31')).toBe(true);
    expect(isValidDate(new Date())).toBe(true);
  });

  it('should reject invalid dates', () => {
    expect(isValidDate('invalid-date')).toBe(false);
    expect(isValidDate('2023-13-01')).toBe(false);
    expect(isValidDate('2023-01-32')).toBe(false);
    expect(isValidDate('')).toBe(false);
  });

  it('should validate adult age', () => {
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
    
    const twentyYearsAgo = new Date();
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
    
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

    expect(isAdult(twentyYearsAgo.toISOString().split('T')[0])).toBe(true);
    expect(isAdult(eighteenYearsAgo.toISOString().split('T')[0])).toBe(true);
    expect(isAdult(tenYearsAgo.toISOString().split('T')[0])).toBe(false);
  });
});

describe('Input Sanitization', () => {
  it('should sanitize HTML input', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('');
    expect(sanitizeInput('Hello <b>World</b>')).toBe('Hello World');
    expect(sanitizeInput('Normal text')).toBe('Normal text');
  });

  it('should trim whitespace', () => {
    expect(sanitizeInput('  hello world  ')).toBe('hello world');
    expect(sanitizeInput('\n\ttest\n\t')).toBe('test');
  });

  it('should handle special characters', () => {
    expect(sanitizeInput('João & Maria')).toBe('João & Maria');
    expect(sanitizeInput('Price: $10.99')).toBe('Price: $10.99');
    expect(sanitizeInput('Email: test@example.com')).toBe('Email: test@example.com');
  });
});

describe('Password Validation', () => {
  it('should validate strong passwords', () => {
    const strongPasswords = [
      'MyStr0ngP@ssw0rd',
      'C0mpl3x!P@ssw0rd',
      'S3cur3P@ssw0rd123'
    ];

    strongPasswords.forEach(password => {
      expect(validatePassword(password)).toBe(true);
    });
  });

  it('should reject weak passwords', () => {
    const weakPasswords = [
      'password',      // No uppercase, numbers, or symbols
      'PASSWORD',      // No lowercase, numbers, or symbols
      '12345678',      // No letters or symbols
      'Password',      // No numbers or symbols
      'Pass123',       // Too short
      'password123',   // No uppercase or symbols
      'PASSWORD123'    // No lowercase or symbols
    ];

    weakPasswords.forEach(password => {
      expect(validatePassword(password)).toBe(false);
    });
  });

  it('should validate password confirmation', () => {
    expect(validateConfirmPassword('password123', 'password123')).toBe(true);
    expect(validateConfirmPassword('password123', 'different123')).toBe(false);
    expect(validateConfirmPassword('', '')).toBe(true);
  });
});

describe('Complex Validation Scenarios', () => {
  it('should handle multiple validation rules', () => {
    const validateUser = (data: any) => {
      const errors: string[] = [];
      
      if (!validateRequired(data.name)) {
        errors.push('Nome é obrigatório');
      }
      
      if (!validateEmail(data.email)) {
        errors.push('Email inválido');
      }
      
      if (!validatePhone(data.phone)) {
        errors.push('Telefone inválido');
      }
      
      if (data.cpf && !validateCPF(data.cpf)) {
        errors.push('CPF inválido');
      }
      
      return errors;
    };

    // Valid user
    expect(validateUser({
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '11999999999',
      cpf: '12345678909'
    })).toEqual([]);

    // Invalid user
    expect(validateUser({
      name: '',
      email: 'invalid-email',
      phone: '123',
      cpf: '11111111111'
    })).toEqual([
      'Nome é obrigatório',
      'Email inválido',
      'Telefone inválido',
      'CPF inválido'
    ]);
  });

  it('should handle conditional validation', () => {
    const validateAddress = (data: any, isRequired = false) => {
      const errors: string[] = [];
      
      if (isRequired || data.cep) {
        if (!validateCEP(data.cep)) {
          errors.push('CEP inválido');
        }
      }
      
      if (isRequired || data.street) {
        if (!validateRequired(data.street)) {
          errors.push('Rua é obrigatória');
        }
      }
      
      return errors;
    };

    // Optional validation - no errors for empty fields
    expect(validateAddress({})).toEqual([]);
    
    // Optional validation - errors for invalid fields
    expect(validateAddress({ cep: '123', street: '' })).toEqual([
      'CEP inválido',
      'Rua é obrigatória'
    ]);
    
    // Required validation - errors for empty fields
    expect(validateAddress({}, true)).toEqual([
      'CEP inválido',
      'Rua é obrigatória'
    ]);
  });
});

describe('Performance and Edge Cases', () => {
  it('should handle large inputs efficiently', () => {
    const largeString = 'a'.repeat(10000);
    
    expect(() => validateRequired(largeString)).not.toThrow();
    expect(() => validateMinLength(largeString, 5000)).not.toThrow();
    expect(() => validateMaxLength(largeString, 15000)).not.toThrow();
    expect(() => sanitizeInput(largeString)).not.toThrow();
  });

  it('should handle null and undefined gracefully', () => {
    expect(() => validateEmail(null as any)).not.toThrow();
    expect(() => validatePhone(undefined as any)).not.toThrow();
    expect(() => validateCPF(null as any)).not.toThrow();
    expect(() => formatPhone(undefined as any)).not.toThrow();
    expect(() => sanitizeInput(null as any)).not.toThrow();
  });

  it('should handle special Unicode characters', () => {
    expect(validateRequired('João')).toBe(true);
    expect(validateRequired('María')).toBe(true);
    expect(validateRequired('北京')).toBe(true);
    expect(sanitizeInput('Café & Açaí')).toBe('Café & Açaí');
  });
});