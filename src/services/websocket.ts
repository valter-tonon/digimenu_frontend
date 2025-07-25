export interface AppNotification {
  id: string;
  type: 'order_status' | 'stock_update' | 'promotion' | 'waiter_call' | 'general';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface WebSocketMessage {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: Record<string, unknown>) => void>> = new Map();
  private isConnecting = false;

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    // Verificar se estamos no browser antes de adicionar event listener
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  private handleVisibilityChange() {
    if (document.visibilityState === 'visible' && !this.ws?.readyState) {
      this.connect();
    }
  }

  connect(storeId?: string, tableId?: string) {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:6001';
      const url = new URL(wsUrl);
      
      if (storeId) {
        url.searchParams.append('store_id', storeId);
      }
      
      if (tableId) {
        url.searchParams.append('table_id', tableId);
      }

      this.ws = new WebSocket(url.toString());
      
      this.ws.onopen = () => {
        console.log('WebSocket conectado');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('connected', {});
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket desconectado:', event.code, event.reason);
        this.isConnecting = false;
        this.emit('disconnected', { code: event.code, reason: event.reason });
        
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        // Em desenvolvimento, ser mais silencioso sobre erros de conexão
        if (process.env.NODE_ENV === 'development') {
          console.warn('WebSocket não disponível em desenvolvimento');
        } else {
          console.error('Erro no WebSocket:', error);
        }
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
      this.isConnecting = false;
    }
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) {
        this.connect();
      }
    }, delay);
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'notification':
        this.emit('notification', message.data);
        break;
      case 'order_update':
        this.emit('order_update', message.data);
        break;
      case 'stock_update':
        this.emit('stock_update', message.data);
        break;
      case 'promotion':
        this.emit('promotion', message.data);
        break;
      case 'waiter_call_response':
        this.emit('waiter_call_response', message.data);
        break;
      default:
        this.emit(message.type, message.data);
    }
  }

  subscribe(event: string, callback: (data: Record<string, unknown>) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Retorna função para cancelar inscrição
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  private emit(event: string, data: Record<string, unknown>) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Erro no callback do evento:', event, error);
        }
      });
    }
  }

  send(type: string, data: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        type,
        data,
        timestamp: new Date().toISOString()
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket não está conectado');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Desconexão solicitada');
      this.ws = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Instância singleton
export const websocketService = new WebSocketService(); 