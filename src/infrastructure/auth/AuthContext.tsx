'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getContainer } from '@/infrastructure/di';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const container = getContainer();

  useEffect(() => {
    // Verificar se o usuário está autenticado ao carregar a página
    async function loadUserFromToken() {
      try {
        if (container.authRepository.isAuthenticated()) {
          const userData = await container.authRepository.getMe();
          setUser(userData);
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserFromToken();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await container.authRepository.login({
        email,
        password,
        device_name: 'web'
      });
      
      // Buscar dados do usuário após login bem-sucedido
      const userData = await container.authRepository.getMe();
      setUser(userData);
      
      // Redirecionar para a página inicial após login
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await container.authRepository.logout();
      setUser(null);
      
      // Redirecionar para a página de login após logout
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        login,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
} 