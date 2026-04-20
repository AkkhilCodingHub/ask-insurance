import Razorpay from 'razorpay';

export const razorpayClient = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID     ?? '',
  key_secret: process.env.RAZORPAY_KEY_SECRET ?? '',
});

export async function createPaymentLink(opts: {
  amount: number;      // in INR (we convert to paise)
  policyId: string;
  policyNumber: string;
  customerName: string;
  customerPhone: string;
  description: string;
}) {
  const link = await (razorpayClient.paymentLink as any).create({
    amount:      Math.round(opts.amount * 100), // paise
    currency:    'INR',
    accept_partial: false,
    description: opts.description,
    customer: {
      name:    opts.customerName,
      contact: opts.customerPhone,
    },
    notify: { sms: true, email: false },
    reminder_enable: true,
    notes: { policyId: opts.policyId, policyNumber: opts.policyNumber },
  });
  return link as { id: string; short_url: string; amount: number; status: string };
}
