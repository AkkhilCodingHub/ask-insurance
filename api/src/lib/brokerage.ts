import { Prisma } from '../generated/prisma/client';

export async function calculateAndApplyBrokerage(
  tx: any,
  policyId: string
) {
  try {
    const policy = await tx.policy.findUnique({
      where: { id: policyId }
    });

    if (!policy || !policy.insurerId || !policy.type) {
      console.log(`[brokerage] Skip calculation for policy ${policyId}: missing insurer or type`);
      return;
    }

    // Find slab
    const slab = await tx.brokerageSlab.findUnique({
      where: {
        insurerId_insuranceType: {
          insurerId: policy.insurerId,
          insuranceType: policy.type
        }
      }
    });

    const rate = slab ? slab.percentage : 0;
    const amount = Math.round(policy.premium * (rate / 100) * 100) / 100;

    await tx.policy.update({
      where: { id: policyId },
      data: {
        brokerageRate: rate,
        brokerageAmount: amount,
        brokerageStatus: 'pending'
      }
    });

    console.log(`[brokerage] Calculated: ${rate}% / ₹${amount} on policy ${policyId}`);
  } catch (err) {
    console.error('[brokerage] Failed calculation:', err);
  }
}
