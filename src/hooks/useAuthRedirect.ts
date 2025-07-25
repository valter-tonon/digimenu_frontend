/**
 * Hook para redirecionamento automático baseado em estado de autenticação
 * 
 * Gerencia redirecionamentos automáticos baseados no estado de autenticação,
 * sessão contextual e permissões do usuário.
 */

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

export interface RedirectConfig {
  requireAuth?: boolean;
  allowGuest?: boolean;
  requireSession?: boolean;
  redirectTo?: string;
  onRedirect?: (reason: string) => void;
}

export const useAuthRedirect = (config: RedirectConfig = {}) => {
  const {
    requireAuth = false,
    allowGuest = true,
    requireSession = false,
    redirectTo = '/',
    onRedirect
  } = config;

  const router = useRouter();
  const auth = useAuth();

  /**
   * Verifica se deve redirecionar baseado nas condições
   */
  const checkRedirect = useCallback(() => {
    // Aguarda carregamento inicial
    if (auth.isLoading) return;

    // Se requer autenticação e não está autenticado
    if (requireAuth && !auth.isAuthenticated) {
      // Se permite visitante e há sessão, não redireciona
      if (allowGuest && auth.session) {
        return;
      }
      
      onRedirect?.('Autenticação necessária');
      router.push(redirectTo);
      return;
    }

    // Se requer sessão contextual e não há sessão
    if (requireSession && !auth.session) {
      onRedirect?.('Sessão contextual necessária');
      router.push('/');
      return;
    }

    // Se há erro crítico, redireciona
    if (auth.error && auth.error.includes('bloqueado')) {
      onRedirect?.('Acesso bloqueado');
      router.push('/blocked');
      return;
    }

  }, [
    auth.isLoading,
    auth.isAuthenticated,
    auth.session,
    auth.error,
    requireAuth,
    allowGuest,
    requireSession,
    redirectTo,
    onRedirect,
    router
  ]);

  useEffect(() => {
    checkRedirect();
  }, [checkRedirect]);

  return {
    shouldRedirect: () => {
      if (auth.isLoading) return false;
      
      if (requireAuth && !auth.isAuthenticated && !(allowGuest && auth.session)) {
        return true;
      }
      
      if (requireSession && !auth.session) {
        return true;
      }
      
      return false;
    },
    canAccess: () => {
      if (auth.isLoading) return false;
      
      if (requireAuth && !auth.isAuthenticated && !(allowGuest && auth.session)) {
        return false;
      }
      
      if (requireSession && !auth.session) {
        return false;
      }
      
      return true;
    }
  };
};

/**
 * Hook específico para páginas de checkout
 */
export const useCheckoutRedirect = () => {
  return useAuthRedirect({
    requireAuth: false,
    allowGuest: true,
    requireSession: true,
    redirectTo: '/',
    onRedirect: (reason) => {
      console.log('Redirecionamento do checkout:', reason);
    }
  });
};

/**
 * Hook específico para páginas administrativas
 */
export const useAdminRedirect = () => {
  return useAuthRedirect({
    requireAuth: true,
    allowGuest: false,
    requireSession: false,
    redirectTo: '/admin/login',
    onRedirect: (reason) => {
      console.log('Redirecionamento administrativo:', reason);
    }
  });
};

/**
 * Hook específico para páginas de pedidos
 */
export const useOrderRedirect = () => {
  return useAuthRedirect({
    requireAuth: false,
    allowGuest: true,
    requireSession: true,
    redirectTo: '/',
    onRedirect: (reason) => {
      console.log('Redirecionamento de pedidos:', reason);
    }
  });
};

/**
 * Hook para redirecionamento condicional baseado em permissões
 */
export const useConditionalRedirect = () => {
  const auth = useAuth();
  const router = useRouter();

  const redirectIfNotAllowed = useCallback(async (action: 'order' | 'checkout' | 'admin') => {
    if (auth.isLoading) return false;

    switch (action) {
      case 'order':
        if (!auth.session) {
          router.push('/');
          return true;
        }
        break;

      case 'checkout':
        if (!auth.session) {
          router.push('/');
          return true;
        }
        
        // Verifica se pode fazer pedidos como visitante
        if (!auth.isAuthenticated && !auth.canOrderAsGuest) {
          router.push('/login');
          return true;
        }
        break;

      case 'admin':
        if (!auth.isAuthenticated || !auth.customer) {
          router.push('/admin/login');
          return true;
        }
        break;
    }

    return false;
  }, [auth, router]);

  return { redirectIfNotAllowed };
};