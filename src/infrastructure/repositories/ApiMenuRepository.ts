import { Category } from '@/domain/entities/Category';
import { Product } from '@/domain/entities/Product';
import { MenuRepository } from '@/domain/repositories/MenuRepository';
import { apiClient } from '../api/apiClient';

export class ApiMenuRepository implements MenuRepository {
  async getMenu(params: { store?: string, table?: string, isDelivery?: boolean }): Promise<{
    categories: Category[];
    products: Product[];
    tenant?: {
      id: number;
      uuid: string;
      name: string;
      url: string;
      logo: string | null;
      opening_hours?: {
        opens_at: string;
        closes_at: string;
        is_open: boolean;
      };
      min_order_value?: number;
      delivery_fee?: number;
      estimated_delivery_time?: string;
    };
  }> {
    try {
      const queryParams: any = {};
      
      if (params.store) {
        queryParams.store = params.store;
      }
      
      if (params.table) {
        queryParams.table = params.table;
      }
      
      if (params.isDelivery) {
        queryParams.isDelivery = params.isDelivery;
      }
      
      // Verificar se temos parâmetros válidos
      if (Object.keys(queryParams).length === 0) {
        console.warn('Nenhum parâmetro válido fornecido para busca do menu');
        return { categories: [], products: [] };
      }
      
      const response = await apiClient.get<{
        data: {
          categories: any[];
          products: any[];
          tenant?: {
            id: number;
            uuid: string;
            name: string;
            url: string;
            logo: string | null;
            opening_hours?: {
              opens_at: string;
              closes_at: string;
              is_open: boolean;
            };
            min_order_value?: number;
            delivery_fee?: number;
            estimated_delivery_time?: string;
          };
        }
      }>('/menu', { params: queryParams });
      
      // Verificar se a resposta contém os dados esperados
      if (!response.data || !response.data.categories || !response.data.products) {
        console.warn('Resposta da API não contém os dados esperados');
        return { categories: [], products: [] };
      }
      
      // Transformar os dados para garantir compatibilidade com as interfaces
      const categories = this.transformCategories(response.data.categories);
      const products = this.transformProducts(response.data.products);
      
      // Extrair os dados do tenant, se disponíveis
      const tenant = response.data.tenant;
      
      return { 
        categories, 
        products,
        tenant
      };
    } catch (error: any) {
      console.error('Erro ao buscar menu:', error.message);
      
      // Retornar um objeto vazio em vez de propagar o erro
      // para evitar quebrar a UI em caso de falha na API
      return { categories: [], products: [] };
    }
  }
  
  /**
   * Transforma os dados das categorias recebidos da API para corresponder à interface Category
   */
  private transformCategories(apiCategories: any[]): Category[] {
    if (!apiCategories || !Array.isArray(apiCategories)) {
      console.warn('Dados de categorias inválidos');
      return [];
    }
    
    return apiCategories.map((category, index) => {
      if (!category || typeof category !== 'object') {
        console.warn(`Categoria inválida no índice ${index}:`, category);
        return null;
      }
      
      // Garantir que temos um ID numérico para a categoria
      let numericId: number;
      
      if (typeof category.id === 'number') {
        numericId = category.id;
      } else if (typeof category.id === 'string') {
        numericId = parseInt(category.id, 10);
        if (isNaN(numericId)) {
          numericId = index + 1; // Fallback para o índice + 1 se não for possível converter
        }
      } else {
        numericId = index + 1; // Fallback para o índice + 1 se não houver ID
      }
      
      // Garantir que temos um UUID para a categoria
      const uuid = category.uuid || category.id?.toString() || `generated-uuid-${index}`;
      
      return {
        id: numericId,
        uuid: uuid,
        name: category.name || `Categoria ${index + 1}`,
        description: category.description || '',
        image: category.image || null,
        active: category.active !== false,  // Default para true se não especificado
        tenant_id: category.tenant_id || 0,
        created_at: category.created_at || new Date().toISOString(),
        updated_at: category.updated_at || new Date().toISOString(),
        products: category.products || []
      };
    }).filter(Boolean) as Category[]; // Remover itens nulos
  }
  
  /**
   * Transforma os dados dos produtos recebidos da API para corresponder à interface Product
   */
  private transformProducts(apiProducts: any[]): Product[] {
    if (!apiProducts || !Array.isArray(apiProducts)) {
      console.warn('Dados de produtos inválidos');
      return [];
    }
    
    return apiProducts.map((product, index) => {
      if (!product || typeof product !== 'object') {
        console.warn(`Produto inválido no índice ${index}:`, product);
        return null;
      }
      
      // Garantir que temos um ID numérico para o produto
      let numericId: number;
      
      if (typeof product.id === 'number') {
        numericId = product.id;
      } else if (typeof product.id === 'string') {
        numericId = parseInt(product.id, 10);
        if (isNaN(numericId)) {
          numericId = index + 1; // Fallback para o índice + 1 se não for possível converter
        }
      } else {
        numericId = index + 1; // Fallback para o índice + 1 se não houver ID
      }
      
      // Garantir que temos um UUID para o produto
      const uuid = product.uuid || product.id?.toString() || `generated-uuid-${index}`;
      
      // Garantir que o preço é um número
      let price: number;
      
      if (typeof product.price === 'number') {
        price = product.price;
      } else if (typeof product.price === 'string') {
        price = parseFloat(product.price);
        if (isNaN(price)) {
          price = 0;
        }
      } else {
        price = 0;
      }
      
      // Usar a chave 'additional' da API em vez de 'additionals'
      const additionals = product.additional || product.additionals || [];
      
      return {
        id: numericId,
        uuid: uuid,
        name: product.title || product.name || `Produto ${index + 1}`,
        description: product.description || '',
        price: price,
        promotional_price: product.promotional_price || null,
        is_on_promotion: product.is_on_promotion || false,
        promotion_starts_at: product.promotion_starts_at || null,
        promotion_ends_at: product.promotion_ends_at || null,
        is_featured: product.is_featured || false,
        is_popular: product.is_popular || false,
        tags: product.tags || [],
        image: product.image || null,
        active: product.isAtivo !== false,  // Default para true se não especificado
        category_id: product.category_id || 0,
        tenant_id: product.tenant_id || 0,
        created_at: product.created_at || new Date().toISOString(),
        updated_at: product.updated_at || new Date().toISOString(),
        extras: product.extras || [],
        additionals: additionals
      };
    }).filter(Boolean) as Product[]; // Remover itens nulos
  }
} 