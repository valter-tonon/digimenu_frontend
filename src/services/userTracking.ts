import { v4 as uuidv4 } from 'uuid';

export interface UserTrackingService {
  trackUser(): string; // Retorna ID do usuário
  identifyUser(userId: string): void;
  trackSource(source: string): void;
  optOut(): void;
  isOptedOut(): boolean;
  getUserId(): string | null;
  getSource(): string | null;
  getFirstVisit(): Date | null;
  getLastVisit(): Date | null;
  updateLastVisit(): void;
}

export interface UserTrackingData {
  userId: string;
  source?: string;
  firstVisit: string;
  lastVisit: string;
  optOut: boolean;
}

const COOKIE_NAME = 'digimenu_user_tracking';
const COOKIE_EXPIRY_DAYS = 365; // 1 ano
const OPT_OUT_COOKIE = 'digimenu_opt_out';

export class CookieUserTrackingService implements UserTrackingService {
  private setCookie(name: string, value: string, days: number): void {
    if (typeof window === 'undefined') return;
    
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }

  private getCookie(name: string): string | null {
    if (typeof window === 'undefined') return null;
    
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    
    return null;
  }

  private deleteCookie(name: string): void {
    if (typeof window === 'undefined') return;
    
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  private getTrackingData(): UserTrackingData | null {
    if (this.isOptedOut()) return null;
    
    const cookieValue = this.getCookie(COOKIE_NAME);
    if (!cookieValue) return null;
    
    try {
      return JSON.parse(cookieValue);
    } catch (error) {
      console.error('Erro ao parsear dados de rastreamento:', error);
      return null;
    }
  }

  private saveTrackingData(data: UserTrackingData): void {
    if (this.isOptedOut()) return;
    
    try {
      const cookieValue = JSON.stringify(data);
      this.setCookie(COOKIE_NAME, cookieValue, COOKIE_EXPIRY_DAYS);
    } catch (error) {
      console.error('Erro ao salvar dados de rastreamento:', error);
    }
  }

  trackUser(): string {
    if (this.isOptedOut()) {
      // Retorna um ID temporário que não é persistido
      return `temp_${Date.now()}`;
    }
    
    let trackingData = this.getTrackingData();
    
    if (!trackingData) {
      // Primeiro acesso - criar novo usuário
      const userId = uuidv4();
      const now = new Date().toISOString();
      
      trackingData = {
        userId,
        firstVisit: now,
        lastVisit: now,
        optOut: false
      };
      
      this.saveTrackingData(trackingData);
      
      // Detectar fonte automaticamente
      this.detectAndTrackSource();
      
      return userId;
    } else {
      // Usuário existente - atualizar última visita
      trackingData.lastVisit = new Date().toISOString();
      this.saveTrackingData(trackingData);
      
      return trackingData.userId;
    }
  }

  identifyUser(userId: string): void {
    if (this.isOptedOut()) return;
    
    let trackingData = this.getTrackingData();
    
    if (trackingData) {
      trackingData.userId = userId;
      trackingData.lastVisit = new Date().toISOString();
      this.saveTrackingData(trackingData);
    } else {
      // Criar novo registro se não existir
      const now = new Date().toISOString();
      trackingData = {
        userId,
        firstVisit: now,
        lastVisit: now,
        optOut: false
      };
      this.saveTrackingData(trackingData);
    }
  }

  trackSource(source: string): void {
    if (this.isOptedOut()) return;
    
    const trackingData = this.getTrackingData();
    if (trackingData && !trackingData.source) {
      trackingData.source = source;
      trackingData.lastVisit = new Date().toISOString();
      this.saveTrackingData(trackingData);
    }
  }

  private detectAndTrackSource(): void {
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = document.referrer;
    
    // Detectar fonte do WhatsApp
    if (referrer.includes('whatsapp') || urlParams.get('utm_source') === 'whatsapp') {
      this.trackSource('whatsapp');
      return;
    }
    
    // Detectar outras fontes
    if (urlParams.get('utm_source')) {
      this.trackSource(urlParams.get('utm_source')!);
      return;
    }
    
    // Detectar por referrer
    if (referrer) {
      if (referrer.includes('facebook')) {
        this.trackSource('facebook');
      } else if (referrer.includes('instagram')) {
        this.trackSource('instagram');
      } else if (referrer.includes('google')) {
        this.trackSource('google');
      } else {
        this.trackSource('referrer');
      }
    } else {
      this.trackSource('direct');
    }
  }

  optOut(): void {
    // Marcar como opt-out
    this.setCookie(OPT_OUT_COOKIE, 'true', COOKIE_EXPIRY_DAYS);
    
    // Remover dados de rastreamento existentes
    this.deleteCookie(COOKIE_NAME);
  }

  isOptedOut(): boolean {
    return this.getCookie(OPT_OUT_COOKIE) === 'true';
  }

  getUserId(): string | null {
    const trackingData = this.getTrackingData();
    return trackingData?.userId || null;
  }

  getSource(): string | null {
    const trackingData = this.getTrackingData();
    return trackingData?.source || null;
  }

  getFirstVisit(): Date | null {
    const trackingData = this.getTrackingData();
    return trackingData?.firstVisit ? new Date(trackingData.firstVisit) : null;
  }

  getLastVisit(): Date | null {
    const trackingData = this.getTrackingData();
    return trackingData?.lastVisit ? new Date(trackingData.lastVisit) : null;
  }

  updateLastVisit(): void {
    if (this.isOptedOut()) return;
    
    const trackingData = this.getTrackingData();
    if (trackingData) {
      trackingData.lastVisit = new Date().toISOString();
      this.saveTrackingData(trackingData);
    }
  }

  // Método para obter estatísticas (útil para debug)
  getTrackingStats(): UserTrackingData | null {
    return this.getTrackingData();
  }
}

// Instância singleton do serviço
export const userTrackingService = new CookieUserTrackingService();

// Hook para usar o serviço de rastreamento
export function useUserTracking() {
  return {
    trackUser: () => userTrackingService.trackUser(),
    identifyUser: (userId: string) => userTrackingService.identifyUser(userId),
    trackSource: (source: string) => userTrackingService.trackSource(source),
    optOut: () => userTrackingService.optOut(),
    isOptedOut: () => userTrackingService.isOptedOut(),
    getUserId: () => userTrackingService.getUserId(),
    getSource: () => userTrackingService.getSource(),
    getFirstVisit: () => userTrackingService.getFirstVisit(),
    getLastVisit: () => userTrackingService.getLastVisit(),
    updateLastVisit: () => userTrackingService.updateLastVisit(),
    getStats: () => userTrackingService.getTrackingStats()
  };
}