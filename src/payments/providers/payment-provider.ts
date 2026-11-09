import { PaymentMethod } from '../../common/enums/payment-method.enum.js';
import { PaymentStatus } from '../../common/enums/payment-status.enum.js';

export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';

export interface CreateProviderPaymentInput {
  ticketId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId: string | null;
}

export interface ProviderPaymentResult {
  status: PaymentStatus;
  transactionId: string | null;
}

/**
 * Точка подключения реального провайдера.
 * Внешний вызов не должен выполняться внутри MongoDB-транзакции:
 * сервис сначала получает результат, затем атомарно пишет Payment и статус Ticket.
 */
export interface PaymentProvider {
  createPayment(input: CreateProviderPaymentInput): Promise<ProviderPaymentResult>;
}
