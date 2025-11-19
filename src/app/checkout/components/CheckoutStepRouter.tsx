'use client';

import { CheckoutState, CheckoutStep } from '@/services/checkoutStateMachine';
import AuthenticationStepComponent from './steps/AuthenticationStep';
import CustomerDataStepComponent from './steps/CustomerDataStep';
import AddressStepComponent from './steps/AddressStep';
import PaymentStepComponent from './steps/PaymentStep';
import ConfirmationStepComponent from './steps/ConfirmationStep';

/**
 * Router que renderiza o componente apropriado para cada step
 */

interface CheckoutStepRouterProps {
  currentStep: CheckoutStep;
  state: CheckoutState;
  onNextStep: () => void;
  onPrevStep: () => void;
  onGoToStep: (step: CheckoutStep) => void;
  onSetLoading: (loading: boolean) => void;
  onSetError: (error: string | null) => void;
  onSetAuthentication?: (user: any, isGuest: boolean, method: any) => void;
  onSetJWT?: (jwt: string) => void;
  onSetCustomerData?: (data: any) => void;
  onSetAddress?: (address: any) => void;
  onSetPaymentMethod?: (method: string) => void;
  onMarkStepComplete?: (step: CheckoutStep) => void;
}


/**
 * Renderiza o componente de step apropriado baseado no estado atual
 */
export default function CheckoutStepRouter({
  currentStep,
  state,
  onNextStep,
  onPrevStep,
  onGoToStep,
  onSetLoading,
  onSetError,
  onSetAuthentication,
  onSetJWT,
  onSetCustomerData,
  onSetAddress,
  onSetPaymentMethod,
  onMarkStepComplete,
}: CheckoutStepRouterProps) {
  switch (currentStep) {
    case 'authentication':
      return (
        <AuthenticationStepComponent
          state={state}
          onNextStep={onNextStep}
          onSetLoading={onSetLoading}
          onSetError={onSetError}
          onSetAuthentication={onSetAuthentication || (() => {})}
          onSetJWT={onSetJWT || (() => {})}
          onMarkStepComplete={onMarkStepComplete || (() => {})}
        />
      );

    case 'customer_data':
      return (
        <CustomerDataStepComponent
          state={state}
          onNextStep={onNextStep}
          onSetLoading={onSetLoading}
          onSetError={onSetError}
          onSetCustomerData={onSetCustomerData || (() => {})}
          onMarkStepComplete={onMarkStepComplete || (() => {})}
        />
      );

    case 'address':
      return (
        <AddressStepComponent
          state={state}
          onNextStep={onNextStep}
          onSetLoading={onSetLoading}
          onSetError={onSetError}
          onSetAddress={onSetAddress || (() => {})}
          onMarkStepComplete={onMarkStepComplete || (() => {})}
        />
      );

    case 'payment':
      return (
        <PaymentStepComponent
          state={state}
          onNextStep={onNextStep}
          onSetLoading={onSetLoading}
          onSetError={onSetError}
          onSetPaymentMethod={onSetPaymentMethod || (() => {})}
          onMarkStepComplete={onMarkStepComplete || (() => {})}
        />
      );

    case 'confirmation':
      return (
        <ConfirmationStepComponent
          state={state}
          onSetLoading={onSetLoading}
          onSetError={onSetError}
        />
      );

    default:
      return (
        <div className="text-center py-8">
          <p className="text-red-600 font-semibold">Step desconhecido: {currentStep}</p>
        </div>
      );
  }
}
