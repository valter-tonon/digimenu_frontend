import { useState, useCallback, useEffect } from 'react';

interface MenuAuthState {
  isAuthenticated: boolean;
  token: string | null;
  customerPhone: string | null;
  customerName: string | null;
  loading: boolean;
  error: string | null;
}

interface VerifyTokenRequest {
  token: string;
  phone: string;
}

interface VerifyTokenResponse {
  success: boolean;
  data?: {
    token: string;
    customer_name: string;
    customer_id: string;
    restaurant_name: string;
    within_24h_window: boolean;
  };
  message?: string;
}

export function useMenuAuth() {
  const [state, setState] = useState<MenuAuthState>({
    isAuthenticated: false,
    token: null,
    customerPhone: null,
    customerName: null,
    loading: true,
    error: null,
  });

  // Check if already authenticated on mount
  useEffect(() => {
    const token = sessionStorage.getItem('menu_auth_token');
    const phone = localStorage.getItem('customer_phone');
    const name = localStorage.getItem('customer_name');

    if (token && phone) {
      setState((prev) => ({
        ...prev,
        isAuthenticated: true,
        token,
        customerPhone: phone,
        customerName: name,
        loading: false,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        loading: false,
      }));
    }
  }, []);

  const verifyToken = useCallback(async (request: VerifyTokenRequest) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/v1/menu-auth/verify-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data: VerifyTokenResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erro ao verificar token');
      }

      const { token, customer_name, customer_id, restaurant_name } = data.data!;

      // Store in session/local storage
      sessionStorage.setItem('menu_auth_token', token);
      localStorage.setItem('customer_phone', request.phone);
      localStorage.setItem('customer_name', customer_name);
      localStorage.setItem('customer_id', customer_id);
      localStorage.setItem('restaurant_name', restaurant_name);

      setState((prev) => ({
        ...prev,
        isAuthenticated: true,
        token,
        customerPhone: request.phone,
        customerName: customer_name,
        loading: false,
      }));

      return { success: true, data: data.data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao verificar token';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('menu_auth_token');
    localStorage.removeItem('customer_phone');
    localStorage.removeItem('customer_name');
    localStorage.removeItem('customer_id');
    localStorage.removeItem('restaurant_name');

    setState({
      isAuthenticated: false,
      token: null,
      customerPhone: null,
      customerName: null,
      loading: false,
      error: null,
    });
  }, []);

  const getAuthToken = useCallback(() => {
    return sessionStorage.getItem('menu_auth_token');
  }, []);

  const isWithin24hWindow = useCallback(async (): Promise<boolean> => {
    try {
      const token = sessionStorage.getItem('menu_auth_token');
      if (!token) return false;

      const response = await fetch('/api/v1/menu-auth/verify-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.data?.within_24h_window ?? false;
    } catch {
      return false;
    }
  }, []);

  return {
    ...state,
    verifyToken,
    logout,
    getAuthToken,
    isWithin24hWindow,
  };
}
