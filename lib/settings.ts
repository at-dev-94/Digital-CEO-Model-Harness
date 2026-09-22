import { prisma } from "./db";

const DEFAULTS: Record<string, string> = {
  executionMode: process.env.KILL_SWITCH || "manual",
  autoMode: process.env.AUTO_MODE || "false",
  companyName: process.env.COMPANY_NAME || "247eSIM",
  language: "en",
  postsPerDay: "4",
  approvalRequired: "true",
  assistantName: process.env.ASSISTANT_NAME || "Nova",
  readAloud: "true",
  wakeWord: "false",
  voiceRate: "1",
  voicePreset: "en-GB-male",
  avatarMode: "photo",
  scrapeTargets: JSON.stringify([
    { name: "Airalo", url: "https://www.airalo.com/united-states-esim", country: "United States", countryCode: "US" },
    { name: "Airalo Turkey", url: "https://www.airalo.com/turkey-esim", country: "Turkey", countryCode: "TR" },
    { name: "Saily", url: "https://saily.com", country: "United States", countryCode: "US" },
    { name: "Nomad", url: "https://www.nomadesim.com", country: "United States", countryCode: "US" },
    { name: "Holafly", url: "https://esim.holafly.com", country: "Europe", countryCode: "EU" },
  ]),
};

export const SECRET_SETTING_KEYS = [
  "gmailPass",
  "imapPass",
  "facebookPass",
  "instagramPass",
  "xPass",
  "tiktokPass",
  "caldavPass",
] as const;

export function redactSettings(map: Record<string, string>) {
  const out = { ...map };
  for (const key of SECRET_SETTING_KEYS) {
    if (out[key]) {
      out[`${key}Set`] = "true";
      delete out[key];
    } else {
      out[`${key}Set`] = "false";
      delete out[key];
    }
  }
  return out;
}

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

export async function getPublicSettingsMap() {
  return redactSettings(await getSettingsMap());
}

export async function isAutoMode() {
  const [mode, auto] = await Promise.all([getSetting("executionMode"), getSetting("autoMode")]);
  return mode === "auto" || auto === "true";
}

export async function ensureClientSettings() {
  const map = await getSettingsMap();
  if (!map.companyName || map.companyName === "Eshmum eSIM") {
    await setSetting("companyName", "247eSIM");
  }
  if (!map.voicePreset) await setSetting("voicePreset", DEFAULTS.voicePreset);
  if (!map.avatarMode) await setSetting("avatarMode", DEFAULTS.avatarMode);
  if (!map.scrapeTargets) await setSetting("scrapeTargets", DEFAULTS.scrapeTargets);
  return getPublicSettingsMap();
}
