import { prisma } from './prisma';

/**
 * Generate unique Customer ID with prefix "CU" + 6 digits (e.g. CU849201)
 */
export async function generateCustomerId(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const code = `CU${randomDigits}`;
    const existing = await prisma.user.findUnique({ where: { customerCode: code } });
    if (!existing) return code;
    attempts++;
  }
  // Fallback if high collision rate
  return `CU${Date.now().toString().slice(-6)}`;
}

/**
 * Generate unique POSP / Agent ID with prefix "AS" + 6 digits (e.g. AS948102)
 */
export async function generateAgentId(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const code = `AS${randomDigits}`;
    const existing = await prisma.admin.findUnique({ where: { agentCode: code } });
    if (!existing) return code;
    attempts++;
  }
  // Fallback if high collision rate
  return `AS${Date.now().toString().slice(-6)}`;
}
