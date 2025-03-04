/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    // Removendo a opção inválida
  },
  eslint: {
    // Desabilitar ESLint durante o build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Desabilitar verificação de tipos durante o build
    ignoreBuildErrors: true,
  },
  // Configurações para permitir imagens de domínios externos
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'production',
  },
  // Configuração para lidar com erros de CORS
  rewrites: async () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const apiUrl = isProduction 
      ? process.env.NEXT_PUBLIC_API_URL || 'https://api.seudominio.com'
      : 'http://localhost';
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
  // Configuração para o Netlify
  output: 'standalone',
};

module.exports = nextConfig; 