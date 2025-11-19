'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMenuAuth } from '@/infrastructure/hooks/useMenuAuth';

interface MenuAuthProtectedRouteProps {
  children: ReactNode;
  fallbackUrl?: string;
}

export function MenuAuthProtectedRoute({
  children,
  fallbackUrl = '/auth/menu-link',
}: MenuAuthProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, loading } = useMenuAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated && isClient) {
      // Redirect to auth page if not authenticated
      router.push(fallbackUrl);
    }
  }, [isAuthenticated, loading, router, fallbackUrl, isClient]);

  if (!isClient || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="w-full h-full border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

/**
 * HOC to wrap pages/components that require menu link authentication
 *
 * Usage:
 * export default withMenuAuthProtection(MenuPage);
 */
export function withMenuAuthProtection<P extends object>(
  Component: React.ComponentType<P>,
  fallbackUrl?: string
) {
  return function ProtectedComponent(props: P) {
    return (
      <MenuAuthProtectedRoute fallbackUrl={fallbackUrl}>
        <Component {...props} />
      </MenuAuthProtectedRoute>
    );
  };
}
