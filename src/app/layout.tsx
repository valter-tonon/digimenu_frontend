import type { Metadata } from 'next';
import './globals.css';
import '../styles/z-index.css';
import { AuthProvider } from '@/hooks/use-auth';
import { Toaster } from 'react-hot-toast';
import { CookieConsentBanner } from '@/components/ui/CookieConsentBanner';

export const metadata: Metadata = {
  title: 'DigiMenu - Sistema de Pedidos',
  description: 'Sistema de pedidos para restaurantes e estabelecimentos',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning={true}>
        <AuthProvider>
          {children}
          <Toaster position="top-center" />
          <CookieConsentBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
