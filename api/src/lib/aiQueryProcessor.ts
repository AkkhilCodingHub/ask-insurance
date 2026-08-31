import { prisma } from './prisma';

export interface UserContext {
  customerCode?: string | null;
  name?: string | null;
  phone?: string;
  email?: string | null;
  policiesCount: number;
  vehiclesCount: number;
  openClaimsCount: number;
  activePolicies: Array<{
    policyNumber: string;
    type: string;
    provider: string;
    sumInsured: number;
    status: string;
    registrationNumber?: string | null;
  }>;
  vehicles: Array<{
    registrationNumber: string;
    vehicleType: string;
    make?: string | null;
    model?: string | null;
    ncbPercentage?: number | null;
  }>;
  claims: Array<{
    claimNumber: string;
    type: string;
    amount: number;
    status: string;
  }>;
}

export type QueryIntent = 
  | 'MOTOR_QUOTE_NCB'
  | 'POLICY_ENDORSEMENT'
  | 'CLAIMS_HELP'
  | 'HEALTH_LIFE_COVERAGE'
  | 'GENERAL_INSURANCE_FAQ';

/**
 * Fetch and construct comprehensive user context for AI prompt enrichment.
 */
export async function buildUserContext(userId: string): Promise<UserContext> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        policies: {
          where: { status: 'active' },
          select: {
            policyNumber: true,
            type: true,
            provider: true,
            sumInsured: true,
            status: true,
            registrationNumber: true,
          },
          take: 5,
        },
        vehicles: {
          select: {
            registrationNumber: true,
            vehicleType: true,
            make: true,
            model: true,
            ncbPercentage: true,
          },
          take: 5,
        },
        claims: {
          select: {
            claimNumber: true,
            type: true,
            amount: true,
            status: true,
          },
          take: 5,
        },
      },
    });

    if (!user) {
      return {
        policiesCount: 0,
        vehiclesCount: 0,
        openClaimsCount: 0,
        activePolicies: [],
        vehicles: [],
        claims: [],
      };
    }

    const openClaimsCount = user.claims.filter(c => c.status === 'pending' || c.status === 'approved').length;

    return {
      customerCode: user.customerCode,
      name: user.name,
      phone: user.phone,
      email: user.email,
      policiesCount: user.policies.length,
      vehiclesCount: user.vehicles.length,
      openClaimsCount,
      activePolicies: user.policies,
      vehicles: user.vehicles,
      claims: user.claims,
    };
  } catch (err) {
    console.warn('[buildUserContext] DB query error, using empty context:', err);
    return {
      policiesCount: 0,
      vehiclesCount: 0,
      openClaimsCount: 0,
      activePolicies: [],
      vehicles: [],
      claims: [],
    };
  }
}

/**
 * Classify user's query intent into core insurance domain categories.
 */
export function classifyQueryIntent(query: string): QueryIntent {
  const q = query.toLowerCase();

  if (q.includes('claim') || q.includes('accident') || q.includes('hospitalization') || q.includes('reimbursement') || q.includes('settlement')) {
    return 'CLAIMS_HELP';
  }
  if (q.includes('ncb') || q.includes('bonus') || q.includes('vehicle') || q.includes('car') || q.includes('bike') || q.includes('motor') || q.includes('quote') || q.includes('registration')) {
    return 'MOTOR_QUOTE_NCB';
  }
  if (q.includes('endorse') || q.includes('change name') || q.includes('update address') || q.includes('correction') || q.includes('revise')) {
    return 'POLICY_ENDORSEMENT';
  }
  if (q.includes('health') || q.includes('life') || q.includes('term') || q.includes('cover') || q.includes('family') || q.includes('floater')) {
    return 'HEALTH_LIFE_COVERAGE';
  }
  return 'GENERAL_INSURANCE_FAQ';
}

/**
 * Formats the AI response guaranteeing structured, readable Markdown with key advice and call-to-actions.
 */
export function formatAIResponse(
  intent: QueryIntent,
  _query: string,
  rawText: string,
  context?: UserContext
): string {
  let formatted = rawText.trim();

  // If raw response is minimal or generic, wrap with domain specific guidance
  if (!formatted.startsWith('#') && !formatted.startsWith('**')) {
    formatted = `### 🤖 ASK Insurance AI Assistant Advice\n\n${formatted}`;
  }

  // Append specific advice badges based on intent & user context
  if (intent === 'MOTOR_QUOTE_NCB') {
    if (context && context.vehicles && context.vehicles[0]) {
      const v = context.vehicles[0];
      formatted += `\n\n> 💡 **Registered Vehicle Snapshot**: ${v.make ?? ''} ${v.model ?? ''} (${v.registrationNumber}) | Current NCB: **${v.ncbPercentage ?? 0}%**`;
    }
    formatted += `\n\n--- \n📌 **Next Steps**: You can compare motor plans or verify NCB status directly under **Sell / Motor Insurance**.`;
  } else if (intent === 'CLAIMS_HELP') {
    formatted += `\n\n--- \n📌 **Fast Action**: Need to submit evidence or track a claim? Navigate to the **Claims** tab in the mobile app or web portal.`;
  } else if (intent === 'POLICY_ENDORSEMENT') {
    formatted += `\n\n--- \n📌 **Endorsement Requests**: Non-financial changes (Name, Address, Reg No.) can be submitted directly for POSP & Admin review.`;
  }

  return formatted;
}

/**
 * Intelligent Rule-Based Engine Fallback for offline or API key missing scenarios.
 */
export function generateFallbackResponse(
  intent: QueryIntent,
  _query: string,
  context?: UserContext
): string {
  const userName = context?.name ?? 'Valued Customer';

  switch (intent) {
    case 'MOTOR_QUOTE_NCB': {
      let msg = `### 🚘 Motor Insurance & No Claim Bonus (NCB) Guide\n\nHello **${userName}**! Here is what you need to know regarding motor insurance & NCB:\n\n` +
        `- **What is NCB?**: No Claim Bonus is a discount given on Renewal Premium (ranging from 20% up to 50%) for every claim-free year.\n` +
        `- **NCB Discrepancy Alert**: Declaring an incorrect NCB when you have made a claim in the previous year can lead to policy rejection or claim repudiation during verification.\n` +
        `- **Transferring NCB**: NCB belongs to the owner, not the vehicle. You can transfer your accumulated NCB when selling your old car to a new one.\n\n` +
        `To fetch accurate quotes, simply enter your vehicle registration number in the app!`;
      return formatAIResponse(intent, _query, msg, context);
    }
    case 'CLAIMS_HELP': {
      let msg = `### 🛡️ Insurance Claim Assistance\n\nHi **${userName}**, here is a step-by-step guide to filing a claim with **ASK Insurance**:\n\n` +
        `1. **Notify Immediately**: File a claim request through the **Claims** tab or contact your assigned POSP advisor.\n` +
        `2. **Submit Required Evidence**: Attach incident photos, repair estimate / hospital bills, and FIR (if required for motor theft/third-party damage).\n` +
        `3. **Cashless / Reimbursement**: For health claims, present your e-card at network hospitals for instant cashless approval.\n` +
        `4. **Real-time Tracking**: Monitor claim status updates live from your dashboard.`;
      return formatAIResponse(intent, _query, msg, context);
    }
    case 'POLICY_ENDORSEMENT': {
      let msg = `### 📝 Policy Endorsement & Revisions\n\nNeed to update your policy details, **${userName}**?\n\n` +
        `- **Non-Financial Endorsements**: Correction of Name spelling, Address, Registration Number, or Nominee details.\n` +
        `- **Financial Endorsements**: Change in Sum Insured, Add-on covers (Zero Dep, RSA, Engine Protect), or CNG kit addition.\n` +
        `- **Revised Policy Download**: Once approved by your POSP/Admin, your updated policy PDF will be available instantly in **My Policies**.`;
      return formatAIResponse(intent, _query, msg, context);
    }
    case 'HEALTH_LIFE_COVERAGE': {
      let msg = `### 🏥 Health & Life Insurance Planning\n\nHello **${userName}**, choosing the right coverage is vital:\n\n` +
        `- **Health Insurance**: Look for High Restoration Benefits, Zero Room Rent Capping, and Cashless Hospitalization across 38+ partner insurers.\n` +
        `- **Term Life Insurance**: Secure your family with coverage up to 10x - 15x your annual income at affordable premiums.\n` +
        `- **PBP Nivesh Mitra**: Use our AI-guided investment advisor to select top performing ULIP and savings plans.`;
      return formatAIResponse(intent, _query, msg, context);
    }
    default: {
      let msg = `### 🤖 ASK Insurance AI Assistance\n\nHello **${userName}**! Thank you for reaching out.\n\n` +
        `I am your dedicated AI Insurance Assistant. I can assist you with:\n` +
        `- **Instant Motor Quotes** & Vehicle specs lookup by registration number\n` +
        `- **No Claim Bonus (NCB)** verification and calculation\n` +
        `- **Policy Endorsements** & Revised document downloads\n` +
        `- **Claims Guidance** & status updates\n\n` +
        `Feel free to ask any question or request help regarding your policies!`;
      return formatAIResponse(intent, _query, msg, context);
    }
  }
}

/**
 * Main AI Query Processing Pipeline.
 */
export async function processInsuranceQuery(params: {
  userId: string;
  userQuery: string;
}): Promise<{
  intent: QueryIntent;
  response: string;
  contextSummary: string;
}> {
  const { userId, userQuery } = params;

  // 1. Build Context
  const context = await buildUserContext(userId);

  // 2. Classify Intent
  const intent = classifyQueryIntent(userQuery);

  const contextSummary = `User: ${context.name ?? 'Unknown'} (Code: ${context.customerCode ?? 'N/A'}), ` +
    `Active Policies: ${context.policiesCount}, Vehicles: ${context.vehiclesCount}, Open Claims: ${context.openClaimsCount}`;

  // 3. Gemini API Integration (with env key detection)
  const apiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (apiKey) {
    try {
      const systemInstruction = `You are ASK Insurance AI, an expert AI Insurance Assistant. ` +
        `User Context: ${contextSummary}. ` +
        `Provide accurate, helpful, IRDAI-compliant insurance guidance. ` +
        `Use Markdown formatting with headers, bullet points, and actionable next steps.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemInstruction}\n\nUser Question: ${userQuery}` }] }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json() as any;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const formatted = formatAIResponse(intent, userQuery, text, context);
          return { intent, response: formatted, contextSummary };
        }
      }
    } catch (err) {
      console.warn('[AI Query Processor] Gemini API call failed, using fallback engine:', err);
    }
  }

  // 4. Fallback Rule Engine
  const fallback = generateFallbackResponse(intent, userQuery, context);
  return { intent, response: fallback, contextSummary };
}
