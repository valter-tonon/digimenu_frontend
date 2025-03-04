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
  },
  // Configuração para lidar com erros de CORS
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 