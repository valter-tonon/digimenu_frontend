import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export class ApiClient {
  private api: AxiosInstance;
  private isServer: boolean;

  constructor() {
    this.isServer = typeof window === 'undefined';
    const baseURL = process.env.NEXT_PUBLIC_API_URL;
    console.log('ApiClient - Inicializando com URL:', baseURL, this.isServer ? '(servidor)' : '(cliente)');
    
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true,
    });

    if (!this.isServer) {
      this.setupInterceptors();
    }
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
        return Promise.reject(error);
      }
    );

    // Interceptor para tratar erros de resposta
    this.api.interceptors.response.use(
      (response) => {
        console.log('ApiClient - Resposta recebida:', response.status);
        return response;
      },
      (error: AxiosError) => {
        console.error('ApiClient - Erro na requisição:', error.message, error.response?.status);
        
        if (error.response?.status === 401 && !this.isServer) {
          // Token expirado ou inválido (apenas no cliente)
          localStorage.removeItem('token');
          // Redirecionar para a página de login
          window.location.href = '/login';
        }
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