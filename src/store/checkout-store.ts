import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CustomerData {
  phone: string;
  name: string;
  email?: string;
  id?: number;
}

export interface Address {
  id: number;
  street: string;
  number: string;
  city: string;
  state: string;
  zip_code: string;
  neighborhood: string;
  complement?: string;
}

type OrderType = 'delivery' | 'takeout' | 'table';

interface CheckoutState {
  // Context
  storeId: string | null;
  tableId: string | null;
  orderType: OrderType | null;

  // Authentication (for delivery/takeout)
  customer: CustomerData | null;

  // Address (for delivery only)
  selectedAddress: Address | null;

  // Payment (for all types)
  paymentMethod: string | null;

  // Timestamp
  lastUpdated: number;
}

interface CheckoutStore extends CheckoutState {
  // Setters
  setContext: (storeId: string, tableId?: string) => void;
  setOrderType: (type: OrderType) => void;
  setCustomer: (data: CustomerData) => void;
  setAddress: (address: Address) => void;
  setPaymentMethod: (method: string) => void;

  // Getters
  isReady: () => boolean;

  // Actions
  reset: () => void;
  getOrderPayload: () => any;
}

const createCheckoutStorage = () => {
  return {
    getItem: (name: string): string | null => {
      if (typeof window === 'undefined') return null;
      try {
        return sessionStorage.getItem(name);
      } catch (error) {
        console.error('Erro ao recuperar checkout:', error);
        return null;
      }
    },
    setItem: (name: string, value: string): void => {
      if (typeof window === 'undefined') return;
      try {
        sessionStorage.setItem(name, value);
      } catch (error) {
        console.error('Erro ao salvar checkout:', error);
      }
    },
    removeItem: (name: string): void => {
      if (typeof window === 'undefined') return;
      sessionStorage.removeItem(name);
    }
  };
};

export const useCheckoutStore = create<CheckoutStore>()(
  persist(
    (set, get) => ({
      storeId: null,
      tableId: null,
      orderType: null,
      customer: null,
      selectedAddress: null,
      paymentMethod: null,
      lastUpdated: Date.now(),

      setContext: (storeId, tableId) => {
        set({
          storeId,
          tableId,
          lastUpdated: Date.now()
        });
      },

      setOrderType: (type) => {
        set({
          orderType: type,
          lastUpdated: Date.now()
        });
      },

      setCustomer: (data) => {
        set({
          customer: data,
          lastUpdated: Date.now()
        });
      },

      setAddress: (address) => {
        set({
          selectedAddress: address,
          lastUpdated: Date.now()
        });
      },

      setPaymentMethod: (method) => {
        set({
          paymentMethod: method,
          lastUpdated: Date.now()
        });
      },

      isReady: () => {
        const state = get();

        // For table orders: need storeId, tableId, and paymentMethod
        if (state.orderType === 'table') {
          return !!(state.storeId && state.tableId && state.paymentMethod);
        }

        // For delivery/takeout: need customer, paymentMethod
        if (state.orderType === 'delivery' || state.orderType === 'takeout') {
          const hasCustomer = !!(state.customer?.phone && state.customer?.name);
          const hasPayment = !!state.paymentMethod;

          // For delivery: also need address
          if (state.orderType === 'delivery') {
            return hasCustomer && hasPayment && !!state.selectedAddress;
          }

          return hasCustomer && hasPayment;
        }

        return false;
      },

      getOrderPayload: () => {
        const state = get();

        // Base payload
        const payload: any = {
          token_company: state.storeId,
          products: [], // Will be filled from cart store
          payment_method: state.paymentMethod
        };

        // Add type-specific data
        if (state.orderType === 'table') {
          payload.type = 'table';
          payload.table_id = state.tableId;
        } else if (state.orderType === 'delivery') {
          payload.type = 'delivery';
          payload.customer = state.customer;
          payload.customer_address_id = state.selectedAddress?.id;
        } else if (state.orderType === 'takeout') {
          payload.type = 'takeout';
          payload.customer = state.customer;
        }

        return payload;
      },

      reset: () => {
        set({
          storeId: null,
          tableId: null,
          orderType: null,
          customer: null,
          selectedAddress: null,
          paymentMethod: null,
          lastUpdated: Date.now()
        });
      }
    }),
    {
      name: 'digimenu-checkout',
      storage: createJSONStorage(() => createCheckoutStorage()),
      partialize: (state) => ({
        storeId: state.storeId,
        tableId: state.tableId,
        orderType: state.orderType,
        customer: state.customer,
        selectedAddress: state.selectedAddress,
        paymentMethod: state.paymentMethod,
        lastUpdated: state.lastUpdated
      })
    }
  )
);
