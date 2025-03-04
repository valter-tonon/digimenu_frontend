import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/infrastructure/auth';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={inter.className} suppressHydrationWarning={true}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
