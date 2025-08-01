/**
 * Serviço de cadastro rápido no checkout
 *
 * Gerencia cadastro de usuários visitantes durante o checkout,
 * validação de dados e integração com sistema de sessões.
 */

import { sessionService } from './sessionService';

export interface QuickRegistrationData {
  name: string;
  phone: string;
  email?: string;
  acceptTerms: boolean;
  storeId: string;
  sessionId: string;
  fingerprint: string;
}

export interface QuickRegistrationResult {
  success: boolean;
  customerId?: string;
  customer?: Customer;
  message?: string;
  errors?: string[];
}

export interface Customer {
  id: number;
  uuid: string;
  name: string;
  phone: string;
  email?: string;
  mobile_phone: string;
  image?: string;
  isQuickRegistered: boolean;
  createdAt: Date;
  addresses?: CustomerAddress[];
}

export interface CustomerAddress {
  id: number;
  uuid: string;
  title: string;
  address: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  zipcode: string;
  is_default: boolean;
}

export interface PhoneValidationResult {
  isValid: boolean;
  normalizedPhone?: string;
  reason?: string;
  type?: 'mobile' | 'landline';
}

class QuickRegistrationService {
  private readonly API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

  /**
   * Registra usuário rapidamente no checkout
   */
  async registerQuickCustomer(data: QuickRegistrationData): Promise<QuickRegistrationResult> {
    try {
      // Valida dados de entrada
      const validation = this.validateRegistrationData(data);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Dados inválidos',
          errors: validation.errors
        };
      }

      // Verifica se usuário já existe
      const existingCustomer = await this.findExistingCustomer(data.phone, data.email);
      if (existingCustomer) {
        // Se usuário existe, associa à sessão e retorna
        await this.associateExistingCustomer(data.sessionId, existingCustomer);

        return {
          success: true,
          customerId: existingCustomer.uuid,
          customer: existingCustomer,
          message: 'Bem-vindo de volta! Seus dados foram recuperados.'
        };
      }

      // Cria novo cliente
      const newCustomer = await this.createQuickCustomer(data);

      // Associa cliente à sessão
      await sessionService.associateCustomer(data.sessionId, newCustomer.uuid);

      // Registra evento de cadastro rápido
      await this.logQuickRegistration(newCustomer.uuid, data.storeId, data.fingerprint);

      console.log('Cliente cadastrado rapidamente:', {
        customerId: newCustomer.uuid,
        phone: data.phone,
        sessionId: data.sessionId
      });

      return {
        success: true,
        customerId: newCustomer.uuid,
        customer: newCustomer,
        message: 'Cadastro realizado com sucesso!'
      };

    } catch (error) {
      console.error('Erro no cadastro rápido:', error);

      return {
        success: false,
        message: 'Erro interno no cadastro',
        errors: ['Tente novamente em alguns instantes']
      };
    }
  }

  /**
   * Valida dados de cadastro
   */
  private validateRegistrationData(data: QuickRegistrationData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Valida nome
    if (!data.name || data.name.trim().length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    }

    if (data.name && data.name.length > 100) {
      errors.push('Nome muito longo (máximo 100 caracteres)');
    }

    // Valida telefone
    const phoneValidation = this.validatePhoneNumber(data.phone);
    if (!phoneValidation.isValid) {
      errors.push(phoneValidation.reason || 'Telefone inválido');
    }

    // Valida email se fornecido
    if (data.email && !this.validateEmail(data.email)) {
      errors.push('Email inválido');
    }

    // Valida aceitação de termos
    if (!data.acceptTerms) {
      errors.push('É necessário aceitar os termos de uso');
    }

    // Valida IDs obrigatórios
    if (!data.storeId) {
      errors.push('ID da loja é obrigatório');
    }

    if (!data.sessionId) {
      errors.push('Sessão inválida');
    }

    if (!data.fingerprint) {
      errors.push('Identificação do dispositivo inválida');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida número de telefone brasileiro
   */
  private validatePhoneNumber(phone: string): PhoneValidationResult {
    if (!phone) {
      return {
        isValid: false,
        reason: 'Telefone é obrigatório'
      };
    }

    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');

    // Verifica comprimento
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      return {
        isValid: false,
        reason: 'Telefone deve ter 10 ou 11 dígitos'
      };
    }

    // Remove código do país se presente
    let normalizedPhone = cleanPhone;
    if (cleanPhone.length === 13 && cleanPhone.startsWith('55')) {
      normalizedPhone = cleanPhone.substring(2);
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('55')) {
      normalizedPhone = cleanPhone.substring(2);
    }

    // Valida DDD
    const ddd = normalizedPhone.substring(0, 2);
    const validDDDs = [
      '11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
      '21', '22', '24', // RJ
      '27', '28', // ES
      '31', '32', '33', '34', '35', '37', '38', // MG
      '41', '42', '43', '44', '45', '46', // PR
      '47', '48', '49', // SC
      '51', '53', '54', '55', // RS
      '61', // DF
      '62', '64', // GO
      '63', // TO
      '65', '66', // MT
      '67', // MS
      '68', // AC
      '69', // RO
      '71', '73', '74', '75', '77', // BA
      '79', // SE
      '81', '87', // PE
      '82', // AL
      '83', // PB
      '84', // RN
      '85', '88', // CE
      '86', '89', // PI
      '91', '93', '94', // PA
      '92', '97', // AM
      '95', // RR
      '96', // AP
      '98', '99' // MA
    ];

    if (!validDDDs.includes(ddd)) {
      return {
        isValid: false,
        reason: 'DDD inválido'
      };
    }

    // Determina tipo (celular ou fixo)
    const type = normalizedPhone.length === 11 ? 'mobile' : 'landline';

    // Para celular, verifica se começa com 9
    if (type === 'mobile' && normalizedPhone[2] !== '9') {
      return {
        isValid: false,
        reason: 'Número de celular deve começar com 9 após o DDD'
      };
    }

    return {
      isValid: true,
      normalizedPhone: `55${normalizedPhone}`,
      type
    };
  }

  /**
   * Valida formato de email
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  }

  /**
   * Busca cliente existente por telefone ou email
   */
  private async findExistingCustomer(phone: string, email?: string): Promise<Customer | null> {
    try {
      const phoneValidation = this.validatePhoneNumber(phone);
      const normalizedPhone = phoneValidation.normalizedPhone;

      // Em produção, fazer chamada para API
      // const response = await fetch(`${this.API_BASE}/customers/search`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ phone: normalizedPhone, email })
      // });
      //
      // if (response.ok) {
      //   const data = await response.json();
      //   return data.customer || null;
      // }

      // Mock para desenvolvimento - simula que não encontra cliente existente
      return null;

    } catch (error) {
      console.error('Erro ao buscar cliente existente:', error);
      return null;
    }
  }

  /**
   * Cria novo cliente com cadastro rápido
   */
  private async createQuickCustomer(data: QuickRegistrationData): Promise<Customer> {
    const phoneValidation = this.validatePhoneNumber(data.phone);
    const normalizedPhone = phoneValidation.normalizedPhone!;
    const customerData = {
      name: data.name.trim(),
      phone: normalizedPhone,
      mobile_phone: normalizedPhone,
      email: data.email?.trim() || null,
      isQuickRegistered: true,
      registrationSource: 'quick_checkout',
      storeId: data.storeId,
      fingerprint: data.fingerprint,
      acceptedTermsAt: new Date(),
      createdAt: new Date()
    };

    try {
      // Em produção, fazer chamada para API
      // const response = await fetch(`${this.API_BASE}/customers`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(customerData)
      // });
      //
      // if (!response.ok) {
      //   throw new Error('Erro ao criar cliente');
      // }
      //
      // return response.json();

      // Mock para desenvolvimento
      const mockCustomer: Customer = {
        id: Math.floor(Math.random() * 10000),
        uuid: `customer_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email || undefined,
        mobile_phone: customerData.mobile_phone,
        isQuickRegistered: true,
        createdAt: new Date(),
        addresses: []
      };

      return mockCustomer;

    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw new Error('Falha ao criar conta do cliente');
    }
  }

  /**
   * Associa cliente existente à sessão
   */
  private async associateExistingCustomer(sessionId: string, customer: Customer): Promise<void> {
    try {
      await sessionService.associateCustomer(sessionId, customer.uuid);
      console.log('Cliente existente associado à sessão:', {
        sessionId,
        customerId: customer.uuid
      });
    } catch (error) {
      console.error('Erro ao associar cliente existente:', error);
      throw error;
    }
  }

  /**
   * Registra evento de cadastro rápido para auditoria
   */
  private async logQuickRegistration(
    customerId: string,
    storeId: string,
    fingerprint: string
  ): Promise<void> {
    try {
      const logData = {
        event: 'quick_registration',
        customerId,
        storeId,
        fingerprint,
        timestamp: new Date(),
        source: 'checkout'
      };

      // Em produção, enviar para serviço de auditoria
      console.log('Quick registration logged:', logData);

    } catch (error) {
      console.error('Erro ao registrar log de cadastro rápido:', error);
      // Não falha o processo principal se log falhar
    }
  }

  /**
   * Verifica se telefone já está em uso
   */
  async isPhoneInUse(phone: string): Promise<boolean> {
    try {
      const customer = await this.findExistingCustomer(phone);
      return customer !== null;
    } catch (error) {
      console.error('Erro ao verificar telefone:', error);
      return false;
    }
  }

  /**
   * Verifica se email já está em uso
   */
  async isEmailInUse(email: string): Promise<boolean> {
    try {
      // Em produção, fazer chamada para API
      // const response = await fetch(`${this.API_BASE}/customers/check-email`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email })
      // });
      //
      // if (response.ok) {
      //   const data = await response.json();
      //   return data.exists;
      // }

      // Mock para desenvolvimento
      return false;

    } catch (error) {
      console.error('Erro ao verificar email:', error);
      return false;
    }
  }

  /**
   * Formata telefone para exibição
   */
  formatPhoneForDisplay(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length === 11) {
      return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleanPhone.length === 10) {
      return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }

    return phone;
  }
}

export const quickRegistrationService = new QuickRegistrationService();
