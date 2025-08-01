/**
 * API Error Handler Service
 * Handles API errors with user-friendly messages, network error detection,
 * offline handling, toast notifications, and retry logic
 */

import { errorReportingService } from './errorReporting';

export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: any;
  timestamp: number;
  retryable: boolean;
  userMessage: string;
  originalError?: Error;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatuses: number[];
  retryableErrors: string[];
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary';
  }>;
}

export interface NetworkStatus {
  isOnline: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export class ApiErrorHandler {
  private static instance: ApiErrorHandler;
  private retryConfig: RetryConfig;
  private networkStatus: NetworkStatus;
  private toastQueue: ToastNotification[] = [];
  private activeRequests: Map<string, AbortController> = new Map();
  private offlineQueue: Array<{
    request: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timestamp: number;
  }> = [];

  private readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableStatuses: [408, 429, 500, 502, 503, 504],
    retryableErrors: ['NetworkError', 'TimeoutError', 'AbortError']
  };

  private readonly ERROR_MESSAGES: Record<string, string> = {
    // Network errors
    'NETWORK_ERROR': 'Problema de conexão. Verifique sua internet.',
    'TIMEOUT_ERROR': 'Tempo limite excedido. Tente novamente.',
    'OFFLINE_ERROR': 'Você está offline. Conecte-se à internet.',
    'CORS_ERROR': 'Erro de segurança. Contate o suporte.',
    
    // HTTP status errors
    'BAD_REQUEST': 'Dados inválidos. Verifique as informações.',
    'UNAUTHORIZED': 'Acesso negado. Faça login novamente.',
    'FORBIDDEN': 'Você não tem permissão para esta ação.',
    'NOT_FOUND': 'Recurso não encontrado.',
    'METHOD_NOT_ALLOWED': 'Operação não permitida.',
    'CONFLICT': 'Conflito de dados. Atualize e tente novamente.',
    'VALIDATION_ERROR': 'Dados inválidos. Verifique os campos.',
    'RATE_LIMITED': 'Muitas tentativas. Aguarde um momento.',
    'SERVER_ERROR': 'Erro interno do servidor. Tente novamente.',
    'SERVICE_UNAVAILABLE': 'Serviço temporariamente indisponível.',
    'GATEWAY_TIMEOUT': 'Servidor demorou para responder.',
    
    // Business logic errors
    'PAYMENT_ERROR': 'Erro no pagamento. Tente outro método.',
    'STOCK_ERROR': 'Produto indisponível no momento.',
    'ADDRESS_ERROR': 'Endereço inválido. Verifique os dados.',
    'ORDER_ERROR': 'Erro ao processar pedido. Tente novamente.',
    'CART_ERROR': 'Erro no carrinho. Atualize a página.',
    'USER_ERROR': 'Erro nos dados do usuário.',
    
    // Generic fallback
    'UNKNOWN_ERROR': 'Erro inesperado. Tente novamente.'
  };

  constructor(retryConfig?: Partial<RetryConfig>) {
    this.retryConfig = { ...this.DEFAULT_RETRY_CONFIG, ...retryConfig };
    this.networkStatus = this.getNetworkStatus();
    this.setupNetworkListeners();
    this.setupOfflineQueueProcessor();
  }

  public static getInstance(retryConfig?: Partial<RetryConfig>): ApiErrorHandler {
    if (!ApiErrorHandler.instance) {
      ApiErrorHandler.instance = new ApiErrorHandler(retryConfig);
    }
    return ApiErrorHandler.instance;
  }

  /**
   * Handle API errors and convert them to user-friendly format
   */
  public handleError(error: any, context?: string): ApiError {
    const apiError = this.parseError(error, context);
    
    // Report error for monitoring
    this.reportError(apiError, context);
    
    // Show toast notification
    this.showErrorToast(apiError);
    
    // Track analytics
    this.trackErrorAnalytics(apiError, context);
    
    return apiError;
  }

  /**
   * Execute API request with retry logic and error handling
   */
  public async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    options?: {
      context?: string;
      maxRetries?: number;
      showToast?: boolean;
      abortSignal?: AbortSignal;
    }
  ): Promise<T> {
    const { context, maxRetries = this.retryConfig.maxRetries, showToast = true, abortSignal } = options || {};
    const requestId = this.generateRequestId();
    
    // Handle offline scenario
    if (!this.networkStatus.isOnline) {
      return this.handleOfflineRequest(requestFn, { context, showToast });
    }

    let lastError: any;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        // Check if request was aborted
        if (abortSignal?.aborted) {
          throw new Error('Request aborted');
        }

        const result = await requestFn();
        
        // Remove from active requests on success
        this.activeRequests.delete(requestId);
        
        // Show success toast if this was a retry
        if (attempt > 0 && showToast) {
          this.showSuccessToast('Operação realizada com sucesso!');
        }
        
        return result;
      } catch (error) {
        lastError = error;
        const apiError = this.parseError(error, context);
        
        // Don't retry if not retryable or max retries reached
        if (!apiError.retryable || attempt >= maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = this.calculateRetryDelay(attempt);
        
        // Show retry toast
        if (showToast && attempt < maxRetries) {
          this.showRetryToast(attempt + 1, maxRetries, delay);
        }
        
        // Wait before retry
        await this.delay(delay);
        attempt++;
      }
    }

    // All retries failed, handle the final error
    const finalError = this.handleError(lastError, context);
    throw finalError;
  }

  /**
   * Cancel active request
   */
  public cancelRequest(requestId: string): void {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * Cancel all active requests
   */
  public cancelAllRequests(): void {
    this.activeRequests.forEach((controller) => {
      controller.abort();
    });
    this.activeRequests.clear();
  }

  /**
   * Get current network status
   */
  public getNetworkStatus(): NetworkStatus {
    if (typeof navigator === 'undefined') {
      return { isOnline: true };
    }

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      isOnline: navigator.onLine,
      connectionType: connection?.type,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData
    };
  }

  /**
   * Show success toast notification
   */
  public showSuccessToast(message: string, title = 'Sucesso'): void {
    this.showToast({
      type: 'success',
      title,
      message,
      duration: 3000
    });
  }

  /**
   * Show error toast notification
   */
  public showErrorToast(error: ApiError): void {
    this.showToast({
      type: 'error',
      title: 'Erro',
      message: error.userMessage,
      duration: 5000,
      actions: error.retryable ? [{
        label: 'Tentar Novamente',
        action: () => {
          // This would trigger a retry of the last failed request
          console.log('Retry requested for error:', error.code);
        },
        style: 'primary' as const
      }] : undefined
    });
  }

  /**
   * Show warning toast notification
   */
  public showWarningToast(message: string, title = 'Atenção'): void {
    this.showToast({
      type: 'warning',
      title,
      message,
      duration: 4000
    });
  }

  /**
   * Show info toast notification
   */
  public showInfoToast(message: string, title = 'Informação'): void {
    this.showToast({
      type: 'info',
      title,
      message,
      duration: 3000
    });
  }

  /**
   * Parse error and convert to ApiError format
   */
  private parseError(error: any, context?: string): ApiError {
    const timestamp = Date.now();
    let apiError: ApiError;

    // Handle null/undefined errors
    if (!error) {
      return {
        message: 'Unknown Error',
        code: 'UNKNOWN_ERROR',
        status: 0,
        details: {},
        timestamp,
        retryable: false,
        userMessage: this.getUserMessage('UNKNOWN_ERROR'),
        originalError: error
      };
    }

    if (error.response) {
      // HTTP error response
      const status = error.response.status;
      const data = error.response.data || {};
      
      apiError = {
        message: data.message || error.message || 'HTTP Error',
        code: this.getErrorCodeFromStatus(status),
        status,
        details: data.details || data,
        timestamp,
        retryable: this.isRetryableStatus(status),
        userMessage: this.getUserMessage(this.getErrorCodeFromStatus(status), data.message),
        originalError: error
      };
    } else if (error.request) {
      // Network error
      const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
      const isOffline = !navigator.onLine;
      
      apiError = {
        message: error.message || 'Network Error',
        code: isOffline ? 'OFFLINE_ERROR' : isTimeout ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR',
        status: 0,
        details: { request: error.request },
        timestamp,
        retryable: true,
        userMessage: this.getUserMessage(isOffline ? 'OFFLINE_ERROR' : isTimeout ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR'),
        originalError: error
      };
    } else {
      // JavaScript error or other
      const code = this.getErrorCodeFromMessage(error.message || '');
      
      apiError = {
        message: error.message || 'Unknown Error',
        code,
        status: 0,
        details: { stack: error.stack },
        timestamp,
        retryable: this.isRetryableError(error.name || ''),
        userMessage: this.getUserMessage(code),
        originalError: error
      };
    }

    // Add context information
    if (context) {
      apiError.details = { ...apiError.details, context };
    }

    return apiError;
  }

  /**
   * Get error code from HTTP status
   */
  private getErrorCodeFromStatus(status: number): string {
    const statusMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      405: 'METHOD_NOT_ALLOWED',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMITED',
      500: 'SERVER_ERROR',
      502: 'SERVER_ERROR',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT'
    };

    return statusMap[status] || 'UNKNOWN_ERROR';
  }

  /**
   * Get error code from error message
   */
  private getErrorCodeFromMessage(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('network')) return 'NETWORK_ERROR';
    if (lowerMessage.includes('timeout')) return 'TIMEOUT_ERROR';
    if (lowerMessage.includes('cors')) return 'CORS_ERROR';
    if (lowerMessage.includes('payment')) return 'PAYMENT_ERROR';
    if (lowerMessage.includes('stock')) return 'STOCK_ERROR';
    if (lowerMessage.includes('address')) return 'ADDRESS_ERROR';
    if (lowerMessage.includes('order')) return 'ORDER_ERROR';
    if (lowerMessage.includes('cart')) return 'CART_ERROR';
    if (lowerMessage.includes('user')) return 'USER_ERROR';
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * Get user-friendly message for error code
   */
  private getUserMessage(code: string, originalMessage?: string): string {
    // Always use our predefined user-friendly messages for consistency
    return this.ERROR_MESSAGES[code] || this.ERROR_MESSAGES['UNKNOWN_ERROR'];
  }

  /**
   * Check if message is already user-friendly
   */
  private isUserFriendlyMessage(message: string): boolean {
    // Simple heuristic: if message doesn't contain technical terms, it's probably user-friendly
    const technicalTerms = ['error', 'exception', 'null', 'undefined', 'stack', 'trace', 'http', 'api'];
    const lowerMessage = message.toLowerCase();
    
    return !technicalTerms.some(term => lowerMessage.includes(term));
  }

  /**
   * Check if HTTP status is retryable
   */
  private isRetryableStatus(status: number): boolean {
    return this.retryConfig.retryableStatuses.includes(status);
  }

  /**
   * Check if error type is retryable
   */
  private isRetryableError(errorName: string): boolean {
    return this.retryConfig.retryableErrors.includes(errorName);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Handle offline requests by queuing them
   */
  private async handleOfflineRequest<T>(
    requestFn: () => Promise<T>,
    options: { context?: string; showToast?: boolean }
  ): Promise<T> {
    const { context, showToast = true } = options;
    
    if (showToast) {
      this.showWarningToast('Você está offline. A operação será executada quando a conexão for restabelecida.');
    }

    return new Promise<T>((resolve, reject) => {
      this.offlineQueue.push({
        request: requestFn,
        resolve,
        reject,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Process offline queue when connection is restored
   */
  private async processOfflineQueue(): Promise<void> {
    if (!this.networkStatus.isOnline || this.offlineQueue.length === 0) {
      return;
    }

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    this.showInfoToast(`Processando ${queue.length} operação(ões) pendente(s)...`);

    for (const item of queue) {
      try {
        const result = await item.request();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }

    if (queue.length > 0) {
      this.showSuccessToast(`${queue.length} operação(ões) processada(s) com sucesso!`);
    }
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.networkStatus = this.getNetworkStatus();
      this.showSuccessToast('Conexão restabelecida!');
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.networkStatus = this.getNetworkStatus();
      this.showWarningToast('Você está offline. Algumas funcionalidades podem não funcionar.');
    });

    // Listen for connection changes
    if (typeof navigator !== 'undefined' && (navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', () => {
        this.networkStatus = this.getNetworkStatus();
      });
    }
  }

  /**
   * Setup offline queue processor
   */
  private setupOfflineQueueProcessor(): void {
    // Process queue every 30 seconds when online
    setInterval(() => {
      if (this.networkStatus.isOnline) {
        this.processOfflineQueue();
      }
    }, 30000);

    // Clean up old offline requests (older than 5 minutes)
    setInterval(() => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      this.offlineQueue = this.offlineQueue.filter(item => item.timestamp > fiveMinutesAgo);
    }, 60000);
  }

  /**
   * Show toast notification
   */
  private showToast(notification: Omit<ToastNotification, 'id'>): void {
    const toast: ToastNotification = {
      ...notification,
      id: this.generateRequestId()
    };

    this.toastQueue.push(toast);

    // Emit toast event for UI components to listen
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api-toast', { detail: toast }));
    }

    // Auto-remove toast after duration
    if (toast.duration) {
      setTimeout(() => {
        this.removeToast(toast.id);
      }, toast.duration);
    }
  }

  /**
   * Show retry toast notification
   */
  private showRetryToast(attempt: number, maxRetries: number, delay: number): void {
    this.showToast({
      type: 'info',
      title: 'Tentando novamente...',
      message: `Tentativa ${attempt} de ${maxRetries}. Aguardando ${Math.round(delay / 1000)}s...`,
      duration: delay
    });
  }

  /**
   * Remove toast notification
   */
  private removeToast(id: string): void {
    this.toastQueue = this.toastQueue.filter(toast => toast.id !== id);
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api-toast-remove', { detail: { id } }));
    }
  }

  /**
   * Report error to monitoring service
   */
  private reportError(error: ApiError, context?: string): void {
    try {
      errorReportingService.reportError(error.originalError || new Error(error.message), {
        providerName: 'ApiErrorHandler',
        timestamp: new Date(error.timestamp).toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
        retryCount: 0,
        errorBoundary: 'ApiErrorHandler',
        apiError: {
          code: error.code,
          status: error.status,
          userMessage: error.userMessage,
          retryable: error.retryable,
          context
        }
      });
    } catch (reportingError) {
      console.warn('Failed to report API error:', reportingError);
    }
  }

  /**
   * Track error analytics
   */
  private trackErrorAnalytics(error: ApiError, context?: string): void {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'api_error', {
        event_category: 'api',
        event_label: `${error.code}: ${context || 'unknown'}`,
        custom_map: {
          error_code: error.code,
          status_code: error.status,
          retryable: error.retryable,
          context: context || 'unknown'
        },
        value: 1
      });
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay utility function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current toast queue
   */
  public getToastQueue(): ToastNotification[] {
    return [...this.toastQueue];
  }

  /**
   * Clear all toasts
   */
  public clearAllToasts(): void {
    this.toastQueue = [];
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api-toast-clear'));
    }
  }

  /**
   * Update retry configuration
   */
  public updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Get current retry configuration
   */
  public getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }

  /**
   * Get offline queue status
   */
  public getOfflineQueueStatus(): {
    queueLength: number;
    oldestRequest: number | null;
  } {
    return {
      queueLength: this.offlineQueue.length,
      oldestRequest: this.offlineQueue.length > 0 
        ? Math.min(...this.offlineQueue.map(item => item.timestamp))
        : null
    };
  }
}

// Export singleton instance
export const apiErrorHandler = ApiErrorHandler.getInstance();

// Export utility functions
export const handleApiError = (error: any, context?: string) => apiErrorHandler.handleError(error, context);
export const executeWithRetry = <T>(requestFn: () => Promise<T>, options?: Parameters<typeof apiErrorHandler.executeWithRetry>[1]) => 
  apiErrorHandler.executeWithRetry(requestFn, options);
export const showSuccessToast = (message: string, title?: string) => apiErrorHandler.showSuccessToast(message, title);
export const showErrorToast = (error: ApiError) => apiErrorHandler.showErrorToast(error);
export const showWarningToast = (message: string, title?: string) => apiErrorHandler.showWarningToast(message, title);
export const showInfoToast = (message: string, title?: string) => apiErrorHandler.showInfoToast(message, title);