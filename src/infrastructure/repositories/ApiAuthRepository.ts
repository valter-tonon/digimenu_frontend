import { AuthRepository } from '@/domain/repositories/AuthRepository';
import { apiClient } from '../api/apiClient';

export class ApiAuthRepository implements AuthRepository {
  async login(credentials: { email: string, password: string, device_name: string }): Promise<{ token: string }> {
    try {
      const response = await apiClient.post<{ token: string }>('/auth/login', credentials);
      
      // Armazenar o token no localStorage
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      
      return response;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  }

  async getMe(): Promise<any> {
    try {
      const response = await apiClient.get<any>('/auth/me');
      return response;
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post<void>('/auth/logout');
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, remover o token do localStorage
      localStorage.removeItem('token');
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
} 