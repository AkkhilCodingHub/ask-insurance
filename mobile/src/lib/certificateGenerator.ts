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
  <title>Policy Certificate - ${data.policyNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
    body { background: #0F172A; color: #1E293B; padding: 20px; display: flex; justify-content: center; }
    .page { background: #FFFFFF; width: 100%; max-width: 800px; padding: 32px; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); position: relative; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #E2E8F0; padding-bottom: 20px; margin-bottom: 20px; }
    .brand-title { font-size: 24px; font-weight: 900; color: #0284C7; letter-spacing: -0.5px; }
    .brand-sub { font-size: 11px; color: #64748B; margin-top: 4px; font-weight: 500; }
    .badge { background: #ECFDF5; border: 1px solid #10B981; color: #047857; font-size: 12px; font-weight: 800; padding: 6px 14px; border-radius: 999px; text-transform: uppercase; }
    .title-banner { background: linear-gradient(135deg, #0284C7, #0369A1); color: #FFFFFF; padding: 12px 18px; border-radius: 8px; font-size: 15px; font-weight: 800; text-align: center; margin-bottom: 20px; letter-spacing: 0.5px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
    .card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px; }
    .card-title { font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; }
    .row:last-child { margin-bottom: 0; }
    .lbl { color: #64748B; font-weight: 500; }
    .val { color: #0F172A; font-weight: 700; }
    .premium-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .premium-table th, .premium-table td { padding: 10px 14px; text-align: left; font-size: 12px; border-bottom: 1px solid #E2E8F0; }
    .premium-table th { background: #F1F5F9; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 11px; }
    .premium-table tr.total { font-weight: 900; background: #F8FAFC; }
    .premium-table tr.total td { color: #0284C7; font-size: 14px; }
    .footer { border-top: 2px solid #E2E8F0; padding-top: 16px; margin-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .stamp-box { border: 2px dashed #0284C7; border-radius: 8px; padding: 10px 14px; text-align: center; color: #0284C7; }
    .stamp-title { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
    .stamp-sub { font-size: 9px; color: #64748B; margin-top: 2px; }
    .legal { font-size: 10px; color: #94A3B8; max-width: 450px; line-height: 1.4; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div class="brand-title">ASK INSURANCE</div>
        <div class="brand-sub">IRDAI Reg. No: 102/2024 · CIN: U66010DL2024PTC001234</div>
      </div>
      <div>
        <span class="badge">✓ ${data.paymentStatus === 'paid' ? 'Active & Paid' : 'Pending Activation'}</span>
      </div>
    </div>

    <div class="title-banner">
      CERTIFICATE OF INSURANCE & SCHEDULE
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-title">Policy & Coverage Details</div>
        <div class="row"><span class="lbl">Policy Number:</span><span class="val">${data.policyNumber}</span></div>
        <div class="row"><span class="lbl">Category:</span><span class="val" style="text-transform: capitalize;">${data.type} Insurance</span></div>
        <div class="row"><span class="lbl">Underwriter / Insurer:</span><span class="val">${data.provider}</span></div>
        <div class="row"><span class="lbl">Sum Insured:</span><span class="val" style="color: #0284C7;">${fmtMoney(data.sumInsured)}</span></div>
        ${data.registrationNumber ? `<div class="row"><span class="lbl">Vehicle Registration:</span><span class="val">${data.registrationNumber}</span></div>` : ''}
        <div class="row"><span class="lbl">Inception Date:</span><span class="val">${issueDate}</span></div>
        <div class="row"><span class="lbl">Expiry Date:</span><span class="val">${expiryDate}</span></div>
      </div>

      <div class="card">
        <div class="card-title">Policyholder / Insured Details</div>
        <div class="row"><span class="lbl">Insured Name:</span><span class="val">${data.userName || 'Valued Customer'}</span></div>
        <div class="row"><span class="lbl">Customer ID:</span><span class="val">${data.customerCode || 'ASK-CUST-8807'}</span></div>
        <div class="row"><span class="lbl">Contact Mobile:</span><span class="val">${data.userPhone || '—'}</span></div>
        <div class="row"><span class="lbl">Email Address:</span><span class="val">${data.userEmail || '—'}</span></div>
        <div class="row"><span class="lbl">Communication Address:</span><span class="val">${data.userAddress || 'New Delhi, India'}</span></div>
      </div>
    </div>

    <table class="premium-table">
      <thead>
        <tr>
          <th>Item Description</th>
          <th>Rate / Basis</th>
          <th style="text-align: right;">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Basic Cover Premium (${data.type})</td>
          <td>Annual Standard</td>
          <td style="text-align: right;">${fmtMoney(net)}</td>
        </tr>
        <tr>
          <td>Integrated GST (IGST @ 18%)</td>
          <td>Standard Tax</td>
          <td style="text-align: right;">${fmtMoney(gst)}</td>
        </tr>
        <tr class="total">
          <td colspan="2">TOTAL PREMIUM PAID</td>
          <td style="text-align: right;">${fmtMoney(data.premium)}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <div class="legal">
        This document is an electronically generated certificate under the Information Technology Act, 2000 and valid under IRDAI regulations. No physical signature is required. For claims assistance, call 1800-ASK-INSURE or tap File Claim in the mobile app.
      </div>
      <div class="stamp-box">
        <div class="stamp-title">ASK INSURANCE</div>
        <div class="stamp-sub">Digitally Signed & Verified</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function generatePospCertificateHtml(data: PospCertificateData): string {
  const passDate = fmtDate(data.examPassedAt);
  const certDate = data.approvedAt ? fmtDate(data.approvedAt) : passDate;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>POSP Certificate - ${data.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0B132B; font-family: 'Inter', sans-serif; padding: 20px; display: flex; justify-content: center; }
    .cert-frame { background: #FFFFFF; max-width: 850px; width: 100%; border: 12px solid #1C2541; padding: 36px; border-radius: 4px; box-shadow: 0 25px 50px rgba(0,0,0,0.5); position: relative; }
    .cert-inner { border: 2px solid #B8860B; padding: 28px; text-align: center; }
    .head-logo { font-family: 'Cinzel', serif; font-size: 26px; font-weight: 900; color: #0284C7; letter-spacing: 2px; }
    .head-tag { font-size: 11px; color: #64748B; text-transform: uppercase; margin-top: 4px; letter-spacing: 1px; }
    .cert-title { font-family: 'Cinzel', serif; font-size: 24px; font-weight: 700; color: #B8860B; margin: 20px 0 10px; }
    .cert-subtitle { font-size: 13px; color: #475569; margin-bottom: 20px; }
    .recipient-name { font-size: 24px; font-weight: 900; color: #0F172A; text-decoration: underline; text-decoration-color: #B8860B; margin: 12px 0; }
    .cert-text { font-size: 13px; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto 24px; }
    .grid-info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 14px; border-radius: 8px; margin-bottom: 24px; text-align: left; }
    .info-lbl { font-size: 10px; color: #64748B; font-weight: 600; text-transform: uppercase; }
    .info-val { font-size: 12px; color: #0F172A; font-weight: 700; margin-top: 2px; }
    .signatures { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; padding: 0 20px; }
    .sig-block { text-align: center; }
    .sig-line { width: 140px; height: 1px; background: #94A3B8; margin: 0 auto 6px; }
    .sig-name { font-size: 11px; font-weight: 700; color: #1E293B; }
    .sig-title { font-size: 10px; color: #64748B; }
    .gold-seal { width: 70px; height: 70px; border-radius: 50%; background: radial-gradient(circle, #FFD700, #B8860B); display: flex; align-items: center; justify-content: center; color: #000; font-weight: 900; font-size: 10px; text-align: center; border: 3px dashed #FFF; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
  </style>
</head>
<body>
  <div class="cert-frame">
    <div class="cert-inner">
      <div class="head-logo">ASK INSURANCE</div>
      <div class="head-tag">Recognized by Insurance Regulatory and Development Authority of India (IRDAI)</div>
      
      <div class="cert-title">CERTIFICATE OF APPOINTMENT</div>
      <div class="cert-subtitle">Point of Sales Person (POSP - Life & General Insurance)</div>

      <p style="font-size: 12px; color: #64748B;">This is to officially certify that</p>
      <div class="recipient-name">${data.name}</div>

      <div class="cert-text">
        has successfully fulfilled all regulatory requirements, passed the prescribed IRDAI POSP certification examination with a merit score of <strong>${data.examScore}%</strong>, and is hereby appointed as an authorized Point of Sales Person (POSP).
      </div>

      <div class="grid-info">
        <div><div class="info-lbl">Agent / POSP Code</div><div class="info-val" style="color: #0284C7;">${data.agentCode || 'POSP-' + data.phone.slice(-6)}</div></div>
        <div><div class="info-lbl">Application No.</div><div class="info-val">${data.applicationNumber}</div></div>
        <div><div class="info-lbl">PAN / Aadhaar Ref</div><div class="info-val">${data.panNumber} / ••••${data.aadhaarNumber.slice(-4)}</div></div>
        <div><div class="info-lbl">Issue Date</div><div class="info-val">${certDate}</div></div>
        <div><div class="info-lbl">Validity</div><div class="info-val">Permanent / Subject to Compliance</div></div>
        <div><div class="info-lbl">Exam Status</div><div class="info-val" style="color: #047857;">PASSED (${passDate})</div></div>
      </div>

      <div class="signatures">
        <div class="sig-block">
          <div class="sig-line"></div>
          <div class="sig-name">Principal Officer</div>
          <div class="sig-title">ASK Insurance POSP Board</div>
        </div>

        <div class="gold-seal">
          IRDAI<br>VALIDATED
        </div>

        <div class="sig-block">
          <div class="sig-line"></div>
          <div class="sig-name">Compliance Head</div>
          <div class="sig-title">Regulatory Authority</div>
        </div>
      </div>
    </div>
  </div>
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
  <title>Quote Acknowledgement - ${data.quoteId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
    body { background: #0F172A; color: #1E293B; padding: 20px; display: flex; justify-content: center; }
    .page { background: #FFFFFF; width: 100%; max-width: 800px; padding: 32px; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); position: relative; }
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
        📌 Reference: REQ-${data.quoteId.slice(0, 12).toUpperCase()}
      </div>
      <div style="font-size: 12px; color: #334155; line-height: 1.5;">
        Thank you for choosing ASK Insurance. Your insurance requirement has been registered in our central underwriting queue. A certified insurance advisor is comparing quotes from 38+ IRDAI approved insurers for you.
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-title">Applicant Details</div>
        <div class="row"><span class="lbl">Name:</span><span class="val">${data.userName || 'Customer'}</span></div>
        <div class="row"><span class="lbl">Mobile Phone:</span><span class="val">+91 ${data.userPhone || '—'}</span></div>
        <div class="row"><span class="lbl">Email:</span><span class="val">${data.userEmail || '—'}</span></div>
        <div class="row"><span class="lbl">Submitted On:</span><span class="val">${submitDate}</span></div>
        <div class="row"><span class="lbl">Quote Valid Until:</span><span class="val">${expiryDate}</span></div>
      </div>

      <div class="card">
        <div class="card-title">Coverage & Requirement Specs</div>
        <div class="row"><span class="lbl">Insurance Type:</span><span class="val" style="text-transform: capitalize;">${data.type} Insurance</span></div>
        ${data.details?.registrationNumber ? `<div class="row"><span class="lbl">Vehicle Reg No:</span><span class="val">${data.details.registrationNumber}</span></div>` : ''}
        ${data.details?.make ? `<div class="row"><span class="lbl">Make & Model:</span><span class="val">${data.details.make} ${data.details.model || ''}</span></div>` : ''}
        ${data.details?.registrationYear ? `<div class="row"><span class="lbl">Reg Year / Fuel:</span><span class="val">${data.details.registrationYear} (${data.details.fuelType || 'Petrol'})</span></div>` : ''}
        ${coverAmount ? `<div class="row"><span class="lbl">Target Sum Insured:</span><span class="val" style="color: #0284C7;">${fmtMoney(coverAmount)}</span></div>` : ''}
        ${data.details?.ncbPercentage ? `<div class="row"><span class="lbl">NCB Rollover:</span><span class="val" style="color: #059669;">${data.details.ncbPercentage}%</span></div>` : ''}
      </div>
    </div>

    ${data.adminResponse ? `
    <div class="advisor-quote-card">
      <div style="font-size: 13px; font-weight: 800; color: #047857; margin-bottom: 8px;">
        ✓ Advisor Proposed Quote Available
      </div>
      <div class="row"><span class="lbl">Recommended Insurer:</span><span class="val">${data.adminResponse.insurer}</span></div>
      <div class="row"><span class="lbl">Plan Name:</span><span class="val">${data.adminResponse.planName}</span></div>
      <div class="row"><span class="lbl">Annual Premium (incl. GST):</span><span class="val" style="color: #047857; font-size: 14px;">${fmtMoney(data.adminResponse.totalPremium)}</span></div>
      ${data.adminResponse.notes ? `<div class="row"><span class="lbl">Advisor Remarks:</span><span class="val">"${data.adminResponse.notes}"</span></div>` : ''}
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

