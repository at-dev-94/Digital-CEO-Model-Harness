import { prisma } from "./db";
import { scrapeCompetitors } from "./scrape";
import { buildMorningBrief } from "./brief";

let started = false;

export function startScheduler() {
  if (started || process.env.NEXT_RUNTIME === "edge") return;
  started = true;

  const hour = 60 * 60 * 1000;
  setInterval(() => {
    void scrapeCompetitors().catch((err) => console.error("scheduled scrape", err));
  }, 6 * hour);

  setInterval(async () => {
    try {
      const owner = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
      await buildMorningBrief((owner?.language as "en" | "bn") || "en");
    } catch (err) {
      console.error("scheduled brief", err);
    }
  }, 12 * hour);
}
