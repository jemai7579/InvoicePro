import prisma from '../prisma';

const orderedPair = (companyId: string, partnerCompanyId: string) =>
  companyId < partnerCompanyId
    ? { companyAId: companyId, companyBId: partnerCompanyId }
    : { companyAId: partnerCompanyId, companyBId: companyId };

export const hasAcceptedConnection = async (companyId: string, partnerCompanyId: string) => {
  const pair = orderedPair(companyId, partnerCompanyId);
  const connection = await prisma.partnerConnection.findUnique({
    where: { companyAId_companyBId: pair },
  });
  return connection?.status === 'ACCEPTED';
};

export const upsertAcceptedConnection = async (companyId: string, partnerCompanyId: string) => {
  const pair = orderedPair(companyId, partnerCompanyId);
  return prisma.partnerConnection.upsert({
    where: { companyAId_companyBId: pair },
    create: { ...pair, status: 'ACCEPTED' },
    update: { status: 'ACCEPTED' },
    include: { companyA: true, companyB: true },
  });
};

export const getConnectedPartners = async (companyId: string) => {
  const connections = await prisma.partnerConnection.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ companyAId: companyId }, { companyBId: companyId }],
    },
    include: { companyA: true, companyB: true },
    orderBy: { updatedAt: 'desc' },
  });

  return connections.map((connection) => {
    const partner = connection.companyAId === companyId ? connection.companyB : connection.companyA;
    return {
      id: connection.id,
      partnerCompanyId: partner.id,
      name: partner.name,
      email: partner.email,
      matriculeFiscal: partner.matriculeFiscal,
      phone: partner.phone,
      status: connection.status,
      createdAt: connection.createdAt,
    };
  });
};
