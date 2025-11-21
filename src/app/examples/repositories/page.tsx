'use client';

import { useEffect, useState } from 'react';
import { useContainer } from '@/infrastructure/di';
import { Table } from '@/domain/entities/Table';

export default function RepositoriesExample() {
  const container = useContainer();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Buscar dados usando os repositórios disponíveis
        const tablesData = await container.tableRepository.getTables();

        setTables(tablesData);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError('Ocorreu um erro ao buscar os dados. Verifique o console para mais detalhes.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [container]);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Carregando dados...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Erro</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Exemplo de Uso dos Repositórios</h1>

      <div className="border rounded-lg p-4 shadow">
        <h2 className="text-xl font-semibold mb-3">Mesas ({tables.length})</h2>
        <ul className="space-y-2">
          {tables.map(table => (
            <li key={table.uuid} className="border-b pb-2">
              <div className="font-medium">Mesa {table.identifier}</div>
              <div className="text-sm text-gray-600">
                Status: {
                  table.status === 1 ? 'Livre' :
                  table.status === 2 ? 'Ocupada' :
                  table.status === 3 ? 'Reservada' :
                  table.status === 4 ? 'Fechando Conta' : 'Desconhecido'
                }
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 