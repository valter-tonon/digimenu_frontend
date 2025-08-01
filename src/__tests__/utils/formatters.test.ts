/**
 * Unit Tests for Formatter Utilities
 * Tests currency, date, and text formatting functions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  formatPercentage,
  formatNumber,
  formatFileSize,
  formatDuration,
  truncateText,
  capitalizeFirst,
  capitalizeWords,
  slugify,
  formatPhoneDisplay,
  formatCPFDisplay,
  formatCEPDisplay,
  parsePrice,
  formatOrderNumber,
  formatTrackingCode
} from '@/utils/formatters';

describe('Currency Formatting', () => {
  it('should format currency correctly', () => {
    expect(formatCurrency(25.99)).toBe('R$ 25,99');
    expect(formatCurrency(1000)).toBe('R$ 1.000,00');
    expect(formatCurrency(0)).toBe('R$ 0,00');
    expect(formatCurrency(0.5)).toBe('R$ 0,50');
  });

  it('should handle negative values', () => {
    expect(formatCurrency(-25.99)).toBe('-R$ 25,99');
    expect(formatCurrency(-1000)).toBe('-R$ 1.000,00');
  });

  it('should handle edge cases', () => {
    expect(formatCurrency(null as any)).toBe('R$ 0,00');
    expect(formatCurrency(undefined as any)).toBe('R$ 0,00');
    expect(formatCurrency(NaN)).toBe('R$ 0,00');
    expect(formatCurrency(Infinity)).toBe('R$ 0,00');
  });

  it('should support different currencies', () => {
    expect(formatCurrency(25.99, 'USD')).toBe('$25.99');
    expect(formatCurrency(25.99, 'EUR')).toBe('€25,99');
  });
});

describe('Date Formatting', () => {
  beforeEach(() => {
    // Mock timezone to ensure consistent tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-06-15T10:30:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should format dates correctly', () => {
    const date = new Date('2023-06-15');
    
    expect(formatDate(date)).toBe('15/06/2023');
    expect(formatDate(date, 'long')).toBe('15 de junho de 2023');
    expect(formatDate(date, 'short')).toBe('15/06');
  });

  it('should format time correctly', () => {
    const date = new Date('2023-06-15T14:30:00');
    
    expect(formatTime(date)).toBe('14:30');
    expect(formatTime(date, true)).toBe('14:30:00');
  });

  it('should format date and time together', () => {
    const date = new Date('2023-06-15T14:30:00');
    
    expect(formatDateTime(date)).toBe('15/06/2023 14:30');
    expect(formatDateTime(date, 'long')).toBe('15 de junho de 2023 às 14:30');
  });

  it('should format relative time', () => {
    const now = new Date('2023-06-15T10:30:00');
    const oneHourAgo = new Date('2023-06-15T09:30:00');
    const yesterday = new Date('2023-06-14T10:30:00');
    const oneWeekAgo = new Date('2023-06-08T10:30:00');

    expect(formatRelativeTime(oneHourAgo, now)).toBe('há 1 hora');
    expect(formatRelativeTime(yesterday, now)).toBe('há 1 dia');
    expect(formatRelativeTime(oneWeekAgo, now)).toBe('há 1 semana');
  });

  it('should handle string dates', () => {
    expect(formatDate('2023-06-15')).toBe('15/06/2023');
    expect(formatTime('2023-06-15T14:30:00')).toBe('14:30');
  });

  it('should handle invalid dates', () => {
    expect(formatDate('invalid-date')).toBe('Data inválida');
    expect(formatTime('invalid-time')).toBe('Hora inválida');
    expect(formatDateTime(null as any)).toBe('Data inválida');
  });
});

describe('Number Formatting', () => {
  it('should format percentages', () => {
    expect(formatPercentage(0.25)).toBe('25%');
    expect(formatPercentage(0.5)).toBe('50%');
    expect(formatPercentage(1)).toBe('100%');
    expect(formatPercentage(0.123)).toBe('12,3%');
  });

  it('should format numbers with separators', () => {
    expect(formatNumber(1000)).toBe('1.000');
    expect(formatNumber(1000000)).toBe('1.000.000');
    expect(formatNumber(1234.56)).toBe('1.234,56');
  });

  it('should format file sizes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(1073741824)).toBe('1 GB');
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('should format duration', () => {
    expect(formatDuration(60)).toBe('1:00');
    expect(formatDuration(3661)).toBe('1:01:01');
    expect(formatDuration(30)).toBe('0:30');
    expect(formatDuration(0)).toBe('0:00');
  });

  it('should handle edge cases for numbers', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(-1000)).toBe('-1.000');
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatDuration(-60)).toBe('0:00');
  });
});

describe('Text Formatting', () => {
  it('should truncate text correctly', () => {
    const longText = 'This is a very long text that should be truncated';
    
    expect(truncateText(longText, 20)).toBe('This is a very long...');
    expect(truncateText(longText, 50)).toBe(longText);
    expect(truncateText('Short', 20)).toBe('Short');
  });

  it('should capitalize first letter', () => {
    expect(capitalizeFirst('hello world')).toBe('Hello world');
    expect(capitalizeFirst('HELLO WORLD')).toBe('HELLO WORLD');
    expect(capitalizeFirst('')).toBe('');
    expect(capitalizeFirst('a')).toBe('A');
  });

  it('should capitalize all words', () => {
    expect(capitalizeWords('hello world')).toBe('Hello World');
    expect(capitalizeWords('joão da silva')).toBe('João Da Silva');
    expect(capitalizeWords('HELLO WORLD')).toBe('Hello World');
    expect(capitalizeWords('')).toBe('');
  });

  it('should create slugs', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('João & Maria')).toBe('joao-maria');
    expect(slugify('Product #123')).toBe('product-123');
    expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
  });

  it('should handle special characters in text formatting', () => {
    expect(capitalizeWords('café & açaí')).toBe('Café & Açaí');
    expect(slugify('Café & Açaí')).toBe('cafe-acai');
    expect(truncateText('João da Silva Pereira', 15)).toBe('João da Silva...');
  });
});

describe('Document Formatting', () => {
  it('should format phone for display', () => {
    expect(formatPhoneDisplay('11999999999')).toBe('(11) 99999-9999');
    expect(formatPhoneDisplay('1199999999')).toBe('(11) 9999-9999');
    expect(formatPhoneDisplay('invalid')).toBe('invalid');
  });

  it('should format CPF for display', () => {
    expect(formatCPFDisplay('12345678909')).toBe('123.456.789-09');
    expect(formatCPFDisplay('123456789')).toBe('123.456.789');
    expect(formatCPFDisplay('invalid')).toBe('invalid');
  });

  it('should format CEP for display', () => {
    expect(formatCEPDisplay('01234567')).toBe('01234-567');
    expect(formatCEPDisplay('0123456')).toBe('0123456');
    expect(formatCEPDisplay('invalid')).toBe('invalid');
  });
});

describe('Business Formatting', () => {
  it('should parse price strings', () => {
    expect(parsePrice('R$ 25,99')).toBe(25.99);
    expect(parsePrice('25,99')).toBe(25.99);
    expect(parsePrice('25.99')).toBe(25.99);
    expect(parsePrice('1.000,50')).toBe(1000.50);
    expect(parsePrice('invalid')).toBe(0);
  });

  it('should format order numbers', () => {
    expect(formatOrderNumber(123)).toBe('#000123');
    expect(formatOrderNumber(1)).toBe('#000001');
    expect(formatOrderNumber(999999)).toBe('#999999');
  });

  it('should format tracking codes', () => {
    expect(formatTrackingCode('ABC123DEF456')).toBe('ABC123-DEF456');
    expect(formatTrackingCode('ABCDEF123456')).toBe('ABCDEF-123456');
    expect(formatTrackingCode('SHORT')).toBe('SHORT');
  });
});

describe('Locale Support', () => {
  it('should support different locales for currency', () => {
    expect(formatCurrency(1234.56, 'BRL', 'pt-BR')).toBe('R$ 1.234,56');
    expect(formatCurrency(1234.56, 'USD', 'en-US')).toBe('$1,234.56');
  });

  it('should support different locales for dates', () => {
    const date = new Date('2023-06-15');
    
    expect(formatDate(date, 'default', 'pt-BR')).toBe('15/06/2023');
    expect(formatDate(date, 'default', 'en-US')).toBe('6/15/2023');
  });

  it('should support different locales for numbers', () => {
    expect(formatNumber(1234.56, 'pt-BR')).toBe('1.234,56');
    expect(formatNumber(1234.56, 'en-US')).toBe('1,234.56');
  });
});

describe('Performance and Edge Cases', () => {
  it('should handle null and undefined values', () => {
    expect(formatCurrency(null as any)).toBe('R$ 0,00');
    expect(formatDate(null as any)).toBe('Data inválida');
    expect(formatNumber(undefined as any)).toBe('0');
    expect(truncateText(null as any, 10)).toBe('');
    expect(capitalizeFirst(undefined as any)).toBe('');
  });

  it('should handle empty strings', () => {
    expect(truncateText('', 10)).toBe('');
    expect(capitalizeFirst('')).toBe('');
    expect(capitalizeWords('')).toBe('');
    expect(slugify('')).toBe('');
  });

  it('should handle extreme values', () => {
    expect(formatCurrency(Number.MAX_SAFE_INTEGER)).toContain('R$');
    expect(formatFileSize(Number.MAX_SAFE_INTEGER)).toContain('PB');
    expect(formatDuration(86400)).toBe('24:00:00'); // 24 hours
  });

  it('should be performant with large inputs', () => {
    const largeText = 'a'.repeat(10000);
    
    expect(() => truncateText(largeText, 100)).not.toThrow();
    expect(() => capitalizeWords(largeText)).not.toThrow();
    expect(() => slugify(largeText)).not.toThrow();
    
    expect(truncateText(largeText, 100)).toHaveLength(103); // 100 + '...'
  });
});

describe('Complex Formatting Scenarios', () => {
  it('should format complete order information', () => {
    const order = {
      id: 123,
      total: 89.99,
      createdAt: '2023-06-15T14:30:00',
      trackingCode: 'ABC123DEF456'
    };

    expect(formatOrderNumber(order.id)).toBe('#000123');
    expect(formatCurrency(order.total)).toBe('R$ 89,99');
    expect(formatDateTime(order.createdAt)).toBe('15/06/2023 14:30');
    expect(formatTrackingCode(order.trackingCode)).toBe('ABC123-DEF456');
  });

  it('should format customer information', () => {
    const customer = {
      name: 'joão da silva',
      phone: '11999999999',
      cpf: '12345678909'
    };

    expect(capitalizeWords(customer.name)).toBe('João Da Silva');
    expect(formatPhoneDisplay(customer.phone)).toBe('(11) 99999-9999');
    expect(formatCPFDisplay(customer.cpf)).toBe('123.456.789-09');
  });

  it('should format product information', () => {
    const product = {
      name: 'pizza margherita especial',
      price: 25.99,
      description: 'Uma deliciosa pizza com ingredientes frescos e selecionados, massa artesanal e molho especial da casa'
    };

    expect(capitalizeWords(product.name)).toBe('Pizza Margherita Especial');
    expect(formatCurrency(product.price)).toBe('R$ 25,99');
    expect(truncateText(product.description, 50)).toBe('Uma deliciosa pizza com ingredientes frescos e...');
    expect(slugify(product.name)).toBe('pizza-margherita-especial');
  });

  it('should handle mixed formatting requirements', () => {
    const data = {
      percentage: 0.15,
      fileSize: 2048576,
      duration: 3665,
      relativeTime: new Date(Date.now() - 3600000) // 1 hour ago
    };

    expect(formatPercentage(data.percentage)).toBe('15%');
    expect(formatFileSize(data.fileSize)).toBe('2 MB');
    expect(formatDuration(data.duration)).toBe('1:01:05');
    expect(formatRelativeTime(data.relativeTime)).toContain('hora');
  });
});