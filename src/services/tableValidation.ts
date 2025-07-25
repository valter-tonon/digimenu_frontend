/**
 * Serviço de validação de contexto de mesa
 * 
 * Gerencia validação de mesas, horários de funcionamento,
 * limites de sessões e status de disponibilidade.
 */

export interface TableInfo {
  id: string;
  storeId: string;
  number: string;
  capacity: number;
  isActive: boolean;
  isOccupied: boolean;
  currentSessions: number;
  maxSessions: number;
  lastActivity?: Date;
}

export interface StoreOperatingHours {
  id: string;
  name: string;
  isOpen: boolean;
  status: 'open' | 'closed' | 'busy' | 'maintenance';
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  timezone: string;
}

export interface TableValidationResult {
  isValid: boolean;
  table?: TableInfo;
  store?: StoreOperatingHours;
  reason?: string;
  canAccess: boolean;
  maxSessionsReached: boolean;
  storeStatus: 'open' | 'closed' | 'busy' | 'maintenance';
}

export interface SessionLimits {
  maxSessionsPerTable: number;
  maxSessionsPerStore: number;
  sessionTimeoutMinutes: number;
  allowMultipleSessions: boolean;
}

class TableValidationService {
  private readonly API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

  /**
   * Valida acesso a uma mesa específica
   */
  async validateTableAccess(
    storeId: string, 
    tableId: string
  ): Promise<TableValidationResult> {
    try {
      // Valida loja primeiro
      const storeValidation = await this.validateStoreStatus(storeId);
      if (!storeValidation.isOpen) {
        return {
          isValid: false,
          reason: this.getStoreClosedMessage(storeValidation.status),
          canAccess: false,
          maxSessionsReached: false,
          storeStatus: storeValidation.status,
          store: storeValidation
        };
      }

      // Valida mesa
      const tableInfo = await this.getTableInfo(storeId, tableId);
      if (!tableInfo.isActive) {
        return {
          isValid: false,
          reason: 'Mesa não está disponível no momento',
          canAccess: false,
          maxSessionsReached: false,
          storeStatus: storeValidation.status,
          table: tableInfo,
          store: storeValidation
        };
      }

      // Verifica limite de sessões
      const sessionLimits = await this.getSessionLimits(storeId);
      const maxSessionsReached = tableInfo.currentSessions >= sessionLimits.maxSessionsPerTable;

      if (maxSessionsReached && !sessionLimits.allowMultipleSessions) {
        return {
          isValid: false,
          reason: `Mesa atingiu o limite máximo de ${sessionLimits.maxSessionsPerTable} usuário(s)`,
          canAccess: false,
          maxSessionsReached: true,
          storeStatus: storeValidation.status,
          table: tableInfo,
          store: storeValidation
        };
      }

      // Validação bem-sucedida
      return {
        isValid: true,
        canAccess: true,
        maxSessionsReached: false,
        storeStatus: storeValidation.status,
        table: tableInfo,
        store: storeValidation
      };

    } catch (error) {
      console.error('Erro ao validar acesso à mesa:', error);
      return {
        isValid: false,
        reason: 'Erro interno ao validar mesa',
        canAccess: false,
        maxSessionsReached: false,
        storeStatus: 'maintenance'
      };
    }
  }

  /**
   * Valida status da loja e horário de funcionamento
   */
  async validateStoreStatus(storeId: string): Promise<StoreOperatingHours> {
    try {
      // Em produção, fazer chamada para API
      // const response = await fetch(`${this.API_BASE}/stores/${storeId}/status`);
      // if (!response.ok) throw new Error('Loja não encontrada');
      // return response.json();

      // Mock para desenvolvimento
      const now = new Date();
      const currentHour = now.getHours();
      const currentDay = now.toLocaleLowerCase().substring(0, 3); // seg, ter, qua, etc.

      const mockStore: StoreOperatingHours = {
        id: storeId,
        name: 'Restaurante Demo',
        isOpen: currentHour >= 11 && currentHour < 23, // 11h às 23h
        status: currentHour >= 11 && currentHour < 23 ? 'open' : 'closed',
        operatingHours: {
          seg: { open: '11:00', close: '23:00', isOpen: true },
          ter: { open: '11:00', close: '23:00', isOpen: true },
          qua: { open: '11:00', close: '23:00', isOpen: true },
          qui: { open: '11:00', close: '23:00', isOpen: true },
          sex: { open: '11:00', close: '23:00', isOpen: true },
          sab: { open: '11:00', close: '23:00', isOpen: true },
          dom: { open: '11:00', close: '22:00', isOpen: true }
        },
        timezone: 'America/Sao_Paulo'
      };

      return mockStore;

    } catch (error) {
      throw new Error('Erro ao validar status da loja');
    }
  }

  /**
   * Obtém informações da mesa
   */
  async getTableInfo(storeId: string, tableId: string): Promise<TableInfo> {
    try {
      // Em produção, fazer chamada para API
      // const response = await fetch(`${this.API_BASE}/stores/${storeId}/tables/${tableId}`);
      // if (!response.ok) throw new Error('Mesa não encontrada');
      // return response.json();

      // Mock para desenvolvimento
      const mockTable: TableInfo = {
        id: tableId,
        storeId,
        number: tableId,
        capacity: 4,
        isActive: true,
        isOccupied: false,
        currentSessions: Math.floor(Math.random() * 3), // 0-2 sessões ativas
        maxSessions: 10,
        lastActivity: new Date()
      };

      return mockTable;

    } catch (error) {
      throw new Error('Erro ao obter informações da mesa');
    }
  }

  /**
   * Obtém limites de sessão configurados para a loja
   */
  async getSessionLimits(storeId: string): Promise<SessionLimits> {
    try {
      // Em produção, fazer chamada para API
      // const response = await fetch(`${this.API_BASE}/stores/${storeId}/session-limits`);
      // if (!response.ok) throw new Error('Configurações não encontradas');
      // return response.json();

      // Mock para desenvolvimento
      return {
        maxSessionsPerTable: 10,
        maxSessionsPerStore: 100,
        sessionTimeoutMinutes: 240, // 4 horas
        allowMultipleSessions: true
      };

    } catch (error) {
      throw new Error('Erro ao obter limites de sessão');
    }
  }

  /**
   * Verifica se a mesa está inativa há muito tempo
   */
  async checkTableInactivity(storeId: string, tableId: string): Promise<{
    isInactive: boolean;
    lastActivity?: Date;
    inactiveMinutes: number;
  }> {
    try {
      const tableInfo = await this.getTableInfo(storeId, tableId);
      
      if (!tableInfo.lastActivity) {
        return {
          isInactive: false,
          inactiveMinutes: 0
        };
      }

      const now = new Date();
      const lastActivity = new Date(tableInfo.lastActivity);
      const inactiveMinutes = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60));
      
      // Considera inativa após 30 minutos sem atividade
      const isInactive = inactiveMinutes > 30;

      return {
        isInactive,
        lastActivity,
        inactiveMinutes
      };

    } catch (error) {
      console.error('Erro ao verificar inatividade da mesa:', error);
      return {
        isInactive: false,
        inactiveMinutes: 0
      };
    }
  }

  /**
   * Lista todas as mesas ativas de uma loja
   */
  async getActiveTables(storeId: string): Promise<TableInfo[]> {
    try {
      // Em produção, fazer chamada para API
      // const response = await fetch(`${this.API_BASE}/stores/${storeId}/tables?active=true`);
      // if (!response.ok) throw new Error('Erro ao listar mesas');
      // return response.json();

      // Mock para desenvolvimento
      const mockTables: TableInfo[] = [];
      for (let i = 1; i <= 20; i++) {
        mockTables.push({
          id: i.toString(),
          storeId,
          number: i.toString(),
          capacity: Math.floor(Math.random() * 6) + 2, // 2-8 pessoas
          isActive: Math.random() > 0.1, // 90% das mesas ativas
          isOccupied: Math.random() > 0.7, // 30% ocupadas
          currentSessions: Math.floor(Math.random() * 3),
          maxSessions: 10,
          lastActivity: new Date(Date.now() - Math.random() * 3600000) // Última atividade nas últimas 1h
        });
      }

      return mockTables.filter(table => table.isActive);

    } catch (error) {
      throw new Error('Erro ao listar mesas ativas');
    }
  }

  /**
   * Atualiza atividade da mesa
   */
  async updateTableActivity(storeId: string, tableId: string): Promise<void> {
    try {
      // Em produção, fazer chamada para API
      // await fetch(`${this.API_BASE}/stores/${storeId}/tables/${tableId}/activity`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ lastActivity: new Date() })
      // });

      console.log('Atividade da mesa atualizada:', { storeId, tableId });

    } catch (error) {
      console.error('Erro ao atualizar atividade da mesa:', error);
    }
  }

  /**
   * Obtém mensagem apropriada para loja fechada
   */
  private getStoreClosedMessage(status: string): string {
    switch (status) {
      case 'closed':
        return 'Restaurante está fechado no momento';
      case 'busy':
        return 'Restaurante está muito ocupado, tente novamente em alguns minutos';
      case 'maintenance':
        return 'Restaurante em manutenção, volte em breve';
      default:
        return 'Restaurante não está disponível no momento';
    }
  }

  /**
   * Verifica se horário atual está dentro do funcionamento
   */
  isWithinOperatingHours(operatingHours: StoreOperatingHours): boolean {
    const now = new Date();
    const currentDay = now.toLocaleDateString('pt-BR', { weekday: 'short' }).toLowerCase();
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM

    const dayHours = operatingHours.operatingHours[currentDay];
    if (!dayHours || !dayHours.isOpen) {
      return false;
    }

    return currentTime >= dayHours.open && currentTime <= dayHours.close;
  }
}

export const tableValidationService = new TableValidationService();