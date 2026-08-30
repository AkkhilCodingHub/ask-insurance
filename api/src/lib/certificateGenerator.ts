export interface PolicyCertificateData {
  policyNumber: string;
  type: string;
  provider: string;
  sumInsured: number;
  premium: number;
  startDate: Date | string;
  endDate: Date | string;
  paymentStatus: string;
  registrationNumber?: string | null;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  userAddress?: string;
  customerCode?: string;
}

export interface PospCertificateData {
  applicationNumber: string;
  name: string;
  phone: string;
  email: string;
  panNumber: string;
  aadhaarNumber: string;
  examScore: number;
  examPassedAt: Date | string;
  agentCode?: string;
  approvedAt?: Date | string;
}

  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function fmtMoney(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function fmtDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function generatePolicyCertificateHtml(data: PolicyCertificateData): string {
  const gst = Math.round(data.premium * 0.18);
  const net = data.premium - gst;
  const issueDate = fmtDate(data.startDate);
  const expiryDate = fmtDate(data.endDate);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Policy Certificate - ${escapeHtml(data.policyNumber)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
    body { background: #0F172A; color: #1E293B; padding: 24px; display: flex; justify-content: center; }
    .page { background: #FFFFFF; width: 100%; max-width: 800px; padding: 40px; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); position: relative; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #E2E8F0; padding-bottom: 24px; margin-bottom: 24px; }
    .brand-title { font-size: 24px; font-weight: 900; color: #0284C7; letter-spacing: -0.5px; }
    .brand-sub { font-size: 11px; color: #64748B; margin-top: 4px; font-weight: 500; }
    .badge { background: #ECFDF5; border: 1px solid #10B981; color: #047857; font-size: 12px; font-weight: 800; padding: 6px 14px; border-radius: 999px; text-transform: uppercase; }
    .title-banner { background: linear-gradient(135deg, #0284C7, #0369A1); color: #FFFFFF; padding: 14px 20px; border-radius: 8px; font-size: 16px; font-weight: 800; text-align: center; margin-bottom: 24px; letter-spacing: 0.5px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 18px; }
    .card-title { font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
    .row:last-child { margin-bottom: 0; }
    .lbl { color: #64748B; font-weight: 500; }
    .val { color: #0F172A; font-weight: 700; }
    .premium-box { background: #F0F9FF; border: 1.5px solid #0284C7; border-radius: 8px; padding: 18px; margin-bottom: 24px; }
    .total-row { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #BAE6FD; padding-top: 10px; margin-top: 10px; font-size: 16px; font-weight: 900; color: #0284C7; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 2px solid #E2E8F0; padding-top: 24px; margin-top: 24px; }
    .legal { font-size: 10px; color: #94A3B8; max-width: 450px; line-height: 1.5; }
    .sign-box { text-align: right; }
    .stamp { width: 100px; height: 100px; border: 2px dashed #0284C7; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #0284C7; font-weight: 800; font-size: 10px; text-align: center; margin-bottom: 8px; margin-left: auto; }
    .print-btn { background: #0284C7; color: #FFFFFF; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; position: fixed; bottom: 20px; right: 20px; box-shadow: 0 10px 20px rgba(2,132,199,0.4); }
    @media print { .print-btn { display: none; } body { padding: 0; background: #FFF; } .page { box-shadow: none; max-width: 100%; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div class="brand-title">ASK INSURANCE BROKERS</div>
        <div class="brand-sub">IRDAI Direct Broker License: IRDAI/DB 792/19 | CIN: U66010DL2018PTC334589</div>
        <div class="brand-sub">Regd. Office: ASK Tower, B-4 Netaji Subhash Place, Pitampura, New Delhi - 110034</div>
      </div>
      <div class="badge">Certificate of Insurance</div>
    </div>

    <div class="title-banner">
      OFFICIAL CERTIFICATE OF INSURANCE SCHEDULE
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-title">Policyholder Details</div>
        <div class="row"><span class="lbl">Insured Name:</span><span class="val">${escapeHtml(data.userName || 'Valued Customer')}</span></div>
        <div class="row"><span class="lbl">Customer Code:</span><span class="val">${escapeHtml(data.customerCode || '—')}</span></div>
        <div class="row"><span class="lbl">Contact Phone:</span><span class="val">+91 ${escapeHtml(data.userPhone || '—')}</span></div>
        <div class="row"><span class="lbl">Email Address:</span><span class="val">${escapeHtml(data.userEmail || '—')}</span></div>
        <div class="row"><span class="lbl">Address:</span><span class="val">${escapeHtml(data.userAddress || 'Registered on File')}</span></div>
      </div>

      <div class="card">
        <div class="card-title">Coverage & Insurer Details</div>
        <div class="row"><span class="lbl">Policy Number:</span><span class="val" style="color: #0284C7;">${escapeHtml(data.policyNumber)}</span></div>
        <div class="row"><span class="lbl">Insurance Provider:</span><span class="val">${escapeHtml(data.provider)}</span></div>
        <div class="row"><span class="lbl">Policy Type:</span><span class="val" style="text-transform: capitalize;">${escapeHtml(data.type)} Insurance</span></div>
        ${data.registrationNumber ? `<div class="row"><span class="lbl">Registration No:</span><span class="val">${escapeHtml(data.registrationNumber)}</span></div>` : ''}
        <div class="row"><span class="lbl">Sum Insured:</span><span class="val" style="color: #059669;">${fmtMoney(data.sumInsured)}</span></div>
        <div class="row"><span class="lbl">Period of Insurance:</span><span class="val">${escapeHtml(issueDate)} to ${escapeHtml(expiryDate)}</span></div>
        <div class="row"><span class="lbl">Status:</span><span class="val" style="color: #059669; text-transform: uppercase;">● ${escapeHtml(data.paymentStatus)}</span></div>
      </div>
    </div>

    <div class="premium-box">
      <div class="card-title" style="border: none; margin-bottom: 8px;">Premium Calculation (INR)</div>
      <div class="row"><span class="lbl">Net Premium:</span><span class="val">${fmtMoney(net)}</span></div>
      <div class="row"><span class="lbl">Integrated GST (18%):</span><span class="val">${fmtMoney(gst)}</span></div>
      <div class="total-row">
        <span>Total Premium Paid:</span>
        <span>${fmtMoney(data.premium)}</span>
      </div>
    </div>

    <div class="footer">
      <div class="legal">
        <strong>Important Notice:</strong> This Certificate of Insurance is issued subject to the terms, conditions, and exclusions of the original Policy Document issued by ${escapeHtml(data.provider)}. For 24x7 cashless claims assistance, call toll-free 1800-ASK-INS or email claims@askinsurancebrokers.in.
      </div>
      <div class="sign-box">
        <div class="stamp">
          <div>ASK BROKERS</div>
          <div>★ IRDAI ★</div>
          <div>REGISTERED</div>
        </div>
        <div style="font-size:11px; font-weight:700; color:#475569;">Authorized Signatory</div>
      </div>
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">🖨️ Print / Download PDF</button>
</body>
</html>`;
}

export function generatePospCertificateHtml(data: PospCertificateData): string {
  const issueDate = fmtDate(data.examPassedAt || new Date());
  const expiryDate = fmtDate(new Date(new Date(data.examPassedAt || new Date()).getTime() + 3 * 365 * 24 * 60 * 60 * 1000));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>POSP Certificate - ${escapeHtml(data.name)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0F172A; color: #1E293B; font-family: 'Inter', sans-serif; padding: 24px; display: flex; justify-content: center; }
    .cert-frame { background: #FFFFFF; width: 100%; max-width: 850px; padding: 48px; border: 8px double #0284C7; border-radius: 16px; box-shadow: 0 25px 50px rgba(0,0,0,0.35); text-align: center; position: relative; }
    .cert-header { font-family: 'Cinzel', serif; font-size: 26px; font-weight: 900; color: #0369A1; letter-spacing: 2px; margin-bottom: 4px; }
    .cert-sub { font-size: 12px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 24px; }
    .cert-title { font-family: 'Cinzel', serif; font-size: 22px; font-weight: 700; color: #0F172A; border-top: 1px solid #E2E8F0; border-bottom: 1px solid #E2E8F0; padding: 12px 0; margin-bottom: 24px; }
    .presented-to { font-size: 14px; color: #64748B; font-style: italic; margin-bottom: 12px; }
    .candidate-name { font-size: 28px; font-weight: 900; color: #0284C7; margin-bottom: 16px; letter-spacing: -0.5px; }
    .cert-body { font-size: 14px; color: #334155; line-height: 1.8; max-width: 680px; margin: 0 auto 32px auto; }
    .meta-box { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px; margin-bottom: 32px; text-align: left; }
    .meta-item { font-size: 12px; }
    .meta-lbl { color: #64748B; font-weight: 500; margin-bottom: 2px; }
    .meta-val { color: #0F172A; font-weight: 700; }
    .cert-footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 24px; border-top: 1px solid #E2E8F0; }
    .stamp { width: 110px; height: 110px; border: 3px double #0284C7; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #0284C7; font-weight: 800; font-size: 10px; }
    .print-btn { background: #0284C7; color: #FFFFFF; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; position: fixed; bottom: 20px; right: 20px; box-shadow: 0 10px 20px rgba(2,132,199,0.4); }
    @media print { .print-btn { display: none; } body { padding: 0; background: #FFF; } .cert-frame { box-shadow: none; border-width: 4px; padding: 24px; } }
  </style>
</head>
<body>
  <div class="cert-frame">
    <div class="cert-header">ASK INSURANCE BROKERS PVT. LTD.</div>
    <div class="cert-sub">IRDAI Registered Direct Insurance Broker | License No: IRDAI/DB 792/19</div>

    <div class="cert-title">CERTIFICATE OF APPOINTMENT (POSP)</div>
    <div class="presented-to">This is to officially certify that</div>
    <div class="candidate-name">${escapeHtml(data.name.toUpperCase())}</div>

    <div class="cert-body">
      has successfully completed the mandatory training and passed the <strong>IC-38 POSP Examination</strong> with a score of <strong>${escapeHtml(data.examScore)}/50</strong> in compliance with the guidelines laid down by the <strong>Insurance Regulatory and Development Authority of India (IRDAI)</strong>.
      <br><br>
      The candidate is hereby officially authorized and appointed as a <strong>Point of Sales Person (POSP - Life & General Insurance)</strong> to solicit and procure retail insurance policies on behalf of ASK Insurance Brokers Pvt. Ltd.
    </div>

    <div class="meta-box">
      <div class="meta-item">
        <div class="meta-lbl">Agent / POSP Code:</div>
        <div class="meta-val">${escapeHtml(data.agentCode || data.applicationNumber)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-lbl">Certificate Issue Date:</div>
        <div class="meta-val">${escapeHtml(issueDate)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-lbl">Validity:</div>
        <div class="meta-val">${escapeHtml(issueDate)} to ${escapeHtml(expiryDate)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-lbl">PAN Number:</div>
        <div class="meta-val">${escapeHtml(data.panNumber)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-lbl">Mobile Number:</div>
        <div class="meta-val">+91 ${escapeHtml(data.phone)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-lbl">Accreditation:</div>
        <div class="meta-val" style="color:#059669;">IRDAI APPROVED</div>
      </div>
    </div>

    <div class="cert-footer">
      <div style="text-align:left; font-size:11px; color:#64748B;">
        <strong>ASK Insurance Brokers Pvt. Ltd.</strong><br>
        Principal Officer / Compliance Officer<br>
        Reg No: IRDAI/DB 792/19
      </div>
      <div class="stamp">
        <div>IRDAI / POSP</div>
        <div>★ VERIFIED ★</div>
        <div>ASK BROKERS</div>
      </div>
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">🖨️ Print / Download POSP Certificate</button>
</body>
</html>`;
}

export interface QuoteAcknowledgementData {
  quoteId: string;
  type: string;
  status: string;
  createdAt: Date | string;
  expiresAt?: Date | string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  details: Record<string, any>;
  adminResponse?: {
    insurer: string;
    planName: string;
    netPremium: number;
    gst: number;
    totalPremium: number;
    notes?: string;
  } | null;
}

export function generateQuoteAcknowledgementHtml(data: QuoteAcknowledgementData): string {
  const submitDate = fmtDate(data.createdAt);
  const expiryDate = data.expiresAt ? fmtDate(data.expiresAt) : fmtDate(new Date(new Date(data.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000));
  const coverAmount = data.details?.sumInsured || data.details?.idv || data.details?.assetValue || 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quote Acknowledgement - ${escapeHtml(data.quoteId)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
    body { background: #0F172A; color: #1E293B; padding: 24px; display: flex; justify-content: center; }
    .page { background: #FFFFFF; width: 100%; max-width: 800px; padding: 36px; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); position: relative; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #E2E8F0; padding-bottom: 20px; margin-bottom: 20px; }
    .brand-title { font-size: 22px; font-weight: 900; color: #0284C7; letter-spacing: -0.5px; }
    .brand-sub { font-size: 11px; color: #64748B; margin-top: 4px; font-weight: 500; }
    .badge { background: #FEF3C7; border: 1px solid #F59E0B; color: #B45309; font-size: 12px; font-weight: 800; padding: 6px 14px; border-radius: 999px; text-transform: uppercase; }
    .title-banner { background: linear-gradient(135deg, #0F766E, #0E7490); color: #FFFFFF; padding: 14px 20px; border-radius: 8px; font-size: 15px; font-weight: 800; text-align: center; margin-bottom: 20px; letter-spacing: 0.5px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; }
    .card-title { font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; }
    .row:last-child { margin-bottom: 0; }
    .lbl { color: #64748B; font-weight: 500; }
    .val { color: #0F172A; font-weight: 700; }
    .highlight-box { background: #F0F9FF; border: 1.5px solid #0284C7; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
    .advisor-quote-card { background: #ECFDF5; border: 1.5px solid #10B981; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 2px solid #E2E8F0; padding-top: 20px; margin-top: 20px; }
    .legal { font-size: 10px; color: #94A3B8; max-width: 480px; line-height: 1.5; }
    .stamp { width: 95px; height: 95px; border: 2px dashed #0E7490; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #0E7490; font-weight: 800; font-size: 9px; text-align: center; }
    .print-btn { background: #0284C7; color: #FFFFFF; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; position: fixed; bottom: 20px; right: 20px; box-shadow: 0 10px 20px rgba(2,132,199,0.4); }
    @media print { .print-btn { display: none; } body { padding: 0; background: #FFF; } .page { box-shadow: none; max-width: 100%; padding: 20px; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div class="brand-title">ASK INSURANCE BROKERS</div>
        <div class="brand-sub">IRDAI Direct Broker License: IRDAI/DB 792/19 | CIN: U66010DL2018PTC334589</div>
        <div class="brand-sub">Regd. Office: ASK Tower, B-4 Netaji Subhash Place, Pitampura, New Delhi - 110034</div>
      </div>
      <div class="badge">Quote Request Slip</div>
    </div>

    <div class="title-banner">
      OFFICIAL QUOTE REQUEST ACKNOWLEDGEMENT SLIP
    </div>

    <div class="highlight-box">
      <div style="font-size: 13px; font-weight: 800; color: #0369A1; margin-bottom: 6px;">
        📌 Reference: REQ-${escapeHtml(data.quoteId.slice(0, 12).toUpperCase())}
      </div>
      <div style="font-size: 12px; color: #334155; line-height: 1.5;">
        Thank you for choosing ASK Insurance. Your insurance requirement has been registered in our central underwriting queue. A certified insurance advisor is comparing quotes from 38+ IRDAI approved insurers for you.
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-title">Applicant Details</div>
        <div class="row"><span class="lbl">Name:</span><span class="val">${escapeHtml(data.userName || 'Customer')}</span></div>
        <div class="row"><span class="lbl">Mobile Phone:</span><span class="val">+91 ${escapeHtml(data.userPhone || '—')}</span></div>
        <div class="row"><span class="lbl">Email:</span><span class="val">${escapeHtml(data.userEmail || '—')}</span></div>
        <div class="row"><span class="lbl">Submitted On:</span><span class="val">${escapeHtml(submitDate)}</span></div>
        <div class="row"><span class="lbl">Quote Valid Until:</span><span class="val">${escapeHtml(expiryDate)}</span></div>
      </div>

      <div class="card">
        <div class="card-title">Coverage & Requirement Specs</div>
        <div class="row"><span class="lbl">Insurance Type:</span><span class="val" style="text-transform: capitalize;">${escapeHtml(data.type)} Insurance</span></div>
        ${data.details?.registrationNumber ? `<div class="row"><span class="lbl">Vehicle Reg No:</span><span class="val">${escapeHtml(data.details.registrationNumber)}</span></div>` : ''}
        ${data.details?.make ? `<div class="row"><span class="lbl">Make & Model:</span><span class="val">${escapeHtml(data.details.make)} ${escapeHtml(data.details.model || '')}</span></div>` : ''}
        ${data.details?.registrationYear ? `<div class="row"><span class="lbl">Reg Year / Fuel:</span><span class="val">${escapeHtml(data.details.registrationYear)} (${escapeHtml(data.details.fuelType || 'Petrol')})</span></div>` : ''}
        ${coverAmount ? `<div class="row"><span class="lbl">Target Sum Insured:</span><span class="val" style="color: #0284C7;">${fmtMoney(coverAmount)}</span></div>` : ''}
        ${data.details?.ncbPercentage ? `<div class="row"><span class="lbl">NCB Rollover:</span><span class="val" style="color: #059669;">${escapeHtml(data.details.ncbPercentage)}%</span></div>` : ''}
      </div>
    </div>

    ${data.adminResponse ? `
    <div class="advisor-quote-card">
      <div style="font-size: 13px; font-weight: 800; color: #047857; margin-bottom: 8px;">
        ✓ Advisor Proposed Quote Available
      </div>
      <div class="row"><span class="lbl">Recommended Insurer:</span><span class="val">${escapeHtml(data.adminResponse.insurer)}</span></div>
      <div class="row"><span class="lbl">Plan Name:</span><span class="val">${escapeHtml(data.adminResponse.planName)}</span></div>
      <div class="row"><span class="lbl">Annual Premium (incl. GST):</span><span class="val" style="color: #047857; font-size: 14px;">${fmtMoney(data.adminResponse.totalPremium)}</span></div>
      ${data.adminResponse.notes ? `<div class="row"><span class="lbl">Advisor Remarks:</span><span class="val">"${escapeHtml(data.adminResponse.notes)}"</span></div>` : ''}
    </div>
    ` : ''}

    <div class="footer">
      <div class="legal">
        <strong>Notice:</strong> This acknowledgement slip certifies that your insurance request is under review. Premium amounts are indicative until final policy binding and payment. For support or immediate quote assistance, contact 1800-ASK-INS or email quotes@askinsurancebrokers.in.
      </div>
      <div class="sign-box">
        <div class="stamp">
          <div>ASK BROKERS</div>
          <div>★ UNDERWRITING ★</div>
          <div>INSPECTION QUEUE</div>
        </div>
        <div style="font-size:10px; font-weight:700; color:#475569; text-align:center; margin-top:4px;">Customer Helpdesk</div>
      </div>
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">🖨️ Print / Download Slip</button>
</body>
</html>`;
}

