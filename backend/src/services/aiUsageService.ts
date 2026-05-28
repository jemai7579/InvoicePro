import prisma from '../prisma';

const positiveIntegerFromEnv = (name: string, fallback: number) => {
  const parsed = Number.parseInt(process.env[name] || '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const getAiMonthlyTokenLimit = () =>
  positiveIntegerFromEnv('AI_MONTHLY_TOKEN_LIMIT', 250000);

const currentMonthStart = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
};

export const getMonthlyAiUsage = async (companyId: string) => {
  const monthStart = currentMonthStart();
  const usage = await prisma.aiMonthlyUsage.findUnique({
    where: { companyId_monthStart: { companyId, monthStart } },
  });

  return { monthStart, usedTokens: usage?.usedTokens || 0 };
};

export const addMonthlyAiUsage = async (companyId: string, monthStart: Date, tokens: number) => {
  const safeTokens = Math.max(0, Math.ceil(tokens));
  if (!safeTokens) return;

  await prisma.aiMonthlyUsage.upsert({
    where: { companyId_monthStart: { companyId, monthStart } },
    create: { companyId, monthStart, usedTokens: safeTokens },
    update: { usedTokens: { increment: safeTokens } },
  });
};

export const estimatedTokens = (value: string) => Math.max(1, Math.ceil(value.length / 4));

export const tokensUsedFromResponse = (response: any, prompt: string, reply: string) => {
  const metadata = response?.usageMetadata;
  const providedTotal = Number(metadata?.totalTokenCount);
  if (Number.isFinite(providedTotal) && providedTotal > 0) return Math.ceil(providedTotal);

  const promptTokens = Number(metadata?.promptTokenCount);
  const outputTokens = Number(metadata?.candidatesTokenCount);
  if (Number.isFinite(promptTokens) && Number.isFinite(outputTokens)) {
    return Math.ceil(promptTokens + outputTokens);
  }

  // Gemini normally supplies usageMetadata; this fallback approximates 1 token per 4 characters.
  return estimatedTokens(prompt) + estimatedTokens(reply);
};
