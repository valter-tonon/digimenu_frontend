/**
 * Checkout State Machine
 *
 * Gerencia o fluxo do checkout usando padrão Redux Reducer
 * Substitui o CheckoutSessionService anterior
 *
 * Vantagens:
 * - State imutável e previsível
 * - Transições validadas
 * - Fácil de testar
 * - Sem side effects
 */

export type CheckoutStep =
  | 'authentication'
  | 'customer_data'
  | 'address'
  | 'payment'
  | 'confirmation';

export type AuthenticationMethod = 'phone' | 'guest' | 'existing_account' | 'new_account';

export interface CustomerData {
  name: string;
  phone: string;
  email?: string;
}

export interface Address {
  id?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state?: string;
  zipCode: string;
  reference?: string;
  isDefault?: boolean;
}

export interface CheckoutState {
  // Session info
  sessionId: string;
  storeId: string;
  customerId?: string;

  // Authentication
  jwt: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  authenticationMethod?: AuthenticationMethod;

  // Form data
  customerData?: CustomerData;
  selectedAddress?: Address;
  paymentMethod?: string;
  orderNotes?: string;

  // Step tracking
  currentStep: CheckoutStep;
  completedSteps: CheckoutStep[];

  // UI state
  isLoading: boolean;
  error: string | null;

  // Modal state (novo)
  showAuthModal: boolean;
  authModalConfirmed: boolean;

  // Timestamps
  startedAt: Date;
  lastActivity: Date;
  expiresAt: Date;
}

export type CheckoutAction =
  | { type: 'INIT_SESSION'; payload: { storeId: string; customerId?: string } }
  | { type: 'SET_JWT'; payload: string }
  | { type: 'SET_AUTHENTICATION'; payload: { isGuest: boolean; method: AuthenticationMethod; user?: any } }
  | { type: 'SET_CUSTOMER_DATA'; payload: CustomerData }
  | { type: 'SET_ADDRESS'; payload: Address }
  | { type: 'SET_PAYMENT_METHOD'; payload: string }
  | { type: 'GO_TO_STEP'; payload: CheckoutStep }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'MARK_STEP_COMPLETE'; payload: CheckoutStep }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SHOW_AUTH_MODAL'; payload: boolean }
  | { type: 'CONFIRM_IDENTITY' }
  | { type: 'RESET' };

const STEP_ORDER: CheckoutStep[] = [
  'authentication',
  'customer_data',
  'address',
  'payment',
  'confirmation'
];

const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 horas

function generateSessionId(): string {
  return `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const initialCheckoutState: CheckoutState = {
  sessionId: generateSessionId(),
  storeId: '',
  jwt: null,
  isAuthenticated: false,
  isGuest: false,
  currentStep: 'authentication',
  completedSteps: [],
  isLoading: false,
  error: null,
  showAuthModal: false,
  authModalConfirmed: false,
  startedAt: new Date(),
  lastActivity: new Date(),
  expiresAt: new Date(Date.now() + SESSION_DURATION),
};

/**
 * Reducer para gerenciar transições de estado
 */
export function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  const now = new Date();

  switch (action.type) {
    case 'INIT_SESSION':
      return {
        ...state,
        sessionId: generateSessionId(),
        storeId: action.payload.storeId,
        customerId: action.payload.customerId,
        startedAt: now,
        lastActivity: now,
        expiresAt: new Date(now.getTime() + SESSION_DURATION),
      };

    case 'SET_JWT':
      return {
        ...state,
        jwt: action.payload,
        lastActivity: now,
        expiresAt: new Date(now.getTime() + SESSION_DURATION),
      };

    case 'SET_AUTHENTICATION':
      return {
        ...state,
        isAuthenticated: !action.payload.isGuest,
        isGuest: action.payload.isGuest,
        authenticationMethod: action.payload.method,
        customerId: action.payload.user?.id,
        customerData: {
          name: action.payload.user?.name || '',
          phone: action.payload.user?.phone || '',
          email: action.payload.user?.email,
        },
        lastActivity: now,
        expiresAt: new Date(now.getTime() + SESSION_DURATION),
      };

    case 'SET_CUSTOMER_DATA':
      return {
        ...state,
        customerData: action.payload,
        lastActivity: now,
        expiresAt: new Date(now.getTime() + SESSION_DURATION),
      };

    case 'SET_ADDRESS':
      return {
        ...state,
        selectedAddress: action.payload,
        lastActivity: now,
        expiresAt: new Date(now.getTime() + SESSION_DURATION),
      };

    case 'SET_PAYMENT_METHOD':
      return {
        ...state,
        paymentMethod: action.payload,
        lastActivity: now,
        expiresAt: new Date(now.getTime() + SESSION_DURATION),
      };

    case 'GO_TO_STEP': {
      // Validar se pode ir para este step
      const stepIndex = STEP_ORDER.indexOf(action.payload);
      const currentStepIndex = STEP_ORDER.indexOf(state.currentStep);

      // Pode voltar para qualquer passo anterior ou ir para próximo se completou anterior
      const canGo = stepIndex < currentStepIndex ||
                    state.completedSteps.includes(STEP_ORDER[stepIndex - 1]);

      if (!canGo && action.payload !== 'authentication') {
        console.warn(`Não pode pular para ${action.payload}`);
        return state;
      }

      return {
        ...state,
        currentStep: action.payload,
        lastActivity: now,
        expiresAt: new Date(now.getTime() + SESSION_DURATION),
      };
    }

    case 'NEXT_STEP': {
      const currentIndex = STEP_ORDER.indexOf(state.currentStep);
      if (currentIndex < STEP_ORDER.length - 1) {
        return {
          ...state,
          currentStep: STEP_ORDER[currentIndex + 1],
          completedSteps: [...new Set([...state.completedSteps, state.currentStep])],
          lastActivity: now,
          expiresAt: new Date(now.getTime() + SESSION_DURATION),
        };
      }
      return state;
    }

    case 'PREV_STEP': {
      const currentIndex = STEP_ORDER.indexOf(state.currentStep);
      if (currentIndex > 0) {
        return {
          ...state,
          currentStep: STEP_ORDER[currentIndex - 1],
          lastActivity: now,
          expiresAt: new Date(now.getTime() + SESSION_DURATION),
        };
      }
      return state;
    }

    case 'MARK_STEP_COMPLETE':
      return {
        ...state,
        completedSteps: [...new Set([...state.completedSteps, action.payload])],
        lastActivity: now,
        expiresAt: new Date(now.getTime() + SESSION_DURATION),
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        lastActivity: now,
        expiresAt: new Date(now.getTime() + SESSION_DURATION),
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        lastActivity: now,
        expiresAt: new Date(now.getTime() + SESSION_DURATION),
      };

    case 'SHOW_AUTH_MODAL':
      return {
        ...state,
        showAuthModal: action.payload,
        lastActivity: now,
        expiresAt: new Date(now.getTime() + SESSION_DURATION),
      };

    case 'CONFIRM_IDENTITY':
      return {
        ...state,
        authModalConfirmed: true,
        showAuthModal: false,
        lastActivity: now,
        expiresAt: new Date(now.getTime() + SESSION_DURATION),
      };

    case 'RESET':
      return {
        ...initialCheckoutState,
        storeId: state.storeId,
      };

    default:
      return state;
  }
}

/**
 * Helpers para validação
 */
export function isStepComplete(state: CheckoutState, step: CheckoutStep): boolean {
  return state.completedSteps.includes(step);
}

export function canGoToStep(state: CheckoutState, step: CheckoutStep): boolean {
  const stepIndex = STEP_ORDER.indexOf(step);
  const currentIndex = STEP_ORDER.indexOf(state.currentStep);

  // Pode voltar para steps anteriores
  if (stepIndex < currentIndex) {
    return true;
  }

  // Pode ir para próximo se completou step anterior
  if (stepIndex === currentIndex + 1) {
    return isStepComplete(state, state.currentStep);
  }

  // Pode ir para authentication sempre
  if (step === 'authentication') {
    return true;
  }

  return false;
}

export function canGoNext(state: CheckoutState): boolean {
  const currentIndex = STEP_ORDER.indexOf(state.currentStep);
  return currentIndex < STEP_ORDER.length - 1;
}

export function canGoPrev(state: CheckoutState): boolean {
  const currentIndex = STEP_ORDER.indexOf(state.currentStep);
  return currentIndex > 0;
}

export function getProgressPercentage(state: CheckoutState): number {
  const currentIndex = STEP_ORDER.indexOf(state.currentStep);
  return ((currentIndex + 1) / STEP_ORDER.length) * 100;
}

export function isSessionExpired(state: CheckoutState): boolean {
  return new Date() > state.expiresAt;
}
