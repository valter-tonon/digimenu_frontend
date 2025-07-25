/**
 * Dashboard de auditoria e monitoramento
 * 
 * Interface administrativa para visualizar logs de auditoria,
 * sessões ativas, atividades suspeitas e estatísticas do sistema.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auditLogger, AuditEvent, AuditStatistics, AuditQuery } from '@/services/auditLogger';
import { sessionService } from '@/services/sessionService';
import { rateLimitingService } from '@/services/rateLimiting';
import { suspiciousActivityDetectionService } from '@/services/suspiciousActivityDetection';
import { dataCleanupService } from '@/services/dataCleanup';

interface DashboardState {
  activeTab: 'overview' | 'sessions' | 'audit' | 'security' | 'cleanup';
  isLoading: boolean;
  error: string | null;
  statistics: AuditStatistics | null;
  activeSessions: any[];
  auditEvents: AuditEvent[];
  suspiciousActivities: any[];
  cleanupReport: any;
}

export const AuditDashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    activeTab: 'overview',
    isLoading: true,
    error: null,
    statistics: null,
    activeSessions: [],
    auditEvents: [],
    suspiciousActivities: [],
    cleanupReport: null
  });

  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  /**
   * Carrega dados do dashboard
   */
  const loadDashboardData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const [
        statistics,
        auditEvents,
        suspiciousActivities,
        cleanupReport
      ] = await Promise.all([
        auditLogger.getStatistics(7), // Últimos 7 dias
        auditLogger.queryEvents({ limit: 100 }),
        suspiciousActivityDetectionService.getSuspiciousActivities(50),
        dataCleanupService.getLastReport()
      ]);

      // Mock para sessões ativas (em produção, usar API real)
      const activeSessions = await getMockActiveSessions();

      setState(prev => ({
        ...prev,
        isLoading: false,
        statistics,
        auditEvents: auditEvents.events,
        suspiciousActivities,
        activeSessions,
        cleanupReport
      }));

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erro ao carregar dados do dashboard'
      }));
    }
  };

  /**
   * Inicia atualização automática
   */
  const startAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000); // 30 segundos

    setRefreshInterval(interval);
  };

  /**
   * Para atualização automática
   */
  const stopAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  };

  // Carrega dados iniciais
  useEffect(() => {
    loadDashboardData();
    startAutoRefresh();

    return () => stopAutoRefresh();
  }, []);

  /**
   * Força limpeza de dados
   */
  const forceCleanup = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const report = await dataCleanupService.forceCleanup();
      setState(prev => ({ ...prev, cleanupReport: report, isLoading: false }));
    } catch (error) {
      console.error('Erro ao executar limpeza:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  if (state.isLoading && !state.statistics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard de Auditoria
          </h1>
          <p className="text-gray-600">
            Monitoramento de segurança e atividades do sistema
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Visão Geral' },
              { id: 'sessions', label: 'Sessões Ativas' },
              { id: 'audit', label: 'Logs de Auditoria' },
              { id: 'security', label: 'Segurança' },
              { id: 'cleanup', label: 'Limpeza de Dados' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setState(prev => ({ ...prev, activeTab: tab.id as any }))}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  state.activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Error Message */}
        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{state.error}</p>
          </div>
        )}

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={state.activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {state.activeTab === 'overview' && (
              <OverviewTab 
                statistics={state.statistics}
                activeSessions={state.activeSessions}
                recentEvents={state.auditEvents.slice(0, 10)}
              />
            )}

            {state.activeTab === 'sessions' && (
              <SessionsTab 
                sessions={state.activeSessions}
                onRefresh={loadDashboardData}
              />
            )}

            {state.activeTab === 'audit' && (
              <AuditTab 
                events={state.auditEvents}
                onRefresh={loadDashboardData}
              />
            )}

            {state.activeTab === 'security' && (
              <SecurityTab 
                suspiciousActivities={state.suspiciousActivities}
                onRefresh={loadDashboardData}
              />
            )}

            {state.activeTab === 'cleanup' && (
              <CleanupTab 
                report={state.cleanupReport}
                onForceCleanup={forceCleanup}
                isLoading={state.isLoading}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

/**
 * Tab de visão geral
 */
const OverviewTab: React.FC<{
  statistics: AuditStatistics | null;
  activeSessions: any[];
  recentEvents: AuditEvent[];
}> = ({ statistics, activeSessions, recentEvents }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {/* Cards de estatísticas */}
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Total de Eventos
      </h3>
      <p className="text-3xl font-bold text-blue-600">
        {statistics?.totalEvents || 0}
      </p>
      <p className="text-sm text-gray-500 mt-1">
        Últimos 7 dias
      </p>
    </div>

    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Sessões Ativas
      </h3>
      <p className="text-3xl font-bold text-green-600">
        {activeSessions.length}
      </p>
      <p className="text-sm text-gray-500 mt-1">
        Agora
      </p>
    </div>

    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Taxa de Sucesso
      </h3>
      <p className="text-3xl font-bold text-green-600">
        {statistics?.successRate.toFixed(1) || 0}%
      </p>
      <p className="text-sm text-gray-500 mt-1">
        Últimos 7 dias
      </p>
    </div>

    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Erros Recentes
      </h3>
      <p className="text-3xl font-bold text-red-600">
        {statistics?.recentErrors.length || 0}
      </p>
      <p className="text-sm text-gray-500 mt-1">
        Últimas 24h
      </p>
    </div>

    {/* Eventos recentes */}
    <div className="md:col-span-2 lg:col-span-4 bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Eventos Recentes
      </h3>
      <div className="space-y-3">
        {recentEvents.map(event => (
          <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <p className="font-medium text-gray-900">{event.description}</p>
              <p className="text-sm text-gray-500">
                {event.timestamp.toLocaleString()} • {event.type}
              </p>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${
              event.severity === 'critical' ? 'bg-red-100 text-red-800' :
              event.severity === 'error' ? 'bg-orange-100 text-orange-800' :
              event.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {event.severity}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * Tab de sessões ativas
 */
const SessionsTab: React.FC<{
  sessions: any[];
  onRefresh: () => void;
}> = ({ sessions, onRefresh }) => (
  <div className="bg-white rounded-lg shadow">
    <div className="p-6 border-b border-gray-200">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Sessões Ativas ({sessions.length})
        </h3>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Atualizar
        </button>
      </div>
    </div>
    
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sessão
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Loja
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tipo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Última Atividade
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sessions.map(session => (
            <tr key={session.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {session.id.substring(0, 8)}...
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {session.storeId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {session.type === 'table' ? 'Mesa' : 'Delivery'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(session.lastActivity).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  session.isAuthenticated 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {session.isAuthenticated ? 'Autenticado' : 'Visitante'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/**
 * Tab de logs de auditoria
 */
const AuditTab: React.FC<{
  events: AuditEvent[];
  onRefresh: () => void;
}> = ({ events, onRefresh }) => (
  <div className="bg-white rounded-lg shadow">
    <div className="p-6 border-b border-gray-200">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Logs de Auditoria ({events.length})
        </h3>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Atualizar
        </button>
      </div>
    </div>
    
    <div className="divide-y divide-gray-200">
      {events.map(event => (
        <div key={event.id} className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  event.severity === 'critical' ? 'bg-red-100 text-red-800' :
                  event.severity === 'error' ? 'bg-orange-100 text-orange-800' :
                  event.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {event.severity}
                </span>
                <span className="text-sm text-gray-500">{event.type}</span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-500">
                  {event.timestamp.toLocaleString()}
                </span>
              </div>
              <p className="text-gray-900 font-medium mb-1">
                {event.description}
              </p>
              <div className="text-sm text-gray-500 space-x-4">
                {event.ip && <span>IP: {event.ip}</span>}
                {event.userId && <span>Usuário: {event.userId}</span>}
                {event.sessionId && <span>Sessão: {event.sessionId.substring(0, 8)}...</span>}
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              event.success ? 'bg-green-400' : 'bg-red-400'
            }`} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Tab de segurança
 */
const SecurityTab: React.FC<{
  suspiciousActivities: any[];
  onRefresh: () => void;
}> = ({ suspiciousActivities, onRefresh }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Atividades Suspeitas ({suspiciousActivities.length})
          </h3>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Atualizar
          </button>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {suspiciousActivities.map(activity => (
          <div key={activity.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activity.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    activity.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    activity.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {activity.severity}
                  </span>
                  <span className="text-sm text-gray-500">{activity.type}</span>
                </div>
                <p className="text-gray-900 font-medium mb-1">
                  {activity.description}
                </p>
                <div className="text-sm text-gray-500">
                  IP: {activity.ip} • {activity.timestamp.toLocaleString()}
                </div>
              </div>
              <div className={`px-3 py-1 text-xs rounded-full ${
                activity.resolved 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {activity.resolved ? 'Resolvido' : 'Pendente'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * Tab de limpeza de dados
 */
const CleanupTab: React.FC<{
  report: any;
  onForceCleanup: () => void;
  isLoading: boolean;
}> = ({ report, onForceCleanup, isLoading }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Limpeza de Dados
        </h3>
        <button
          onClick={onForceCleanup}
          disabled={isLoading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300"
        >
          {isLoading ? 'Executando...' : 'Executar Limpeza'}
        </button>
      </div>

      {report && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Última Execução</p>
              <p className="text-lg font-semibold">
                {new Date(report.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Itens Removidos</p>
              <p className="text-lg font-semibold text-red-600">
                {report.totalItemsRemoved}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Tempo de Execução</p>
              <p className="text-lg font-semibold">
                {report.totalExecutionTime}ms
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Resultados por Tipo:</h4>
            {report.results.map((result: any) => (
              <div key={result.type} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-700">{result.type}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {result.itemsRemoved} removidos
                  </span>
                  <span className={`w-3 h-3 rounded-full ${
                    result.success ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

/**
 * Mock para sessões ativas (em produção, usar API real)
 */
async function getMockActiveSessions(): Promise<any[]> {
  return [
    {
      id: 'session_1',
      storeId: 'store_1',
      type: 'table',
      lastActivity: new Date(),
      isAuthenticated: true
    },
    {
      id: 'session_2',
      storeId: 'store_1',
      type: 'delivery',
      lastActivity: new Date(Date.now() - 300000),
      isAuthenticated: false
    }
  ];
}

export default AuditDashboard;