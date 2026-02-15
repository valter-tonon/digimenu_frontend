'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAppContext } from '@/hooks/useAppContext';
import { MenuProvider, useMenu } from '@/infrastructure/context/MenuContext';
import { LayoutProvider } from '@/infrastructure/context/LayoutContext';
import { MenuHeader } from '@/components/menu';
import { UserProfile } from '@/components/profile/UserProfile';
import { AddressManager } from '@/components/profile/AddressManager';
import { PreferencesSettings } from '@/components/profile/PreferencesSettings';
import { NotificationSettings } from '@/components/profile/NotificationSettings';
import { StoreHeader } from '@/components/menu/StoreHeader';
import { useContainer } from '@/infrastructure/di';
import { StoreStatusProvider } from '@/infrastructure/context/StoreStatusContext';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useNavigation } from '@/hooks/useNavigation';

// Componente de carregamento para o Suspense
function ProfileLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando perfil...</p>
      </div>
    </div>
  );
}

// Componente principal envolvido em Suspense
export default function ProfilePageWrapper() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfilePage />
    </Suspense>
  );
}

function ProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const storeId = (params?.storeId as string) || '';

  // Ler aba inicial da URL (?tab=addresses, ?tab=preferences, etc.)
  const tabFromUrl = searchParams.get('tab') as 'profile' | 'addresses' | 'preferences' | 'notifications' | null;
  const validTabs = ['profile', 'addresses', 'preferences', 'notifications'] as const;
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'profile';

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'preferences' | 'notifications'>(initialTab);

  // Usar o mesmo contexto do menu
  const { data, isLoading: contextLoading, error: contextError, isValid } = useAppContext();
  const { menuRepository } = useContainer();
  const [tenantData, setTenantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Extrair dados do contexto para manter o contexto da mesa
  const { storeId: contextStoreId, tableId, isDelivery, storeName } = data;

  // Hook de navegação
  const { navigateToMenu, getBreadcrumbItems, getCurrentContext } = useNavigation();

  // Carregar dados do tenant usando o mesmo método do menu
  useEffect(() => {
    // Se ainda estamos carregando o contexto, aguardar
    if (contextLoading) {
      return;
    }

    // Se não temos storeId, não tem o que carregar
    if (!storeId) {
      setLoading(false);
      return;
    }

    const loadTenantData = async () => {
      try {
        setLoading(true);
        // Usar o mesmo repositório do menu para carregar dados do tenant
        const menuParams = {
          store: storeId,
          table: undefined,
          isDelivery: false
        };
        const menuData = await menuRepository.getMenu(menuParams);

        // Extrair dados do tenant do menu
        if (menuData.tenant) {
          setTenantData(menuData.tenant);
        } else {
          // Fallback para dados básicos
          setTenantData({
            name: storeName || storeId,
            logo: null
          });
        }
      } catch (error) {
        console.error('Erro ao carregar dados do tenant:', error);
        // Fallback para dados básicos
        setTenantData({
          name: storeName || storeId,
          logo: null
        });
      } finally {
        setLoading(false);
      }
    };

    loadTenantData();
  }, [contextLoading, storeId, storeName, menuRepository]);

  if (loading || contextLoading) {
    return <ProfileLoading />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="relative">
        <MenuHeader
          cartItemsCount={0}
          onCartClick={() => { }}
          storeName={tenantData?.name || storeName || storeId}
          storeLogo={tenantData?.logo}
          openingHours={tenantData?.opening_hours}
          minOrderValue={tenantData?.min_order_value || undefined}
          tableId={tableId}
          storeId={storeId}
        />
      </div>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-4">
            <Breadcrumb
              items={getBreadcrumbItems('Meu Perfil')}
            />
          </div>

          {/* Título da página com botão voltar */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={navigateToMenu}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar ao Cardápio</span>
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Meu Perfil</h1>
            <p className="text-gray-600">Gerencie suas informações pessoais e preferências</p>
            {tableId && (
              <p className="text-sm text-gray-500 mt-2">
                Contexto: {getCurrentContext()} • {isDelivery ? 'Delivery' : 'Presencial'}
              </p>
            )}
          </div>

          {/* Navegação por abas */}
          <div className="mb-8">
            <nav className="flex space-x-8 border-b border-gray-200">
              {[
                { id: 'profile', label: 'Perfil', icon: '👤' },
                { id: 'addresses', label: 'Endereços', icon: '📍' },
                { id: 'preferences', label: 'Preferências', icon: '⚙️' },
                { id: 'notifications', label: 'Notificações', icon: '🔔' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Conteúdo das abas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {activeTab === 'profile' && (
              <UserProfile />
            )}
            {activeTab === 'addresses' && (
              <AddressManager />
            )}
            {activeTab === 'preferences' && (
              <PreferencesSettings />
            )}
            {activeTab === 'notifications' && (
              <NotificationSettings />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <StoreHeader
                storeName={tenantData?.name || storeName || storeId}
                storeLogo={tenantData?.logo}
                className="text-white"
              />
            </div>

            <div className="flex flex-col items-center md:items-end">
              <div className="flex flex-col items-center">
                <div className="flex items-center mb-2">
                  <img
                    src="/logo-digimenu.svg"
                    alt="DigiMenu"
                    className="h-8 w-auto"
                  />
                </div>
                <p className="text-sm text-gray-400">© {new Date().getFullYear()} Todos os direitos reservados</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 