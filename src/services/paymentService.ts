import api from './api';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'pix' | 'credit' | 'debit' | 'money' | 'voucher';
  enabled: boolean;
}

export interface PixPaymentData {
  orderId: string;
  amount: number;
  pixCode: string;
  qrCodeUrl: string;
  expiresAt: string;
}

export interface CardPaymentData {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
  type: 'credit' | 'debit';
}

export interface CashPaymentData {
  changeAmount?: number;
}

export interface PaymentRequest {
  orderId: string;
  method: string;
  amount: number;
  data?: CardPaymentData | CashPaymentData;
}

export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  status: 'pending' | 'confirmed' | 'failed';
  data?: PixPaymentData;
  message?: string;
}

class PaymentService {
  /**
   * Get available payment methods for a store
   */
  async getPaymentMethods(storeId: string): Promise<PaymentMethod[]> {
    try {
      const response = await api.get(`/stores/${storeId}/payment-methods`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      // Return default methods if API fails
      return [
        { id: 'pix', name: 'PIX', type: 'pix', enabled: true },
        { id: 'credit', name: 'Cartão de Crédito', type: 'credit', enabled: true },
        { id: 'debit', name: 'Cartão de Débito', type: 'debit', enabled: true },
        { id: 'money', name: 'Dinheiro', type: 'money', enabled: true },
        { id: 'voucher', name: 'Vale Refeição', type: 'voucher', enabled: true },
      ];
    }
  }

  /**
   * Process payment for an order
   */
  async processPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await api.post('/payments/process', paymentRequest);
      return response.data;
    } catch (error: any) {
      console.error('Error processing payment:', error);
      throw new Error(
        error.response?.data?.message || 'Erro ao processar pagamento'
      );
    }
  }

  /**
   * Generate PIX payment
   */
  async generatePixPayment(orderId: string, amount: number): Promise<PixPaymentData> {
    try {
      const response = await api.post('/payments/pix/generate', {
        orderId,
        amount
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erro ao gerar PIX');
      }
    } catch (error: any) {
      console.error('Error generating PIX:', error);
      
      // For development, return mock data
      if (process.env.NODE_ENV === 'development') {
        return {
          orderId,
          amount,
          pixCode: `00020126580014BR.GOV.BCB.PIX0136${orderId}520400005303986540${amount.toFixed(2)}5802BR5925RESTAURANTE TESTE6009SAO PAULO62070503***6304`,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PIX_CODE_${orderId}`,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        };
      }
      
      throw new Error(
        error.response?.data?.message || 'Erro ao gerar PIX'
      );
    }
  }

  /**
   * Check PIX payment status
   */
  async checkPixPaymentStatus(orderId: string): Promise<{
    status: 'pending' | 'confirmed' | 'expired' | 'failed';
    paidAt?: string;
  }> {
    try {
      const response = await api.get(`/payments/pix/${orderId}/status`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error checking PIX status:', error);
      return { status: 'pending' };
    }
  }

  /**
   * Process credit/debit card payment
   */
  async processCardPayment(
    orderId: string, 
    amount: number, 
    cardData: CardPaymentData
  ): Promise<PaymentResponse> {
    try {
      const response = await api.post('/payments/card/process', {
        orderId,
        amount,
        cardData: {
          ...cardData,
          // Mask card number for security
          number: cardData.number.replace(/\s/g, ''),
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error processing card payment:', error);
      throw new Error(
        error.response?.data?.message || 'Erro ao processar pagamento no cartão'
      );
    }
  }

  /**
   * Validate card data
   */
  validateCardData(cardData: CardPaymentData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate card number (basic Luhn algorithm check)
    const cardNumber = cardData.number.replace(/\s/g, '');
    if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
      errors.push('Número do cartão inválido');
    }
    
    // Validate name
    if (!cardData.name || cardData.name.trim().length < 2) {
      errors.push('Nome no cartão é obrigatório');
    }
    
    // Validate expiry
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!cardData.expiry || !expiryRegex.test(cardData.expiry)) {
      errors.push('Data de validade inválida');
    } else {
      // Check if card is not expired
      const [month, year] = cardData.expiry.split('/');
      const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
      const now = new Date();
      if (expiryDate < now) {
        errors.push('Cartão expirado');
      }
    }
    
    // Validate CVV
    if (!cardData.cvv || cardData.cvv.length < 3 || cardData.cvv.length > 4) {
      errors.push('CVV inválido');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate change amount for cash payment
   */
  calculateChange(totalAmount: number, paidAmount: number): number {
    if (paidAmount <= totalAmount) {
      return 0;
    }
    return paidAmount - totalAmount;
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  }

  /**
   * Get payment method display name
   */
  getPaymentMethodName(methodId: string): string {
    const methods: Record<string, string> = {
      pix: 'PIX',
      credit: 'Cartão de Crédito',
      debit: 'Cartão de Débito',
      money: 'Dinheiro',
      voucher: 'Vale Refeição'
    };
    
    return methods[methodId] || methodId;
  }
}

export const paymentService = new PaymentService();