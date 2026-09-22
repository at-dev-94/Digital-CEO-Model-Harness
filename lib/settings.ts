import { prisma } from "./db";

const DEFAULTS: Record<string, string> = {
  executionMode: process.env.KILL_SWITCH || "manual",
  autoMode: process.env.AUTO_MODE || "false",
  companyName: process.env.COMPANY_NAME || "Eshmum eSIM",
  language: "en",
  postsPerDay: "4",
  approvalRequired: "true",
  assistantName: process.env.ASSISTANT_NAME || "Nova",
  readAloud: "true",
  wakeWord: "false",
  voiceRate: "1",
};

export async function getSetting(key: string) {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? DEFAULTS[key] ?? "";
}

export async function setSetting(key: string, value: string) {
  return prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function getSettingsMap() {
  const rows = await prisma.setting.findMany();
  const map = { ...DEFAULTS };
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export async function isAutoMode() {
  const [mode, auto] = await Promise.all([getSetting("executionMode"), getSetting("autoMode")]);
  return mode === "auto" || auto === "true";
}
