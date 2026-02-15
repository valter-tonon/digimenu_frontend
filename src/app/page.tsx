'use client';

import Image from 'next/image';

export default function HomePage() {
  return (
    <>
      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-2deg); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 0.1; }
          100% { transform: scale(1); opacity: 0.3; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 6s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 4s ease-in-out infinite; }
        .animate-gradient { animation: gradient-shift 12s ease infinite; background-size: 200% 200%; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
        .animate-fade-in-scale { animation: fade-in-scale 0.6s ease-out forwards; }
        .animate-pulse-ring { animation: pulse-ring 3s ease-in-out infinite; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-700 { animation-delay: 0.7s; }
        .fill-backwards { animation-fill-mode: backwards; }
      `}</style>

      <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-4">
        {/* Background animado com gradiente */}
        <div
          className="absolute inset-0 animate-gradient"
          style={{
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 25%, #FFF1E6 50%, #F9FAFB 75%, #FFEDD5 100%)',
          }}
        />

        {/* Noise/grain overlay sutil */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Elementos decorativos flutuantes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Circulo grande - top left */}
          <div
            className="absolute -top-20 -left-20 w-72 h-72 rounded-full animate-float-slow opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #F97316 0%, transparent 70%)' }}
          />

          {/* Circulo medio - top right */}
          <div
            className="absolute top-16 -right-10 w-48 h-48 rounded-full animate-float-medium opacity-[0.05]"
            style={{
              background: 'radial-gradient(circle, #FB923C 0%, transparent 70%)',
              animationDelay: '2s',
            }}
          />

          {/* Circulo pequeno - bottom left */}
          <div
            className="absolute bottom-32 left-10 w-32 h-32 rounded-full animate-float-fast opacity-[0.06]"
            style={{
              background: 'radial-gradient(circle, #FDBA74 0%, transparent 70%)',
              animationDelay: '1s',
            }}
          />

          {/* Circulo - bottom right */}
          <div
            className="absolute -bottom-10 right-20 w-56 h-56 rounded-full animate-float-slow opacity-[0.04]"
            style={{
              background: 'radial-gradient(circle, #EA580C 0%, transparent 70%)',
              animationDelay: '3s',
            }}
          />

          {/* Dots decorativos */}
          <div
            className="absolute top-[20%] left-[15%] w-2 h-2 rounded-full bg-orange-300 animate-float-fast opacity-30"
            style={{ animationDelay: '0.5s' }}
          />
          <div
            className="absolute top-[30%] right-[20%] w-1.5 h-1.5 rounded-full bg-orange-400 animate-float-medium opacity-20"
            style={{ animationDelay: '1.5s' }}
          />
          <div
            className="absolute bottom-[25%] left-[25%] w-2.5 h-2.5 rounded-full bg-amber-300 animate-float-slow opacity-25"
            style={{ animationDelay: '2.5s' }}
          />
          <div
            className="absolute top-[60%] right-[12%] w-1.5 h-1.5 rounded-full bg-orange-300 animate-float-fast opacity-20"
            style={{ animationDelay: '0.8s' }}
          />
        </div>

        {/* Conteudo */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Logo com anel pulsante */}
          <div className="relative mb-4 animate-fade-in-scale fill-backwards">
            <div className="absolute inset-0 -m-6 rounded-full bg-orange-200 animate-pulse-ring" />
            <Image
              src="/logo-digimenu.svg"
              alt="DigiMenu"
              width={220}
              height={220}
              priority
              className="relative drop-shadow-lg"
            />
          </div>

          {/* Card informativo */}
          <div className="mt-8 w-full max-w-md animate-fade-in-up fill-backwards delay-400">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-orange-900/5 border border-white/60 p-8 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                <svg
                  className="w-7 h-7 text-orange-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
                  />
                </svg>
              </div>

              <h2 className="text-xl font-bold text-gray-800 mb-3">
                Nenhuma loja identificada
              </h2>

              <p className="text-gray-500 leading-relaxed mb-7 text-[0.935rem]">
                Para acessar o cardápio digital, utilize o link ou QR Code
                fornecido pelo estabelecimento.
              </p>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3.5 text-left px-3 py-2.5 rounded-xl bg-gray-50/80 transition-colors hover:bg-orange-50/60">
                  <div className="flex-shrink-0 w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="w-[18px] h-[18px] text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">
                    Escaneie o <span className="font-semibold text-gray-800">QR Code</span> disponível no estabelecimento
                  </p>
                </div>

                <div className="flex items-center gap-3.5 text-left px-3 py-2.5 rounded-xl bg-gray-50/80 transition-colors hover:bg-orange-50/60">
                  <div className="flex-shrink-0 w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="w-[18px] h-[18px] text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">
                    Ou acesse o <span className="font-semibold text-gray-800">link direto</span> enviado pela loja
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-10 animate-fade-in-up fill-backwards delay-700">
            <p className="text-xs text-gray-300 tracking-wider">
              Powered by <span className="font-semibold text-gray-400">DigiMenu</span>
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
