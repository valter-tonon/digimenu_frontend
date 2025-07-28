/**
 * Serviço de autenticação via WhatsApp
 * 
 * Gerencia magic links enviados via WhatsApp para autenticação
 * em contexto de delivery.
 */

import { sessionService } from './sessionService';
import { fingerprintService } from './fingerprint';

export interface WhatsAppAuthRequest {
  phone: string;
  storeId: string;
  fingerprint: string;
  ipAddress?: string;
  userAgent?: string;
  // Adicionar contexto da sessão
  sessionContext?: {
    tableId?: string;
    isDelivery: boolean;
  };
}

export interface WhatsAppAuthResponse {
  success: boolean;
  message: string;
  tokenId?: string;
  expiresAt?: Date;
  rateLimitRemaining?: number;
}

export interface MagicLinkToken {
  id: string;
  phone: string;
  storeId: string;
  fingerprint: string;
  token: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
  ipAddress?: string;
  userAgent?: string;
  sessionContext?: {
    tableId?: string;
    isDelivery: boolean;
  };
}

export interface TokenValidationResult {
  isValid: boolean;
  token?: MagicLinkToken;
  reason?: string;
  canCreateSession: boolean;
}

class WhatsAppAuthService {
  private readonly API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
  private readonly TOKEN_EXPIRY_MINUTES = 15;
  private readonly RATE_LIMIT_PER_DAY = 3;
  private readonly RATE_LIMIT_PER_HOUR = 2;

  /**
   * Solicita magic link via WhatsApp
   */
  async requestMagicLink(request: WhatsAppAuthRequest): Promise<WhatsAppAuthResponse> {
    try {
      // Valida formato do telefone
      const phoneValidation = this.validatePhoneNumber(request.phone);
      if (!phoneValidation.isValid) {
        return {
          success: false,
          message: phoneValidation.reason || 'Número de telefone inválido'
        };
      }

      // Verifica rate limiting
      const rateLimitCheck = await this.checkRateLimit(request.phone, request.fingerprint);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          message: rateLimitCheck.reason || 'Limite de tentativas excedido',
          rateLimitRemaining: rateLimitCheck.remaining
        };
      }

      // Gera token JWT temporário com contexto da sessão
      const token = await this.generateMagicLinkToken(request);

      // Envia WhatsApp (mock - integração com API real)
      const whatsappResult = await this.sendWhatsAppMessage(
        phoneValidation.normalizedPhone,
        token,
        request.storeId
      );

      if (!whatsappResult.success) {
        return {
          success: false,
          message: 'Erro ao enviar mensagem via WhatsApp'
        };
      }

      // Registra tentativa para rate limiting
      await this.recordAuthAttempt(request.phone, request.fingerprint, true);

      return {
        success: true,
        message: 'Link de acesso enviado via WhatsApp',
        tokenId: token.id,
        expiresAt: token.expiresAt,
        rateLimitRemaining: rateLimitCheck.remaining - 1
      };

    } catch (error) {
      console.error('Erro ao solicitar magic link:', error);
      return {
        success: false,
        message: 'Erro interno ao solicitar acesso'
      };
    }
  }

  /**
   * Valida token de magic link
   */
  async validateMagicLinkToken(tokenString: string): Promise<TokenValidationResult> {
    try {
      // Decodifica e valida JWT
      const tokenData = await this.decodeJWTToken(tokenString);
      if (!tokenData) {
        return {
          isValid: false,
          reason: 'Token inválido ou malformado',
          canCreateSession: false
        };
      }

      // Busca token no armazenamento
      const storedToken = await this.getStoredToken(tokenData.id);
      if (!storedToken) {
        return {
          isValid: false,
          reason: 'Token não encontrado',
          canCreateSession: false
        };
      }

      // Verifica se token já foi usado
      if (storedToken.isUsed) {
        return {
          isValid: false,
          reason: 'Token já foi utilizado',
          canCreateSession: false
        };
      }

      // Verifica expiração
      if (new Date() > storedToken.expiresAt) {
        await this.markTokenAsUsed(storedToken.id);
        return {
          isValid: false,
          reason: 'Token expirado',
          canCreateSession: false
        };
      }

      // Valida fingerprint (opcional - pode ter mudado de dispositivo)
      const fingerprintMatch = await this.validateFingerprint(
        storedToken.fingerprint,
        tokenData.fingerprint
      );

      return {
        isValid: true,
        token: storedToken,
        canCreateSession: true
      };

    } catch (error) {
      console.error('Erro ao validar token:', error);
      return {
        isValid: false,
        reason: 'Erro ao validar token',
        canCreateSession: false
      };
    }
  }

  /**
   * Cria sessão após validação bem-sucedida do token
   */
  async createSessionFromToken(tokenString: string): Promise<{
    success: boolean;
    sessionId?: string;
    customerId?: string;
    message?: string;
  }> {
    try {
      // Valida token
      const validation = await this.validateMagicLinkToken(tokenString);
      if (!validation.isValid || !validation.token) {
        return {
          success: false,
          message: validation.reason || 'Token inválido'
        };
      }

      const token = validation.token;

      // Marca token como usado
      await this.markTokenAsUsed(token.id);

      // Verifica se usuário já existe
      const existingCustomer = await this.findCustomerByPhone(token.phone);

      // Obtém contexto da sessão do token
      const sessionContext = token.sessionContext || { isDelivery: true };

      // Cria sessão contextual respeitando o contexto original
      const session = await sessionService.createSession({
        storeId: token.storeId,
        fingerprint: token.fingerprint,
        type: sessionContext.isDelivery ? 'delivery' : 'table',
        isDelivery: sessionContext.isDelivery,
        tableId: sessionContext.tableId,
        customerId: existingCustomer?.uuid,
        ipAddress: token.ipAddress,
        userAgent: token.userAgent
      });

      // Se usuário existe, associa à sessão
      if (existingCustomer) {
        await sessionService.associateCustomer(session.id, existingCustomer.uuid);
      }

      console.log('Sessão criada via WhatsApp:', {
        sessionId: session.id,
        phone: token.phone,
        customerId: existingCustomer?.uuid,
        context: sessionContext
      });

      return {
        success: true,
        sessionId: session.id,
        customerId: existingCustomer?.uuid,
        message: 'Sessão criada com sucesso'
      };

    } catch (error) {
      console.error('Erro ao criar sessão do token:', error);
      return {
        success: false,
        message: 'Erro ao criar sessão'
      };
    }
  }

  /**
   * Valida formato do número de telefone brasileiro
   */
  private validatePhoneNumber(phone: string): {
    isValid: boolean;
    normalizedPhone?: string;
    reason?: string;
  } {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');

    // Verifica se tem 11 dígitos (celular) ou 10 dígitos (fixo)
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      return {
        isValid: false,
        reason: 'Número deve ter 10 ou 11 dígitos'
      };
    }

    // Verifica se começa com código do país (55)
    let normalizedPhone = cleanPhone;
    if (cleanPhone.length === 13 && cleanPhone.startsWith('55')) {
      normalizedPhone = cleanPhone.substring(2);
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('55')) {
      normalizedPhone = cleanPhone.substring(2);
    }

    // Verifica formato brasileiro (DDD + número)
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

    // Para celular, verifica se o terceiro dígito é 9
    if (normalizedPhone.length === 11 && normalizedPhone[2] !== '9') {
      return {
        isValid: false,
        reason: 'Número de celular deve começar com 9 após o DDD'
      };
    }

    return {
      isValid: true,
      normalizedPhone: `55${normalizedPhone}` // Adiciona código do país
    };
  }

  /**
   * Verifica rate limiting para telefone e fingerprint
   */
  private async checkRateLimit(phone: string, fingerprint: string): Promise<{
    allowed: boolean;
    remaining: number;
    reason?: string;
  }> {
    try {
      // Verifica tentativas por telefone (3 por dia)
      const phoneAttempts = await this.getAuthAttempts(phone, 'phone', 24 * 60); // 24 horas
      if (phoneAttempts.length >= this.RATE_LIMIT_PER_DAY) {
        return {
          allowed: false,
          remaining: 0,
          reason: 'Limite diário de tentativas excedido para este telefone'
        };
      }

      // Verifica tentativas por fingerprint (2 por hora)
      const fingerprintAttempts = await this.getAuthAttempts(fingerprint, 'fingerprint', 60); // 1 hora
      if (fingerprintAttempts.length >= this.RATE_LIMIT_PER_HOUR) {
        return {
          allowed: false,
          remaining: 0,
          reason: 'Limite de tentativas por hora excedido'
        };
      }

      return {
        allowed: true,
        remaining: Math.min(
          this.RATE_LIMIT_PER_DAY - phoneAttempts.length,
          this.RATE_LIMIT_PER_HOUR - fingerprintAttempts.length
        )
      };

    } catch (error) {
      console.error('Erro ao verificar rate limit:', error);
      // Em caso de erro, permite a tentativa
      return { allowed: true, remaining: 1 };
    }
  }

  /**
   * Gera token JWT para magic link
   */
  private async generateMagicLinkToken(request: WhatsAppAuthRequest): Promise<MagicLinkToken> {
    const tokenId = this.generateUniqueId();
    const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_MINUTES * 60 * 1000);

    // Em produção, usar biblioteca JWT real
    const jwtPayload = {
      id: tokenId,
      phone: request.phone,
      storeId: request.storeId,
      fingerprint: request.fingerprint,
      // Incluir contexto da sessão no token
      sessionContext: request.sessionContext || { isDelivery: true },
      exp: Math.floor(expiresAt.getTime() / 1000)
    };

    const token: MagicLinkToken = {
      id: tokenId,
      phone: request.phone,
      storeId: request.storeId,
      fingerprint: request.fingerprint,
      token: this.encodeJWT(jwtPayload),
      expiresAt,
      isUsed: false,
      createdAt: new Date(),
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      // Armazenar contexto da sessão no token
      sessionContext: request.sessionContext || { isDelivery: true }
    };

    // Armazena token
    await this.storeToken(token);

    return token;
  }

  /**
   * Envia mensagem via WhatsApp (mock)
   */
  private async sendWhatsAppMessage(
    phone: string,
    token: MagicLinkToken,
    storeId: string
  ): Promise<{ success: boolean; messageId?: string }> {
    try {
      // Mock - em produção, integrar com API do WhatsApp Business
      const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/whatsapp/verify?token=${token.token}`;
      
      const message = `🍽️ *DigiMenu - Link de Acesso*

Clique no link abaixo para acessar o cardápio:
${magicLink}

⏰ Este link expira em ${this.TOKEN_EXPIRY_MINUTES} minutos.
🔒 Use apenas se você solicitou este acesso.

_Não compartilhe este link com outras pessoas._`;

      console.log('WhatsApp message (mock):', {
        to: phone,
        message,
        tokenId: token.id
      });

      // Simula envio bem-sucedido
      return {
        success: true,
        messageId: `msg_${Date.now()}`
      };

    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      return { success: false };
    }
  }

  /**
   * Métodos auxiliares para armazenamento (mock - usar banco real em produção)
   */
  private async storeToken(token: MagicLinkToken): Promise<void> {
    const key = `whatsapp_token_${token.id}`;
    localStorage.setItem(key, JSON.stringify(token));
  }

  private async getStoredToken(tokenId: string): Promise<MagicLinkToken | null> {
    try {
      const key = `whatsapp_token_${tokenId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private async markTokenAsUsed(tokenId: string): Promise<void> {
    const token = await this.getStoredToken(tokenId);
    if (token) {
      token.isUsed = true;
      await this.storeToken(token);
    }
  }

  private async recordAuthAttempt(
    identifier: string,
    fingerprint: string,
    success: boolean
  ): Promise<void> {
    const attempt = {
      identifier,
      fingerprint,
      success,
      timestamp: new Date().toISOString()
    };

    const key = `auth_attempts_${identifier}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push(attempt);
    
    // Mantém apenas últimas 10 tentativas
    const recent = existing.slice(-10);
    localStorage.setItem(key, JSON.stringify(recent));
  }

  private async getAuthAttempts(
    identifier: string,
    type: 'phone' | 'fingerprint',
    minutesBack: number
  ): Promise<any[]> {
    try {
      const key = `auth_attempts_${identifier}`;
      const attempts = JSON.parse(localStorage.getItem(key) || '[]');
      
      const cutoff = new Date(Date.now() - minutesBack * 60 * 1000);
      
      return attempts.filter((attempt: any) => 
        new Date(attempt.timestamp) > cutoff
      );
    } catch {
      return [];
    }
  }

  private async findCustomerByPhone(phone: string): Promise<any | null> {
    // Mock - em produção, buscar no backend
    return null;
  }

  private async validateFingerprint(
    storedFingerprint: string,
    currentFingerprint: string
  ): Promise<boolean> {
    // Permite pequenas diferenças no fingerprint
    return storedFingerprint === currentFingerprint;
  }

  private async decodeJWTToken(token: string): Promise<any | null> {
    try {
      // Mock - em produção, usar biblioteca JWT real
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch {
      return null;
    }
  }

  private encodeJWT(payload: any): string {
    // Mock - em produção, usar biblioteca JWT real com assinatura
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = btoa(`signature_${Date.now()}`); // Mock signature
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private generateUniqueId(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
}

export const whatsappAuthService = new WhatsAppAuthService();