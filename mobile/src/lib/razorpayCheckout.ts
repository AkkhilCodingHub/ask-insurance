export function generateRazorpayCheckoutHtml(opts: {
  keyId: string;
  amountPaise: number;
  amountRupees: number;
  policyId: string;
  policyNumber: string;
  proposerName: string;
  phone: string;
  email: string;
  insurer: string;
  policyType: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>ASK Insurance Brokers — Secure Premium Checkout</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background: #0F172A; color: #F8FAFC; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .card { background: #1E293B; border: 1px solid #334155; border-radius: 20px; max-width: 440px; width: 100%; padding: 28px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); text-align: center; }
    .brand-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(15,82,186,0.15); border: 1px solid rgba(15,82,186,0.4); color: #60A5FA; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 700; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 800; color: #FFFFFF; margin-bottom: 4px; }
    .subtitle { font-size: 13px; color: #94A3B8; margin-bottom: 24px; }
    .summary-box { background: #0F172A; border: 1px solid #334155; border-radius: 14px; padding: 16px; text-align: left; margin-bottom: 24px; }
    .summary-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 10px; }
    .summary-row:last-child { margin-bottom: 0; padding-top: 10px; border-top: 1px dashed #334155; }
    .label { color: #94A3B8; }
    .val { color: #F8FAFC; font-weight: 600; text-align: right; }
    .total-val { color: #10B981; font-weight: 800; font-size: 17px; }
    .btn-pay { width: 100%; background: #0F52BA; color: #FFFFFF; border: none; padding: 16px; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 14px rgba(15,82,186,0.4); }
    .btn-pay:active { transform: scale(0.98); opacity: 0.9; }
    .guarantee { font-size: 12px; color: #64748B; margin-top: 16px; display: flex; align-items: center; justify-content: center; gap: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand-badge">
      🛡️ ASK Insurance Brokers
    </div>
    <h1>Direct Broker Checkout</h1>
    <p class="subtitle">IRDAI Reg: 102/2024 · Direct Insurance Broker</p>

    <div class="summary-box">
      <div class="summary-row">
        <span class="label">Policy Schedule:</span>
        <span class="val">${opts.policyNumber}</span>
      </div>
      <div class="summary-row">
        <span class="label">Coverage Type:</span>
        <span class="val">${opts.policyType}</span>
      </div>
      <div class="summary-row">
        <span class="label">Underwriter:</span>
        <span class="val">${opts.insurer}</span>
      </div>
      <div class="summary-row">
        <span class="label">Proposer:</span>
        <span class="val">${opts.proposerName}</span>
      </div>
      <div class="summary-row">
        <span class="label">Total Premium (incl. GST):</span>
        <span class="val total-val">₹${opts.amountRupees.toLocaleString('en-IN')}</span>
      </div>
    </div>

    <button id="pay-btn" class="btn-pay" onclick="launchRazorpay()">
      <span>🔒 Pay ₹${opts.amountRupees.toLocaleString('en-IN')} via Razorpay</span>
    </button>

    <div class="guarantee">
      🔒 256-Bit SSL Encrypted · Official Razorpay Gateway
    </div>
  </div>

  <script>
    function launchRazorpay() {
      var options = {
        key: "${opts.keyId}",
        amount: "${opts.amountPaise}",
        currency: "INR",
        name: "ASK Insurance Brokers",
        description: "${opts.policyType} Insurance — ${opts.insurer}",
        image: "https://ask-api.bitopayments.com/logo.png",
        prefill: {
          name: "${opts.proposerName}",
          email: "${opts.email}",
          contact: "${opts.phone}"
        },
        theme: {
          color: "#0F52BA"
        },
        handler: function (response) {
          window.location.href = 'askinsurance://payment-success?policyId=${opts.policyId}&paymentId=' + (response.razorpay_payment_id || 'pay_demo');
        },
        modal: {
          ondismiss: function() {
            window.location.href = 'askinsurance://payment-cancelled?policyId=${opts.policyId}';
          }
        }
      };
      var rzp = new Razorpay(options);
      rzp.open();
    }

    window.addEventListener('DOMContentLoaded', function() {
      setTimeout(launchRazorpay, 300);
    });
  </script>
</body>
</html>`;
}
