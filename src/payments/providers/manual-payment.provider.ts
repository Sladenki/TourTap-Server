import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '../../common/enums/payment-status.enum.js';
import {
  CreateProviderPaymentInput,
  PaymentProvider,
  ProviderPaymentResult,
} from './payment-provider.js';

@Injectable()
export class ManualPaymentProvider implements PaymentProvider {
  createPayment(input: CreateProviderPaymentInput): Promise<ProviderPaymentResult> {
    return Promise.resolve({
      status: PaymentStatus.SUCCEEDED,
      transactionId: input.transactionId,
    });
  }
}
