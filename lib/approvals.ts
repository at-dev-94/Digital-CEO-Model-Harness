import { prisma } from "./db";
import { isAutoMode } from "./settings";
import { audit } from "./audit";

export async function executeApproval(id: string, userId?: string) {
  const item = await prisma.approval.findUnique({ where: { id } });
  if (!item) throw new Error("Approval not found");

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(item.payload || "{}") as Record<string, unknown>;
  } catch {
    payload = {};
  }

  if (item.type === "social" && typeof payload.socialPostId === "string") {
    await prisma.socialPost.update({
      where: { id: payload.socialPostId },
      data: { status: "published", publishedAt: new Date() },
    });
  }
  if (item.type === "email" && typeof payload.emailId === "string") {
    await prisma.emailItem.update({
      where: { id: payload.emailId },
      data: { status: "replied" },
    });
  }
  if (item.type === "pricing" && typeof payload.recommendationId === "string") {
    await prisma.priceRecommendation.update({
      where: { id: payload.recommendationId },
      data: { status: "approved" },
    });
  }

  const updated = await prisma.approval.update({
    where: { id },
    data: {
      status: "executed",
      executedAt: new Date(),
      decidedAt: item.decidedAt || new Date(),
    },
  });
  await audit({
    userId,
    action: "execute",
    entity: "Approval",
    entityId: id,
    detail: `${item.type}: ${item.title}`,
  });
  return updated;
}

export async function decideApproval(
  id: string,
  decision: "approved" | "rejected",
  userId?: string,
) {
  const item = await prisma.approval.findUnique({ where: { id } });
  if (!item || item.status !== "pending") throw new Error("Not pending");

  if (decision === "rejected") {
    const updated = await prisma.approval.update({
      where: { id },
      data: { status: "rejected", decidedAt: new Date() },
    });
    await audit({
      userId,
      action: "reject",
      entity: "Approval",
      entityId: id,
      detail: item.title,
    });
    return updated;
  }

  await prisma.approval.update({
    where: { id },
    data: { status: "approved", decidedAt: new Date() },
  });
  return executeApproval(id, userId);
}

export async function enqueueApproval(input: {
  userId: string;
  type: string;
  title: string;
  summary: string;
  payload: unknown;
  risk?: string;
  channel?: string;
}) {
  const auto = await isAutoMode();
  const risk = input.risk || "high";
  const created = await prisma.approval.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      summary: input.summary,
      payload: JSON.stringify(input.payload ?? {}),
      risk,
      channel: input.channel,
      status: auto && risk !== "high" ? "approved" : "pending",
      decidedAt: auto && risk !== "high" ? new Date() : null,
    },
  });
  if (auto && risk !== "high") {
    return executeApproval(created.id, input.userId);
  }
  await audit({
    userId: input.userId,
    action: "enqueue",
    entity: "Approval",
    entityId: created.id,
    detail: `${input.type}: ${input.title}`,
  });
  return created;
}
