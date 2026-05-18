import prisma from '../prisma';

type ActivityInput = {
  companyId: string;
  actorId?: string | null;
  actorType: string;
  actionType: string;
  objectType: string;
  objectId: string;
  message: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
};

export const logActivity = async (data: ActivityInput) => {
  return prisma.userActivityLog.create({
    data: {
      companyId: data.companyId,
      actorId: data.actorId || null,
      actorType: data.actorType,
      actionType: data.actionType,
      objectType: data.objectType,
      objectId: data.objectId,
      message: data.message,
      oldValue: data.oldValue ?? undefined,
      newValue: data.newValue ?? undefined,
      metadata: data.metadata ?? undefined,
    },
  });
};

export const getActivitiesByCompany = async (
  companyId: string,
  filters: { objectType?: string; actionType?: string; take?: number } = {}
) => {
  return prisma.userActivityLog.findMany({
    where: {
      companyId,
      ...(filters.objectType ? { objectType: filters.objectType } : {}),
      ...(filters.actionType ? { actionType: filters.actionType } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: filters.take || 200,
  });
};

export const getActivitiesByObject = async (companyId: string, objectType: string, objectId: string) => {
  return prisma.userActivityLog.findMany({
    where: { companyId, objectType, objectId },
    orderBy: { createdAt: 'desc' },
  });
};

