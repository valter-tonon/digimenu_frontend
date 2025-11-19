'use client';

import { ReactNode } from 'react';
import { withMenuAuthProtection } from '@/components/auth/MenuAuthProtectedRoute';
import { useMenuAuth } from '@/infrastructure/hooks/useMenuAuth';
import CustomerGreeting from './CustomerGreeting';

interface PersonalizedMenuWrapperProps {
  children: ReactNode;
}

function PersonalizedMenuWrapperComponent({ children }: PersonalizedMenuWrapperProps) {
  const { customerName, customerPhone, isAuthenticated } = useMenuAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Personalized Header */}
      <CustomerGreeting
        customerName={customerName || 'Cliente'}
        customerPhone={customerPhone || ''}
      />

      {/* Main Content */}
      <div className="pt-4">
        {children}
      </div>
    </div>
  );
}

export default withMenuAuthProtection(PersonalizedMenuWrapperComponent);
