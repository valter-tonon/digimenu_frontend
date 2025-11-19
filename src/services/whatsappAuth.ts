/**
 * Serviço de autenticação via WhatsApp
 * 
 * Gerencia magic links enviados via WhatsApp para autenticação
 * com JWT storage, auto-refresh e retry logic.
 */

import axios from 'axios';

export interface WhatsAppAuthRequest {
  phone: string;
  tenant_id: string;
}

export interface WhatsAppAuthResponse {
  success: boolean;
  message: string;
  expiresAt?: Date;
}

export interface TokenVerificationResponse {
  success: boolean;
  jwt?: string;
  user?: User;
  message?: string;
}

export interface User {
  id: number;
  uuid: string;
  name: string;
  phone: string;
  email?: string;
  tenant_id: string;
}

export interface JWTPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  nbf: number;
  jti: string;
  user: User;
  permissions: string[];
  auth_method: string;
}

export interface StoredAuth {
  jwt: string;
  user: User;
  expiresAt: Date;
  refreshToken?: string;
}

class WhatsAppAuthService {
  private readonly API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api/v1';
  private readonly JWT_STORAGE_KEY = 'whatsapp_auth_jwt';
  private readonly JWT_COOKIE_NAME = 'whatsapp_auth_jwt';
  private readonly COOKIE_MAX_AGE_DAYS = 30; // Cookie persiste por 30 dias
  private readonly REFRESH_THRESHOLD_MINUTES = 30; // Refresh when less than 30 minutes remaining
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY_MS = 1000;

  private refreshTimer?: NodeJS.Timeout;

  /**
   * Solicita magic link via WhatsApp
   */
  async requestMagicLink(phone: string, tenantId: string): Promise<WhatsAppAuthResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await axios.post(`${this.API_BASE}/auth/whatsapp/request`, {
          phone,
          tenant_id: tenantId
        });

        if (response.data.success) {
          return {
            success: true,
            message: response.data.message,
            expiresAt: response.data.expires_at ? new Date(response.data.expires_at) : undefined
          };
        } else {
          return {
            success: false,
            message: response.data.message || 'Erro ao solicitar link mágico'
          };
        }
      } catch (error: any) {
        lastError = error;
        console.error(`Tentativa ${attempt} falhou:`, error);

        // Se não é o último attempt, aguarda antes de tentar novamente
        if (attempt < this.MAX_RETRY_ATTEMPTS) {
          await this.delay(this.RETRY_DELAY_MS * attempt);
        }
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    const errorMessage = (lastError as any)?.response?.data?.message || 'Erro ao solicitar autenticação via WhatsApp';
    return {
      success: false,
      message: errorMessage
    };
  }

  /**
   * Verifica token de magic link e retorna JWT
   * Note: This method is used for direct API calls, not for handling backend redirects
   */
  async verifyToken(token: string): Promise<TokenVerificationResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        // Make direct API call to verify token
        const response = await axios.get(`${this.API_BASE}/auth/whatsapp/verify/${token}`, {
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (response.data.success) {
          const jwt = response.data.jwt;
          const user = response.data.user;

          if (jwt && user) {
            // Armazena JWT (cookie + localStorage)
            await this.storeJWT(jwt, user);

            return {
              success: true,
              jwt,
              user
            };
          }
        }

        return {
          success: false,
          message: response.data.message || 'Token inválido'
        };
      } catch (error: any) {
        lastError = error;
        console.error(`Tentativa ${attempt} de verificação falhou:`, error);

        // Parse error response
        if (error.response?.status === 404) {
          return {
            success: false,
            message: 'Token não encontrado ou expirado'
          };
        }

        if (error.response?.status === 400) {
          return {
            success: false,
            message: 'Token inválido'
          };
        }

        // Se não é o último attempt, aguarda antes de tentar novamente
        if (attempt < this.MAX_RETRY_ATTEMPTS) {
          await this.delay(this.RETRY_DELAY_MS * attempt);
        }
      }
    }

    const errorMessage = (lastError as any)?.response?.data?.message || 'Erro ao verificar token';
    return {
      success: false,
      message: errorMessage
    };
  }

  /**
   * Valida JWT armazenado no localStorage
   */
  async validateStoredJWT(): Promise<boolean> {
    const storedAuth = this.getStoredAuth();
    if (!storedAuth) {
      return false;
    }

    // Verifica se o token está próximo do vencimento
    const now = new Date();
    const expiresAt = new Date(storedAuth.expiresAt);
    const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60);

    // Se expirou, remove do storage
    if (minutesUntilExpiry <= 0) {
      this.clearAuth();
      return false;
    }

    // Se está próximo do vencimento, tenta refresh (sem falhar se não conseguir)
    if (minutesUntilExpiry <= this.REFRESH_THRESHOLD_MINUTES) {
      try {
        const refreshed = await this.refreshJWT();
        return refreshed;
      } catch (error) {
        console.warn('Erro ao fazer refresh do JWT, mas token ainda é válido:', error);
        // Continua com o token atual mesmo se refresh falhar
        return true;
      }
    }

    // Token ainda é válido com base na expiração armazenada
    // Não tenta validar com backend pois pode ter problemas com tokens customizados
    return true;
  }

  /**
   * Limpa autenticação armazenada (cookie + localStorage)
   */
  clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.JWT_STORAGE_KEY);
      this.clearJWTCookie();
    }
    
    // Para o timer de auto-refresh
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  /**
   * Obtém dados de autenticação armazenados
   */
  getStoredAuth(): StoredAuth | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const stored = localStorage.getItem(this.JWT_STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        expiresAt: new Date(parsed.expiresAt)
      };
    } catch (error) {
      console.error('Erro ao recuperar auth do localStorage:', error);
      return null;
    }
  }

  /**
   * Obtém usuário autenticado
   */
  getAuthenticatedUser(): User | null {
    const storedAuth = this.getStoredAuth();
    return storedAuth?.user || null;
  }

  /**
   * Obtém JWT atual (verifica cookie primeiro, depois localStorage)
   */
  getCurrentJWT(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    // Tenta obter do cookie primeiro
    const cookies = document.cookie.split(';');
    const cookie = cookies.find(c => c.trim().startsWith(`${this.JWT_COOKIE_NAME}=`));
    
    if (cookie) {
      const jwt = cookie.split('=')[1].trim();
      if (jwt && this.isJWTValid(jwt)) {
        return jwt;
      }
    }

    // Fallback para localStorage
    const storedAuth = this.getStoredAuth();
    if (storedAuth?.jwt && this.isJWTValid(storedAuth.jwt)) {
      return storedAuth.jwt;
    }

    return null;
  }

  /**
   * Verifica se JWT é válido (não expirado)
   * Aceita tanto JWT quanto tokens Sanctum
   */
  private isJWTValid(jwt: string): boolean {
    if (!jwt || jwt.trim().length === 0) {
      return false;
    }
    
    try {
      // Tenta decodificar como JWT
      const payload = this.decodeJWTPayload(jwt);
      const expiresAt = new Date(payload.exp * 1000);
      return Date.now() < expiresAt.getTime();
    } catch {
      // Se não for JWT, assume token Sanctum e considera válido se não estiver vazio
      // Tokens Sanctum não têm expiração no próprio token, então assumimos que são válidos
      // A validação real será feita pelo backend quando o token for usado
      return jwt.trim().length > 0;
    }
  }

  /**
   * Verifica se está autenticado
   */
  isAuthenticated(): boolean {
    const storedAuth = this.getStoredAuth();
    if (!storedAuth) {
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(storedAuth.expiresAt);
    return now < expiresAt;
  }

  /**
   * Armazena JWT em cookie persistente e localStorage (backup)
   * Aceita tanto JWT quanto tokens Sanctum (plain text)
   */
  private async storeJWT(jwt: string, user: User): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Tenta decodificar como JWT, se falhar assume que é token Sanctum
      let expiresAt: Date;
      try {
        const payload = this.decodeJWTPayload(jwt);
        expiresAt = new Date(payload.exp * 1000);
      } catch {
        // Se não for JWT, assume token Sanctum e define expiração padrão (24 horas)
        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }

      const authData: StoredAuth = {
        jwt,
        user,
        expiresAt
      };

      // Armazena em localStorage como backup
      localStorage.setItem(this.JWT_STORAGE_KEY, JSON.stringify(authData));

      // Armazena em cookie persistente (30 dias)
      const cookieMaxAge = this.COOKIE_MAX_AGE_DAYS * 24 * 60 * 60; // dias em segundos
      const isProduction = process.env.NODE_ENV === 'production';
      
      document.cookie = `${this.JWT_COOKIE_NAME}=${jwt}; max-age=${cookieMaxAge}; path=/; ${isProduction ? 'secure;' : ''} samesite=strict`;

      // Agenda refresh automático
      this.startAutoRefresh();
    } catch (error) {
      console.error('Erro ao armazenar JWT:', error);
    }
  }

  /**
   * Remove JWT de cookies e localStorage
   */
  private clearJWTCookie(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Remove cookie
    document.cookie = `${this.JWT_COOKIE_NAME}=; max-age=0; path=/; samesite=strict`;
  }

  /**
   * Refresh do JWT (atualiza cookie e localStorage)
   */
  private async refreshJWT(): Promise<boolean> {
    try {
      const jwt = this.getCurrentJWT();
      if (!jwt) {
        return false;
      }

      const storedAuth = this.getStoredAuth();
      if (!storedAuth) {
        return false;
      }

      const response = await axios.post(`${this.API_BASE}/auth/whatsapp-magic/refresh`, {}, {
        headers: { Authorization: `Bearer ${jwt}` }
      });

      if (response.data.success && response.data.jwt) {
        await this.storeJWT(response.data.jwt, storedAuth.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao fazer refresh do JWT:', error);
      this.clearAuth();
      return false;
    }
  }

  /**
   * Inicia timer de auto-refresh
   */
  private startAutoRefresh(): void {
    // Para timer anterior se existir
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const storedAuth = this.getStoredAuth();
    if (!storedAuth) {
      return;
    }

    const now = new Date();
    const expiresAt = new Date(storedAuth.expiresAt);
    const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60);

    // Se já expirou, limpa auth
    if (minutesUntilExpiry <= 0) {
      this.clearAuth();
      return;
    }

    // Calcula quando fazer refresh (30 minutos antes do vencimento)
    const refreshInMinutes = Math.max(1, minutesUntilExpiry - this.REFRESH_THRESHOLD_MINUTES);
    const refreshInMs = refreshInMinutes * 60 * 1000;

    this.refreshTimer = setTimeout(async () => {
      const refreshed = await this.refreshJWT();
      if (!refreshed) {
        console.warn('Falha no auto-refresh do JWT');
      }
    }, refreshInMs);
  }

  /**
   * Decodifica payload do JWT
   */
  private decodeJWTPayload(jwt: string): JWTPayload {
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      throw new Error('JWT inválido');
    }

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  }

  /**
   * Delay para retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verifica se usuário existe pelo telefone
   */
  async checkUserExists(phone: string, tenantId: string): Promise<{
    success: boolean;
    exists: boolean;
    user?: User | null;
    message?: string;
  }> {
    try {
      const response = await axios.post(`${this.API_BASE}/auth/whatsapp-magic/check-user`, {
        phone,
        store_id: tenantId
      });

      if (response.data.success) {
        return {
          success: true,
          exists: response.data.exists,
          user: response.data.user || null
        };
      } else {
        return {
          success: false,
          exists: false,
          message: response.data.error || 'Erro ao verificar usuário'
        };
      }
    } catch (error: any) {
      console.error('Erro ao verificar usuário:', error);
      return {
        success: false,
        exists: false,
        message: error.response?.data?.error || 'Erro ao verificar usuário'
      };
    }
  }

  /**
   * Solicita código de autenticação de 6 dígitos via WhatsApp
   * @param phone Número de telefone
   * @param tenantId ID do tenant
   * @param customerName Nome opcional para novos usuários
   */
  async requestAuthenticationCode(
    phone: string, 
    tenantId: string, 
    customerName?: string
  ): Promise<WhatsAppAuthResponse> {
    let lastError: Error | null = null;
    let lastErrorMessage = 'Erro ao solicitar código';

    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const payload: { phone: string; store_id: string; name?: string } = {
          phone,
          store_id: tenantId
        };
        
        if (customerName) {
          payload.name = customerName;
        }

        const response = await axios.post(`${this.API_BASE}/auth/whatsapp-magic/request-code`, payload);

        if (response.data.success) {
          return {
            success: true,
            message: response.data.message,
            expiresAt: response.data.expires_at ? new Date(response.data.expires_at) : undefined
          };
        } else {
          return {
            success: false,
            message: response.data.error || response.data.message || 'Erro ao solicitar código'
          };
        }
      } catch (error: any) {
        lastError = error;

        // Extrai mensagem de erro do response ou usa mensagem genérica
        if (error.response?.data?.error) {
          lastErrorMessage = error.response.data.error;
        } else if (error.response?.status === 429) {
          lastErrorMessage = 'Muitas tentativas. Por favor, aguarde alguns minutos.';
        } else if (error.response?.status === 404) {
          lastErrorMessage = 'Loja não encontrada';
        } else if (error.response?.status === 500) {
          lastErrorMessage = 'Erro ao enviar mensagem via WhatsApp. Por favor, tente novamente.';
        } else if (error.message) {
          lastErrorMessage = error.message;
        }

        console.error(`Tentativa ${attempt} de solicitar código falhou:`, error);

        if (attempt < this.MAX_RETRY_ATTEMPTS) {
          await this.delay(this.RETRY_DELAY_MS * attempt);
        }
      }
    }

    // Retorna erro ao invés de lançar exceção para melhor tratamento
    return {
      success: false,
      message: lastErrorMessage || 'Falha ao solicitar código após múltiplas tentativas'
    };
  }

  /**
   * Valida código de 6 dígitos e retorna token de autenticação
   */
  async validateAuthenticationCode(
    phone: string,
    code: string,
    tenantId: string
  ): Promise<{
    success: boolean;
    token?: string;
    user?: User;
    message?: string;
    error?: string;
    locked?: boolean;
  }> {
    let lastError: Error | null = null;
    let lastErrorMessage = 'Erro ao validar código';

    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await axios.post(`${this.API_BASE}/auth/whatsapp-magic/validate-code`, {
          phone,
          code,
          store_id: tenantId
        });

        if (response.data.success) {
          // Armazena token e dados do usuário (cookie + localStorage)
          if (response.data.token && response.data.user) {
            await this.storeJWT(response.data.token, response.data.user);
          }

          return {
            success: true,
            token: response.data.token,
            user: response.data.user,
            message: response.data.message || 'Autenticação bem-sucedida'
          };
        } else {
          return {
            success: false,
            error: response.data.error || 'Código inválido',
            locked: response.data.locked || false,
            message: response.data.error || 'Código inválido ou expirado'
          };
        }
      } catch (error: any) {
        lastError = error;

        // Se retornou 400/422, não faz retry (validação falhou)
        if (error.response?.status === 400 || error.response?.status === 422) {
          const errorData = error.response?.data;
          return {
            success: false,
            error: errorData?.error || 'Validação falhou',
            locked: errorData?.locked || false,
            message: errorData?.error || 'Código inválido'
          };
        }

        // Extrai mensagem de erro para usar em fallback
        if (error.response?.data?.error) {
          lastErrorMessage = error.response.data.error;
        } else if (error.response?.status === 500) {
          lastErrorMessage = 'Erro ao validar. Por favor, tente novamente.';
        } else if (error.message) {
          lastErrorMessage = error.message;
        }

        console.error(`Tentativa ${attempt} de validar código falhou:`, error);

        if (attempt < this.MAX_RETRY_ATTEMPTS) {
          await this.delay(this.RETRY_DELAY_MS * attempt);
        }
      }
    }

    // Retorna erro ao invés de lançar exceção
    return {
      success: false,
      error: lastErrorMessage || 'Falha ao validar código após múltiplas tentativas',
      locked: false,
      message: lastErrorMessage || 'Falha ao validar código após múltiplas tentativas'
    };
  }
}

export const whatsappAuthService = new WhatsAppAuthService();