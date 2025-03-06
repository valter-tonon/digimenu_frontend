import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export class ApiClient {
  private api: AxiosInstance;
  private isServer: boolean;
  private baseURL: string;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor() {
    this.isServer = typeof window === 'undefined';
    this.baseURL = this.getBaseUrl();
    console.log('ApiClient - Inicializando com URL:', this.baseURL, this.isServer ? '(servidor)' : '(cliente)');
    
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true,
      timeout: 10000, // 10 segundos de timeout
    });

    if (!this.isServer) {
      this.setupInterceptors();
    }
  }

  private getBaseUrl(): string {
    // Tenta obter a URL da API de várias fontes
    let baseURL = process.env.NEXT_PUBLIC_API_URL;
    
    // Fallback para URL hardcoded se não encontrar nas variáveis de ambiente
    if (!baseURL) {
      console.warn('ApiClient - NEXT_PUBLIC_API_URL não encontrado, usando fallback');
      if (typeof window !== 'undefined' && window.location.hostname === 'digimenu3.netlify.app') {
        baseURL = 'https://digimenu.net.br/api/v1';
      } else {
        baseURL = 'http://localhost/api/v1';
      }
    }
    
    return baseURL;
  }

  private setupInterceptors(): void {
    // Interceptor para adicionar o token de autenticação (apenas no cliente)
    this.api.interceptors.request.use(
      (config) => {
        console.log('ApiClient - Fazendo requisição para:', config.url);
        
        // Só tenta acessar localStorage no cliente
        if (!this.isServer) {
          const token = localStorage.getItem('token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => {
        console.error('ApiClient - Erro na requisição:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor para tratar erros de resposta
    this.api.interceptors.response.use(
      (response) => {
        console.log('ApiClient - Resposta recebida:', response.status);
        // Resetar contador de tentativas em caso de sucesso
        this.retryCount = 0;
        return response;
      },
      async (error: AxiosError) => {
        console.error('ApiClient - Erro na resposta:', error.message);
        
        // Tentar novamente em caso de erro de rede ou timeout
        if (
          (error.code === 'ECONNABORTED' || !error.response) && 
          this.retryCount < this.maxRetries
        ) {
          this.retryCount++;
          console.log(`ApiClient - Tentando novamente (${this.retryCount}/${this.maxRetries})...`);
          
          // Esperar um tempo antes de tentar novamente (backoff exponencial)
          const delay = Math.pow(2, this.retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Tentar novamente com a mesma configuração
          return this.api.request(error.config as AxiosRequestConfig);
        }
        
        // Se chegou aqui, não conseguiu recuperar do erro
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      console.log(`ApiClient - GET ${url}`, config?.params);
      const response: AxiosResponse<T> = await this.api.get(url, config);
      return response.data;
    } catch (error: any) {
      console.error(`ApiClient - Erro GET ${url}:`, error.message);
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      console.log(`ApiClient - POST ${url}`);
      const response: AxiosResponse<T> = await this.api.post(url, data, config);
      return response.data;
    } catch (error: any) {
      console.error(`ApiClient - Erro POST ${url}:`, error.message);
      throw error;
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      console.log(`ApiClient - PUT ${url}`);
      const response: AxiosResponse<T> = await this.api.put(url, data, config);
      return response.data;
    } catch (error: any) {
      console.error(`ApiClient - Erro PUT ${url}:`, error.message);
      throw error;
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      console.log(`ApiClient - DELETE ${url}`);
      const response: AxiosResponse<T> = await this.api.delete(url, config);
      return response.data;
    } catch (error: any) {
      console.error(`ApiClient - Erro DELETE ${url}:`, error.message);
      throw error;
    }
  }
}

// Exportar uma instância única do cliente de API
export const apiClient = new ApiClient(); 