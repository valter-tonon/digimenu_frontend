'use client';

import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {mounted && <Toaster position="top-center" />}
      {children}
    </>
  );
} 