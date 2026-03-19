import prisma from '../prisma';

/**
 * Creates a notification for a company.
 * Types: DEMANDE_SENT | DEMANDE_ACCEPTED | DEMANDE_REJECTED |
 *        TTN_ACCEPTED | TTN_REJECTED | XML_IMPORTED | INFO
 */
export const createNotif = async (
  companyId: string,
  title: string,
  message: string,
  type: string
): Promise<void> => {
  try {
    await prisma.notification.create({
      data: { companyId, title, message, type }
    });
  } catch (err) {
    // Never throw — notif creation should never crash main flow
    console.error('[Notification] Failed to create:', err);
  }
};
