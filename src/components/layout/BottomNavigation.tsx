import { useRouter } from 'next/router';
import { Home, ShoppingBag, Tag, ShoppingCart, Menu, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BottomNavigationProps {
  storeId: string;
  tableId?: string;
}

export function BottomNavigation({ storeId, tableId }: BottomNavigationProps) {
  const router = useRouter();
  const { t } = useTranslation();
  
  const baseUrl = tableId 
    ? `/${storeId}/${tableId}` 
    : `/${storeId}`;

  const navigationItems = [
    {
      icon: <Home size={24} />,
      label: t('Início'),
      href: baseUrl,
    },
    {
      icon: <ShoppingBag size={24} />,
      label: t('Pedidos'),
      href: `${baseUrl}/orders`,
    },
    {
      icon: <Tag size={24} />,
      label: t('Promoções'),
      href: `${baseUrl}/promotions`,
    },
    {
      icon: <ShoppingCart size={24} />,
      label: t('Carrinho'),
      href: `${baseUrl}/cart`,
    },
    {
      icon: <User size={24} />,
      label: t('Perfil'),
      href: `${baseUrl}/profile`,
    },
  ];

  const isActive = (path: string) => {
    return router.asPath === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-around bg-white border-t border-gray-200 h-16 z-10">
      {navigationItems.map((item, index) => (
        <button
          key={index}
          className={`flex flex-col items-center justify-center w-full h-full ${
            isActive(item.href) ? 'text-primary' : 'text-gray-500'
          }`}
          onClick={() => router.push(item.href)}
        >
          <div className="flex items-center justify-center">
            {item.icon}
          </div>
          <span className="text-xs mt-1">{item.label}</span>
        </button>
      ))}
    </nav>
  );
} 