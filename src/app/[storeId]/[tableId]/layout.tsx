'use client';

import { MenuProvider } from '@/infrastructure/context/MenuContext';
import { useParams } from 'next/navigation';

export default function StoreTableLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const storeId = params.storeId as string;
  const tableId = params.tableId as string;

  return (
    <div className="min-h-screen bg-gray-50">
      <MenuProvider initialStoreSlug={storeId} initialTableId={tableId}>
        {children}
      </MenuProvider>
    </div>
  );
} 