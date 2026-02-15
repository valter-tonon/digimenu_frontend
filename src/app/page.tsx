import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 flex flex-col items-center justify-center px-4">
      {/* Logo e nome */}
      <div className="flex flex-col items-center mb-8">
        <Image
          src="/logo-digimenu.svg"
          alt="DigiMenu"
          width={120}
          height={120}
          priority
        />
        <h1 className="mt-4 text-3xl font-bold text-gray-900 tracking-tight">
          Digi<span className="text-orange-500">Menu</span>
        </h1>
        <p className="mt-1 text-sm text-gray-400 font-medium">
          Sistema de Pedidos Digital
        </p>
      </div>

      {/* Card informativo */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg
            className="w-8 h-8 text-orange-500"
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

        <h2 className="text-xl font-semibold text-gray-800 mb-3">
          Nenhuma loja identificada
        </h2>

        <p className="text-gray-500 leading-relaxed mb-6">
          Para acessar o cardápio digital, utilize o link ou QR Code
          fornecido pelo estabelecimento. A URL deve conter a
          identificação da loja.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">
            Exemplo de URL válida
          </p>
          <p className="text-sm text-gray-600 font-mono">
            digimenu.net.br/<span className="text-orange-500 font-semibold">nome-da-loja</span>
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 text-left px-2">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">
              Escaneie o <span className="font-medium text-gray-700">QR Code</span> disponível no estabelecimento
            </p>
          </div>

          <div className="flex items-center gap-3 text-left px-2">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">
              Ou acesse o <span className="font-medium text-gray-700">link direto</span> enviado pela loja
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-10 text-center">
        <p className="text-xs text-gray-300">
          Powered by DigiMenu
        </p>
      </footer>
    </div>
  );
}
