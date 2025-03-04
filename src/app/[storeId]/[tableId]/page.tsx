import { redirect } from 'next/navigation';

interface PageProps {
  params: {
    storeId: string;
    tableId: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function StoreTablePage({ params }: PageProps) {
  const { storeId, tableId } = params;
  
  if (!storeId || !tableId) {
    redirect('/404');
  }
  
  // Construir a URL do menu com os parâmetros de consulta
  const menuUrl = `/menu?store=${encodeURIComponent(storeId)}&table=${encodeURIComponent(tableId)}`;
  
  // Redirecionar para a página do menu
  redirect(menuUrl);
} 