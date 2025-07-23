'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { TestTube2, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [showTestOption, setShowTestOption] = useState(false);

  useEffect(() => {
    // Aguardar um pouco antes de mostrar a opção de teste
    const timer = setTimeout(() => {
      setShowTestOption(true);
    }, 2000);

    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecionando...</p>
        
        {showTestOption && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Desenvolvedor?
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Teste o novo sistema de rotas e persistência
            </p>
            <Link
              href="/test-flow"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <TestTube2 className="w-4 h-4 mr-2" />
              Ir para página de testes
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
