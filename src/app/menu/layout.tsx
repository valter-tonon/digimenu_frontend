'use client';

import { MenuProvider } from '@/infrastructure/context/MenuContext';

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {children}
    </div>
  );
} 