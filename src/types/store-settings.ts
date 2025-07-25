/**
 * Tipos para configurações da loja
 * 
 * Define interfaces para configurações de cadastro rápido,
 * autenticação e outras configurações relacionadas ao sistema
 * de pedidos com usuário visitante.
 */

export interface QuickRegistrationSettings {
  enabled: boolean;
  requirePhone: boolean;
  requireName: boolean;
  requireEmail: boolean;
  allowWhatsAppAuth: boolean;
  showTermsCheckbox: boolean;
  termsText?: string;
  privacyPolicyUrl?: string;
}

export interface AuthenticationSettings {
  allowGuestOrders: boolean;
  requireAuthForCheckout: boolean;
  enableWhatsAppAuth: boolean;
  enableQRCodeAccess: boolean;
  sessionTimeoutMinutes: {
    table: number;
    delivery: number;
  };
  maxSessionsPerTable: number;
  maxSessionsPerStore: number;
}

export interface SecuritySettings {
  enableFingerprinting: boolean;
  enableRateLimit: boolean;
  rateLimits: {
    qrCodePerHour: number;
    whatsAppPerDay: number;
    whatsAppPerHour: number;
    fingerprintPerHour: number;
  };
  blockSuspiciousActivity: boolean;
  enableAuditLogging: boolean;
  dataRetentionDays: number;
}

export interface NotificationSettings {
  enableOrderNotifications: boolean;
  enableSecurityAlerts: boolean;
  adminEmail?: string;
  webhookUrl?: string;
  notificationChannels: {
    email: boolean;
    webhook: boolean;
    inApp: boolean;
  };
}

export interface StoreSettings {
  id: string;
  storeId: string;
  quickRegistration: QuickRegistrationSettings;
  authentication: AuthenticationSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  updatedAt: Date;
  updatedBy?: string;
}

export interface StoreSettingsUpdate {
  quickRegistration?: Partial<QuickRegistrationSettings>;
  authentication?: Partial<AuthenticationSettings>;
  security?: Partial<SecuritySettings>;
  notifications?: Partial<NotificationSettings>;
}

// Configurações padrão para novas lojas
export const DEFAULT_STORE_SETTINGS: Omit<StoreSettings, 'id' | 'storeId' | 'updatedAt'> = {
  quickRegistration: {
    enabled: true,
    requirePhone: true,
    requireName: true,
    requireEmail: false,
    allowWhatsAppAuth: true,
    showTermsCheckbox: true,
    termsText: 'Ao continuar, você concorda com nossos termos de uso e política de privacidade.',
    privacyPolicyUrl: '/privacy-policy'
  },
  authentication: {
    allowGuestOrders: true,
    requireAuthForCheckout: false,
    enableWhatsAppAuth: true,
    enableQRCodeAccess: true,
    sessionTimeoutMinutes: {
      table: 240, // 4 horas
      delivery: 120 // 2 horas
    },
    maxSessionsPerTable: 10,
    maxSessionsPerStore: 1000
  },
  security: {
    enableFingerprinting: true,
    enableRateLimit: true,
    rateLimits: {
      qrCodePerHour: 10,
      whatsAppPerDay: 3,
      whatsAppPerHour: 2,
      fingerprintPerHour: 100
    },
    blockSuspiciousActivity: true,
    enableAuditLogging: true,
    dataRetentionDays: 30
  },
  notifications: {
    enableOrderNotifications: true,
    enableSecurityAlerts: true,
    notificationChannels: {
      email: false,
      webhook: false,
      inApp: true
    }
  }
};

// Validação de configurações
export interface SettingsValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateStoreSettings = (settings: Partial<StoreSettings>): SettingsValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validação de cadastro rápido
  if (settings.quickRegistration) {
    const qr = settings.quickRegistration;
    
    if (qr.enabled && !qr.requirePhone && !qr.requireEmail) {
      errors.push('Cadastro rápido deve exigir pelo menos telefone ou email');
    }
    
    if (qr.showTermsCheckbox && !qr.termsText) {
      warnings.push('Checkbox de termos habilitado mas texto não definido');
    }
  }

  // Validação de autenticação
  if (settings.authentication) {
    const auth = settings.authentication;
    
    if (auth.allowGuestOrders && auth.requireAuthForCheckout) {
      errors.push('Configuração conflitante: permite visitantes mas exige autenticação no checkout');
    }
    
    if (auth.sessionTimeoutMinutes) {
      if (auth.sessionTimeoutMinutes.table < 30) {
        warnings.push('Timeout de sessão de mesa muito baixo (< 30 min)');
      }
      if (auth.sessionTimeoutMinutes.delivery < 15) {
        warnings.push('Timeout de sessão de delivery muito baixo (< 15 min)');
      }
    }
  }

  // Validação de segurança
  if (settings.security) {
    const sec = settings.security;
    
    if (sec.enableRateLimit && sec.rateLimits) {
      if (sec.rateLimits.whatsAppPerDay < 1) {
        errors.push('Rate limit de WhatsApp por dia deve ser pelo menos 1');
      }
      if (sec.rateLimits.whatsAppPerHour > sec.rateLimits.whatsAppPerDay) {
        errors.push('Rate limit de WhatsApp por hora não pode ser maior que por dia');
      }
    }
    
    if (sec.dataRetentionDays < 1) {
      errors.push('Retenção de dados deve ser pelo menos 1 dia');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};