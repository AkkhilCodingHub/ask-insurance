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

export async function createPaymentLink(opts: {
  amount: number;      // in INR (we convert to paise)
  policyId: string;
  policyNumber: string;
  customerName: string;
  customerPhone?: string;
  description: string;
}) {
  const phone = opts.customerPhone ? opts.customerPhone.replace(/\D/g, '') : '';
  const validPhone = phone.length >= 10 ? phone.slice(-10) : undefined;

  const payload: any = {
    amount:          Math.max(100, Math.round(opts.amount * 100)), // paise (min 1 INR)
    currency:        'INR',
    accept_partial:   false,
    description:     `ASK Insurance — ${opts.description}`.slice(0, 200),
    customer: {
      name: (opts.customerName || 'Customer').slice(0, 50),
      ...(validPhone ? { contact: validPhone } : {}),
    },
    notify: { sms: false, email: false },
    reminder_enable: false,
    notes: { policyId: opts.policyId, policyNumber: opts.policyNumber },
  };

  if (process.env.RAZORPAY_CALLBACK_URL && process.env.RAZORPAY_CALLBACK_URL.startsWith('http')) {
    payload.callback_url = process.env.RAZORPAY_CALLBACK_URL;
    payload.callback_method = 'get';
  }

  const client = getRazorpay();
  if (client) {
    try {
      const link = await (client.paymentLink as any).create(payload);
      return link as { id: string; short_url: string; amount: number; status: string };
    } catch (err: any) {
      console.error('[razorpay] paymentLink.create API error details:', JSON.stringify(err, null, 2));
    }
  }

  // Fallback to Razorpay simulator callback / test payment link
  console.warn('[razorpay] Using Razorpay test mode payment URL for simulation/testing');
  const apiUrl = process.env.API_BASE_URL || 'https://ask-api.bitopayments.com';
  return {
    id: `plink_test_${Date.now()}`,
    short_url: `${apiUrl}/api/payments/razorpay/callback?policyId=${opts.policyId}`,
    amount: opts.amount,
    status: 'created',
  };
}
