'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getMe, logout } from '@/services/api';

interface CustomerAddress {
  id: number;
  uuid: string;
  title: string;
  address: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  zipcode: string;
  is_default: boolean;
}

interface Customer {
  id: number;
  uuid: string;
  name: string;
  email: string;
  phone: string;
  mobile_phone: string;
  image: string | null;
  addresses?: CustomerAddress[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  customer: Customer | null;
  login: (token: string) => void;
  logoutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  token: null,
  customer: null,
  login: () => {},
  logoutUser: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se existe um token no armazenamento local
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        fetchCustomer(storedToken);
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchCustomer = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await getMe(token);
      setCustomer(response.data);
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      // Se ocorrer um erro (como token expirado), remover o token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (newToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', newToken);
    }
    setToken(newToken);
    fetchCustomer(newToken);
  };

  const logoutUser = async () => {
    setIsLoading(true);
    try {
      if (token) {
        await logout(token);
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      setToken(null);
      setCustomer(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        isLoading,
        token,
        customer,
        login,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 