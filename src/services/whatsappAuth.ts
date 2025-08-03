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
            // Armazena JWT no localStorage
            await this.storeJWT(jwt, user);
            
            // Inicia auto-refresh
            this.startAutoRefresh();

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
    try {
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

      // Se está próximo do vencimento, tenta refresh
      if (minutesUntilExpiry <= this.REFRESH_THRESHOLD_MINUTES) {
        const refreshed = await this.refreshJWT();
        return refreshed;
      }

      // Valida com o backend
      const response = await axios.post(`${this.API_BASE}/auth/token/validate`, {}, {
        headers: { Authorization: `Bearer ${storedAuth.jwt}` }
      });

      return response.data.valid === true;
    } catch (error) {
      console.error('Erro ao validar JWT armazenado:', error);
      this.clearAuth();
      return false;
    }
  }

  /**
   * Limpa autenticação armazenada
   */
  clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.JWT_STORAGE_KEY);
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
   * Obtém JWT atual
   */
  getCurrentJWT(): string | null {
    const storedAuth = this.getStoredAuth();
    return storedAuth?.jwt || null;
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
   * Armazena JWT no localStorage
   */
  private async storeJWT(jwt: string, user: User): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Decodifica JWT para obter expiração
      const payload = this.decodeJWTPayload(jwt);
      const expiresAt = new Date(payload.exp * 1000);

      const authData: StoredAuth = {
        jwt,
        user,
        expiresAt
      };

      localStorage.setItem(this.JWT_STORAGE_KEY, JSON.stringify(authData));
    } catch (error) {
      console.error('Erro ao armazenar JWT:', error);
    }
  }

  /**
   * Refresh do JWT
   */
  private async refreshJWT(): Promise<boolean> {
    try {
      const storedAuth = this.getStoredAuth();
      if (!storedAuth) {
        return false;
      }

      const response = await axios.post(`${this.API_BASE}/auth/token/refresh`, {}, {
        headers: { Authorization: `Bearer ${storedAuth.jwt}` }
      });

      if (response.data.jwt) {
        await this.storeJWT(response.data.jwt, storedAuth.user);
        this.startAutoRefresh();
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


}

export const whatsappAuthService = new WhatsAppAuthService();