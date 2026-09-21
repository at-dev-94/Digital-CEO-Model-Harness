import { prisma } from "./db";

export async function audit(input: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  detail: string;
  ip?: string | null;
}) {
  return prisma.auditLog.create({
    data: {
      userId: input.userId || null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId || null,
      detail: input.detail,
      ip: input.ip || null,
    },
  });
}
