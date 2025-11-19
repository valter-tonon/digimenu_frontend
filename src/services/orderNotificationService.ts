/**
 * Serviço de notificações de pedidos
 * Responsável por enviar confirmações via WhatsApp
 */

import { sendOrderConfirmationWhatsApp } from './api';
import { CheckoutState } from './checkoutStateMachine';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderNotificationData {
  orderId: string;
  customerName: string;
  phone: string;
  items: OrderItem[];
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    zipCode: string;
  };
  paymentMethod: string;
  total: number;
  storeName: string;
  estimatedTime?: string;
}

/**
 * Formata a mensagem de confirmação do pedido para WhatsApp
 */
export function formatOrderConfirmationMessage(data: OrderNotificationData): string {
  const itemsList = data.items
    .map(item => `• ${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}`)
    .join('\n');

  const addressLine = `${data.address.street}, ${data.address.number} - ${data.address.neighborhood}, ${data.address.city}`;

  const paymentLabel = {
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    pix: 'PIX',
    cash: 'Dinheiro'
  }[data.paymentMethod] || data.paymentMethod;

  const timeEstimate = data.estimatedTime ? `\n⏱️ *Tempo estimado:* ${data.estimatedTime}` : '';

  return `
🎉 *Pedido Confirmado!*

*${data.storeName}*

*Número do Pedido:* #${data.orderId}
*Cliente:* ${data.customerName}

📦 *Itens do Pedido:*
${itemsList}

💰 *Valor Total:* R$ ${data.total.toFixed(2)}

📍 *Endereço de Entrega:*
${addressLine}

💳 *Forma de Pagamento:* ${paymentLabel}${timeEstimate}

✅ Você receberá atualizações sobre seu pedido aqui mesmo no WhatsApp!

Obrigado pela compra! 😊
`.trim();
}

/**
 * Envia notificação de confirmação do pedido via WhatsApp
 */
export async function sendOrderConfirmation(
  orderId: string,
  customerPhone: string,
  items: OrderItem[],
  state: CheckoutState,
  storeName: string,
  totalAmount: number
): Promise<boolean> {
  try {
    if (!state.selectedAddress) {
      console.error('❌ Endereço não configurado para envio de notificação');
      return false;
    }

    const notificationData: OrderNotificationData = {
      orderId,
      customerName: state.customerData?.name || 'Cliente',
      phone: customerPhone,
      items,
      address: {
        street: state.selectedAddress.street,
        number: state.selectedAddress.number,
        neighborhood: state.selectedAddress.neighborhood,
        city: state.selectedAddress.city,
        zipCode: state.selectedAddress.zipCode
      },
      paymentMethod: state.paymentMethod || 'cash',
      total: totalAmount,
      storeName,
      estimatedTime: '30-45 minutos' // Pode ser dinâmico baseado no restaurante
    };

    // Enviar para a API
    const response = await sendOrderConfirmationWhatsApp(orderId, customerPhone, notificationData);

    if (response.data?.success) {
      console.log('✅ Notificação de confirmação enviada via WhatsApp');
      return true;
    } else {
      console.warn('⚠️ Falha ao enviar notificação via WhatsApp:', response.data?.message);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Erro ao enviar notificação:', error);
    // Não falhar o pedido por erro ao enviar notificação
    return false;
  }
}

/**
 * Template de mensagem de confirmação simples (fallback)
 */
export function getSimpleConfirmationTemplate(orderId: string, customerName: string): string {
  return `
Olá ${customerName}! 👋

Seu pedido #${orderId} foi confirmado com sucesso! ✅

Em breve você receberá mais informações sobre a entrega.

Obrigado pela compra! 😊
  `.trim();
}
