import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentMethodSelection } from '@/components/checkout/PaymentMethodSelection';
import { vi } from 'vitest';

describe('PaymentMethodSelection', () => {
  const mockProps = {
    selectedMethod: '',
    onMethodSelect: vi.fn(),
    onPaymentDataChange: vi.fn(),
    changeAmount: '',
    onChangeAmountChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all payment methods', () => {
    render(<PaymentMethodSelection {...mockProps} />);
    
    expect(screen.getByText('PIX')).toBeInTheDocument();
    expect(screen.getByText('Cartão de Crédito')).toBeInTheDocument();
    expect(screen.getByText('Cartão de Débito')).toBeInTheDocument();
    expect(screen.getByText('Dinheiro')).toBeInTheDocument();
    expect(screen.getByText('Vale Refeição')).toBeInTheDocument();
  });

  it('calls onMethodSelect when a payment method is clicked', () => {
    render(<PaymentMethodSelection {...mockProps} />);
    
    fireEvent.click(screen.getByText('PIX'));
    expect(mockProps.onMethodSelect).toHaveBeenCalledWith('pix');
  });

  it('shows PIX details when PIX is selected', () => {
    render(<PaymentMethodSelection {...mockProps} selectedMethod="pix" />);
    
    expect(screen.getByText('Pagamento PIX')).toBeInTheDocument();
    expect(screen.getByText('Pagamento instantâneo')).toBeInTheDocument();
  });

  it('shows card form when credit card is selected', () => {
    render(<PaymentMethodSelection {...mockProps} selectedMethod="credit" />);
    
    expect(screen.getByText('Dados do Cartão de Crédito')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('1234 5678 9012 3456')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('NOME COMO NO CARTÃO')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('MM/AA')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('123')).toBeInTheDocument();
  });

  it('validates card number input', async () => {
    render(<PaymentMethodSelection {...mockProps} selectedMethod="credit" />);
    
    const cardNumberInput = screen.getByPlaceholderText('1234 5678 9012 3456');
    
    // Test invalid card number
    fireEvent.change(cardNumberInput, { target: { value: '123' } });
    
    await waitFor(() => {
      expect(screen.getByText('Número do cartão deve ter pelo menos 13 dígitos')).toBeInTheDocument();
    });
  });

  it('validates card expiry date', async () => {
    render(<PaymentMethodSelection {...mockProps} selectedMethod="credit" />);
    
    const expiryInput = screen.getByPlaceholderText('MM/AA');
    
    // Test invalid format
    fireEvent.change(expiryInput, { target: { value: '1323' } });
    
    await waitFor(() => {
      expect(screen.getByText('Formato inválido (MM/AA)')).toBeInTheDocument();
    });
  });

  it('validates expired card', async () => {
    render(<PaymentMethodSelection {...mockProps} selectedMethod="credit" />);
    
    const expiryInput = screen.getByPlaceholderText('MM/AA');
    
    // Test expired date (January 2020)
    fireEvent.change(expiryInput, { target: { value: '01/20' } });
    
    await waitFor(() => {
      expect(screen.getByText('Cartão expirado')).toBeInTheDocument();
    });
  });

  it('formats card number with spaces', () => {
    render(<PaymentMethodSelection {...mockProps} selectedMethod="credit" />);
    
    const cardNumberInput = screen.getByPlaceholderText('1234 5678 9012 3456');
    
    fireEvent.change(cardNumberInput, { target: { value: '1234567890123456' } });
    
    expect(cardNumberInput).toHaveValue('1234 5678 9012 3456');
  });

  it('formats expiry date with slash', () => {
    render(<PaymentMethodSelection {...mockProps} selectedMethod="credit" />);
    
    const expiryInput = screen.getByPlaceholderText('MM/AA');
    
    fireEvent.change(expiryInput, { target: { value: '1225' } });
    
    expect(expiryInput).toHaveValue('12/25');
  });

  it('shows cash payment options when money is selected', () => {
    render(<PaymentMethodSelection {...mockProps} selectedMethod="money" />);
    
    expect(screen.getByText('Pagamento em Dinheiro')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0,00')).toBeInTheDocument();
  });

  it('shows voucher payment info when voucher is selected', () => {
    render(<PaymentMethodSelection {...mockProps} selectedMethod="voucher" />);
    
    expect(screen.getAllByText('Vale Refeição')).toHaveLength(2); // Button and details section
    expect(screen.getByText('Pagamento será processado com seu vale refeição na entrega.')).toBeInTheDocument();
    // Check for voucher details section - should have 2 instances
    expect(screen.getAllByText(/Ticket, Sodexo, Alelo/)).toHaveLength(2);
  });

  it('calls onPaymentDataChange when card data changes', () => {
    render(<PaymentMethodSelection {...mockProps} selectedMethod="credit" />);
    
    const cardNumberInput = screen.getByPlaceholderText('1234 5678 9012 3456');
    
    fireEvent.change(cardNumberInput, { target: { value: '1234 5678 9012 3456' } });
    
    expect(mockProps.onPaymentDataChange).toHaveBeenCalledWith({
      number: '1234 5678 9012 3456',
      name: '',
      expiry: '',
      cvv: ''
    });
  });

  it('calls onChangeAmountChange when change amount changes', () => {
    render(<PaymentMethodSelection {...mockProps} selectedMethod="money" />);
    
    const changeInput = screen.getByPlaceholderText('0,00');
    
    fireEvent.change(changeInput, { target: { value: '50.00' } });
    
    expect(mockProps.onChangeAmountChange).toHaveBeenCalledWith('50.00');
  });

  it('resets card data when switching from card to non-card method', () => {
    const { rerender } = render(<PaymentMethodSelection {...mockProps} selectedMethod="credit" />);
    
    // Fill card data
    const cardNumberInput = screen.getByPlaceholderText('1234 5678 9012 3456');
    fireEvent.change(cardNumberInput, { target: { value: '1234 5678 9012 3456' } });
    
    // Switch to PIX
    rerender(<PaymentMethodSelection {...mockProps} selectedMethod="pix" />);
    
    // Should have called onPaymentDataChange with empty object
    expect(mockProps.onPaymentDataChange).toHaveBeenCalledWith({});
  });

  it('validates CVV length', async () => {
    render(<PaymentMethodSelection {...mockProps} selectedMethod="credit" />);
    
    const cvvInput = screen.getByPlaceholderText('123');
    
    // Test short CVV
    fireEvent.change(cvvInput, { target: { value: '12' } });
    
    await waitFor(() => {
      expect(screen.getByText('CVV deve ter 3 ou 4 dígitos')).toBeInTheDocument();
    });
  });

  it('validates cardholder name', async () => {
    render(<PaymentMethodSelection {...mockProps} selectedMethod="credit" />);
    
    const nameInput = screen.getByPlaceholderText('NOME COMO NO CARTÃO');
    
    // Test short name
    fireEvent.change(nameInput, { target: { value: 'A' } });
    
    await waitFor(() => {
      expect(screen.getByText('Nome deve ter pelo menos 2 caracteres')).toBeInTheDocument();
    });
  });

  it('converts cardholder name to uppercase', () => {
    render(<PaymentMethodSelection {...mockProps} selectedMethod="credit" />);
    
    const nameInput = screen.getByPlaceholderText('NOME COMO NO CARTÃO');
    
    fireEvent.change(nameInput, { target: { value: 'john doe' } });
    
    expect(nameInput).toHaveValue('JOHN DOE');
  });

  it('limits CVV to 4 digits', () => {
    render(<PaymentMethodSelection {...mockProps} selectedMethod="credit" />);
    
    const cvvInput = screen.getByPlaceholderText('123');
    
    fireEvent.change(cvvInput, { target: { value: '12345' } });
    
    expect(cvvInput).toHaveValue('1234');
  });

  it('applies correct styling for selected method', () => {
    render(<PaymentMethodSelection {...mockProps} selectedMethod="pix" />);
    
    const pixButton = screen.getByText('PIX').closest('button');
    const creditButton = screen.getByText('Cartão de Crédito').closest('button');
    
    expect(pixButton).toHaveClass('border-blue-500', 'bg-blue-50');
    expect(creditButton).toHaveClass('border-gray-300');
  });
});