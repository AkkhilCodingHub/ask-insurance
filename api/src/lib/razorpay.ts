import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

let razorpayClient: Razorpay | null = null;

function getRazorpay(): Razorpay | null {
  if (!razorpayClient) {
    const key_id = process.env.RAZORPAY_KEY_ID ?? '';
    const key_secret = process.env.RAZORPAY_KEY_SECRET ?? '';
    if (key_id && key_secret) {
      razorpayClient = new Razorpay({ key_id, key_secret });
    }
  }
  return razorpayClient;
}

export async function createRazorpayOrder(opts: {
  amount: number;
  policyId: string;
  policyNumber: string;
  customerName: string;
  customerPhone?: string;
  description: string;
}) {
  const client = getRazorpay();
  const amountPaise = Math.max(100, Math.round(opts.amount * 100));
  if (client) {
    try {
      const order = await (client.orders as any).create({
        amount: amountPaise,
        currency: 'INR',
        receipt: opts.policyId.slice(0, 40),
        notes: {
          policyId: opts.policyId,
          policyNumber: opts.policyNumber,
          customerName: opts.customerName,
          customerPhone: opts.customerPhone ?? '',
        },
      });
      return order;
    } catch (err: any) {
      console.error('[razorpay] order.create error:', err);
    }
  }
  return {
    id: `order_sim_${Date.now()}`,
    amount: amountPaise,
    currency: 'INR',
    status: 'created',
  };
}

export async function createPaymentLink(opts: {
  amount: number;      // in INR (we convert to paise)
  policyId: string;
  policyNumber: string;
  customerName: string;
  customerPhone?: string;
  description: string;
}) {
  const apiUrl = process.env.API_BASE_URL || 'https://ask-api.bitopayments.com';
  
  // Return the first-party branded ASK Insurance Brokers checkout interface
  return {
    id: `plink_ask_${Date.now()}`,
    short_url: `${apiUrl}/api/payments/checkout/${opts.policyId}`,
    amount: opts.amount,
    status: 'created',
  };
}
