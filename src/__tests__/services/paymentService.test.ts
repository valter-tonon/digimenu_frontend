import { paymentService } from '@/services/paymentService';
import { api } from '@/services/api';
import { vi } from 'vitest';

// Mock the API
vi.mock('@/services/api');
const mockedApi = api as any;

describe('PaymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPaymentMethods', () => {
    it('returns payment methods from API', async () => {
      const mockMethods = [
        { id: 'pix', name: 'PIX', type: 'pix', enabled: true },
        { id: 'credit', name: 'Cartão de Crédito', type: 'credit', enabled: true },
      ];

      mockedApi.get.mockResolvedValue({
        data: { data: mockMethods }
      });

      const result = await paymentService.getPaymentMethods('store-123');

      expect(mockedApi.get).toHaveBeenCalledWith('/stores/store-123/payment-methods');
      expect(result).toEqual(mockMethods);
    });

    it('returns default methods when API fails', async () => {
      mockedApi.get.mockRejectedValue(new Error('API Error'));

      const result = await paymentService.getPaymentMethods('store-123');

      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({ id: 'pix', name: 'PIX', type: 'pix', enabled: true });
    });
  });

  describe('processPayment', () => {
    it('processes payment successfully', async () => {
      const mockResponse = {
        success: true,
        paymentId: 'payment-123',
        status: 'confirmed'
      };

      mockedApi.post.mockResolvedValue({
        data: mockResponse
      });

      const paymentRequest = {
        orderId: 'order-123',
        method: 'pix',
        amount: 25.50
      };

      const result = await paymentService.processPayment(paymentRequest);

      expect(mockedApi.post).toHaveBeenCalledWith('/payments/process', paymentRequest);
      expect(result).toEqual(mockResponse);
    });

    it('throws error when payment processing fails', async () => {
      mockedApi.post.mockRejectedValue({
        response: {
          data: { message: 'Payment failed' }
        }
      });

      const paymentRequest = {
        orderId: 'order-123',
        method: 'pix',
        amount: 25.50
      };

      await expect(paymentService.processPayment(paymentRequest))
        .rejects.toThrow('Payment failed');
    });
  });

  describe('generatePixPayment', () => {
    it('generates PIX payment successfully', async () => {
      const mockPixData = {
        orderId: 'order-123',
        amount: 25.50,
        pixCode: 'PIX_CODE_123',
        qrCodeUrl: 'https://qr.code.url',
        expiresAt: '2023-12-01T12:00:00Z'
      };

      mockedApi.post.mockResolvedValue({
        data: {
          success: true,
          data: mockPixData
        }
      });

      const result = await paymentService.generatePixPayment('order-123', 25.50);

      expect(mockedApi.post).toHaveBeenCalledWith('/payments/pix/generate', {
        orderId: 'order-123',
        amount: 25.50
      });
      expect(result).toEqual(mockPixData);
    });

    it('returns mock data in development mode when API fails', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      mockedApi.post.mockRejectedValue(new Error('API Error'));

      const result = await paymentService.generatePixPayment('order-123', 25.50);

      expect(result.orderId).toBe('order-123');
      expect(result.amount).toBe(25.50);
      expect(result.pixCode).toContain('order-123');
      expect(result.qrCodeUrl).toContain('order-123');

      process.env.NODE_ENV = originalEnv;
    });

    it('throws error in production mode when API fails', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      mockedApi.post.mockRejectedValue(new Error('API Error'));

      await expect(paymentService.generatePixPayment('order-123', 25.50))
        .rejects.toThrow('Erro ao gerar PIX');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('checkPixPaymentStatus', () => {
    it('returns payment status from API', async () => {
      const mockStatus = {
        status: 'confirmed',
        paidAt: '2023-12-01T12:00:00Z'
      };

      mockedApi.get.mockResolvedValue({
        data: { data: mockStatus }
      });

      const result = await paymentService.checkPixPaymentStatus('order-123');

      expect(mockedApi.get).toHaveBeenCalledWith('/payments/pix/order-123/status');
      expect(result).toEqual(mockStatus);
    });

    it('returns pending status when API fails', async () => {
      mockedApi.get.mockRejectedValue(new Error('API Error'));

      const result = await paymentService.checkPixPaymentStatus('order-123');

      expect(result).toEqual({ status: 'pending' });
    });
  });

  describe('processCardPayment', () => {
    it('processes card payment successfully', async () => {
      const mockResponse = {
        success: true,
        paymentId: 'payment-123',
        status: 'confirmed'
      };

      mockedApi.post.mockResolvedValue({
        data: mockResponse
      });

      const cardData = {
        number: '1234 5678 9012 3456',
        name: 'JOHN DOE',
        expiry: '12/25',
        cvv: '123',
        type: 'credit' as const
      };

      const result = await paymentService.processCardPayment('order-123', 25.50, cardData);

      expect(mockedApi.post).toHaveBeenCalledWith('/payments/card/process', {
        orderId: 'order-123',
        amount: 25.50,
        cardData: {
          ...cardData,
          number: '1234567890123456' // Spaces removed
        }
      });
      expect(result).toEqual(mockResponse);
    });

    it('throws error when card payment fails', async () => {
      mockedApi.post.mockRejectedValue({
        response: {
          data: { message: 'Card declined' }
        }
      });

      const cardData = {
        number: '1234 5678 9012 3456',
        name: 'JOHN DOE',
        expiry: '12/25',
        cvv: '123',
        type: 'credit' as const
      };

      await expect(paymentService.processCardPayment('order-123', 25.50, cardData))
        .rejects.toThrow('Card declined');
    });
  });

  describe('validateCardData', () => {
    it('validates valid card data', () => {
      const cardData = {
        number: '1234 5678 9012 3456',
        name: 'JOHN DOE',
        expiry: '12/25',
        cvv: '123',
        type: 'credit' as const
      };

      const result = paymentService.validateCardData(cardData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates invalid card number', () => {
      const cardData = {
        number: '123',
        name: 'JOHN DOE',
        expiry: '12/25',
        cvv: '123',
        type: 'credit' as const
      };

      const result = paymentService.validateCardData(cardData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Número do cartão inválido');
    });

    it('validates empty name', () => {
      const cardData = {
        number: '1234 5678 9012 3456',
        name: '',
        expiry: '12/25',
        cvv: '123',
        type: 'credit' as const
      };

      const result = paymentService.validateCardData(cardData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Nome no cartão é obrigatório');
    });

    it('validates invalid expiry format', () => {
      const cardData = {
        number: '1234 5678 9012 3456',
        name: 'JOHN DOE',
        expiry: '1225',
        cvv: '123',
        type: 'credit' as const
      };

      const result = paymentService.validateCardData(cardData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Data de validade inválida');
    });

    it('validates expired card', () => {
      const cardData = {
        number: '1234 5678 9012 3456',
        name: 'JOHN DOE',
        expiry: '01/20', // Expired
        cvv: '123',
        type: 'credit' as const
      };

      const result = paymentService.validateCardData(cardData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cartão expirado');
    });

    it('validates invalid CVV', () => {
      const cardData = {
        number: '1234 5678 9012 3456',
        name: 'JOHN DOE',
        expiry: '12/25',
        cvv: '12',
        type: 'credit' as const
      };

      const result = paymentService.validateCardData(cardData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('CVV inválido');
    });
  });

  describe('calculateChange', () => {
    it('calculates change correctly', () => {
      const change = paymentService.calculateChange(25.50, 30.00);
      expect(change).toBe(4.50);
    });

    it('returns zero when paid amount equals total', () => {
      const change = paymentService.calculateChange(25.50, 25.50);
      expect(change).toBe(0);
    });

    it('returns zero when paid amount is less than total', () => {
      const change = paymentService.calculateChange(25.50, 20.00);
      expect(change).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    it('formats currency correctly', () => {
      const formatted = paymentService.formatCurrency(25.50);
      expect(formatted).toBe('R$ 25,50');
    });

    it('formats large amounts correctly', () => {
      const formatted = paymentService.formatCurrency(1234.56);
      expect(formatted).toBe('R$ 1.234,56');
    });
  });

  describe('getPaymentMethodName', () => {
    it('returns correct payment method names', () => {
      expect(paymentService.getPaymentMethodName('pix')).toBe('PIX');
      expect(paymentService.getPaymentMethodName('credit')).toBe('Cartão de Crédito');
      expect(paymentService.getPaymentMethodName('debit')).toBe('Cartão de Débito');
      expect(paymentService.getPaymentMethodName('money')).toBe('Dinheiro');
      expect(paymentService.getPaymentMethodName('voucher')).toBe('Vale Refeição');
    });

    it('returns method id for unknown methods', () => {
      expect(paymentService.getPaymentMethodName('unknown')).toBe('unknown');
    });
  });
});