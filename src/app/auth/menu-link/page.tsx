import { Suspense } from 'react';
import MenuLinkAuthContent from './content';

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-md mb-4">
            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verificando Acesso</h1>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 mb-6">
              <div className="w-full h-full border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MenuLinkAuthPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MenuLinkAuthContent />
    </Suspense>
  );
}
