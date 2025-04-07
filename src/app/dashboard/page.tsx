'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/infrastructure/auth';
import { useContainer } from '@/infrastructure/di';
import { Table } from '@/domain/entities/Table';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const container = useContainer();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTables() {
      try {
        setLoading(true);
        const tablesData = await container.tableRepository.getTables();
        setTables(tablesData);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar mesas:', err);
        setError('Ocorreu um erro ao buscar as mesas. Verifique o console para mais detalhes.');
      } finally {
        setLoading(false);
      }
    }

    fetchTables();
  }, [container]);

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: // Livre
        return 'bg-green-100 text-green-800';
      case 2: // Ocupada
        return 'bg-red-100 text-red-800';
      case 3: // Reservada
        return 'bg-blue-100 text-blue-800';
      case 4: // Fechando Conta
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 1: return 'Livre';
      case 2: return 'Ocupada';
      case 3: return 'Reservada';
      case 4: return 'Fechando Conta';
      default: return 'Desconhecido';
    }
  };

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="text-sm">
          Bem-vindo, <span className="font-semibold">{user?.name || 'Usuário'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Total de Mesas</h2>
          <p className="text-3xl font-bold">{tables.length}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Mesas Livres</h2>
          <p className="text-3xl font-bold text-green-600">
            {tables.filter(table => table.status === 1).length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Mesas Ocupadas</h2>
          <p className="text-3xl font-bold text-red-600">
            {tables.filter(table => table.status === 2).length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Fechando Conta</h2>
          <p className="text-3xl font-bold text-yellow-600">
            {tables.filter(table => table.status === 4).length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Status das Mesas</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.map(table => (
              <Link 
                href={`/tables/${table.uuid}`} 
                key={table.uuid}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Mesa {table.identifier}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(table.status)}`}>
                    {getStatusText(table.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{table.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 