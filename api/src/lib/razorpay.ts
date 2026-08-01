import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

let razorpayClient: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!razorpayClient) {
    const key_id = process.env.RAZORPAY_KEY_ID ?? '';
    const key_secret = process.env.RAZORPAY_KEY_SECRET ?? '';
    if (!key_id || !key_secret) {
      throw new Error('Razorpay is not configured (set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)');
    }
    razorpayClient = new Razorpay({ key_id, key_secret });
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

  try {
    const link = await (getRazorpay().paymentLink as any).create(payload);
    return link as { id: string; short_url: string; amount: number; status: string };
  } catch (err: any) {
    console.error('[razorpay] paymentLink.create API error details:', JSON.stringify(err, null, 2));
    // If Razorpay API credentials or test link fails, fallback to local test payment URL for simulator
    const isTestMode = (process.env.RAZORPAY_KEY_ID || '').startsWith('rzp_test_');
    if (isTestMode) {
      console.warn('[razorpay] Falling back to local Test Mode payment link for simulator/testing');
      return {
        id: `plink_test_${Date.now()}`,
        short_url: `http://localhost:4000/api/payments/razorpay/callback?policyId=${opts.policyId}`,
        amount: opts.amount,
        status: 'created',
      };
    }
    throw err;
  }
}
