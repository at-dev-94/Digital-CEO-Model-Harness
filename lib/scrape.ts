import { prisma } from "./db";
import { runHarness } from "./harness";
import { audit } from "./audit";

export type CatalogRow = {
  provider: string;
  country: string;
  countryCode: string;
  planName: string;
  dataGb: number;
  days: number;
  priceUsd: number;
  url?: string;
};

const FALLBACK: CatalogRow[] = [
  { provider: "Airalo", country: "United States", countryCode: "US", planName: "10GB / 30 days", dataGb: 10, days: 30, priceUsd: 22.5, url: "https://www.airalo.com/united-states-esim" },
  { provider: "Saily", country: "United States", countryCode: "US", planName: "10GB / 30 days", dataGb: 10, days: 30, priceUsd: 22.99, url: "https://saily.com" },
  { provider: "Nomad", country: "United States", countryCode: "US", planName: "10GB / 30 days", dataGb: 10, days: 30, priceUsd: 20, url: "https://www.nomadesim.com" },
  { provider: "Airalo", country: "United Kingdom", countryCode: "GB", planName: "3GB / 30 days", dataGb: 3, days: 30, priceUsd: 9.5, url: "https://www.airalo.com/united-kingdom-esim" },
  { provider: "Saily", country: "United Kingdom", countryCode: "GB", planName: "3GB / 30 days", dataGb: 3, days: 30, priceUsd: 8.99, url: "https://saily.com" },
  { provider: "Nomad", country: "United Kingdom", countryCode: "GB", planName: "3GB / 30 days", dataGb: 3, days: 30, priceUsd: 9, url: "https://www.nomadesim.com" },
  { provider: "Airalo", country: "Turkey", countryCode: "TR", planName: "10GB / 30 days", dataGb: 10, days: 30, priceUsd: 16, url: "https://www.airalo.com/turkey-esim" },
  { provider: "Saily", country: "Turkey", countryCode: "TR", planName: "10GB / 30 days", dataGb: 10, days: 30, priceUsd: 15.0, url: "https://saily.com" },
  { provider: "Nomad", country: "Turkey", countryCode: "TR", planName: "10GB / 30 days", dataGb: 10, days: 30, priceUsd: 15.5, url: "https://www.nomadesim.com" },
  { provider: "Airalo", country: "Japan", countryCode: "JP", planName: "10GB / 30 days", dataGb: 10, days: 30, priceUsd: 18, url: "https://www.airalo.com/japan-esim" },
  { provider: "Saily", country: "Japan", countryCode: "JP", planName: "10GB / 30 days", dataGb: 10, days: 30, priceUsd: 17.99, url: "https://saily.com" },
  { provider: "Nomad", country: "Japan", countryCode: "JP", planName: "10GB / 30 days", dataGb: 10, days: 30, priceUsd: 17, url: "https://www.nomadesim.com" },
  { provider: "Airalo", country: "Europe", countryCode: "EU", planName: "10GB / 30 days", dataGb: 10, days: 30, priceUsd: 31, url: "https://www.airalo.com" },
  { provider: "Saily", country: "Europe", countryCode: "EU", planName: "10GB / 30 days", dataGb: 10, days: 30, priceUsd: 35.99, url: "https://saily.com" },
  { provider: "Nomad", country: "Europe", countryCode: "EU", planName: "10GB / 30 days", dataGb: 10, days: 30, priceUsd: 23, url: "https://www.nomadesim.com" },
  { provider: "Airalo", country: "United Arab Emirates", countryCode: "AE", planName: "5GB / 30 days", dataGb: 5, days: 30, priceUsd: 16, url: "https://www.airalo.com" },
  { provider: "Saily", country: "United Arab Emirates", countryCode: "AE", planName: "5GB / 30 days", dataGb: 5, days: 30, priceUsd: 15.99, url: "https://saily.com" },
  { provider: "Nomad", country: "United Arab Emirates", countryCode: "AE", planName: "5GB / 30 days", dataGb: 5, days: 30, priceUsd: 16.5, url: "https://www.nomadesim.com" },
];

async function fetchText(url: string) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "DigitalCEOMarketIntel/1.0 (business intelligence; +https://localhost)",
        Accept: "text/html,application/json",
      },
    });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

function extractUsdPrices(html: string) {
  const matches = [...html.matchAll(/\$ ?([0-9]+(?:\.[0-9]{1,2})?)/g)].map((m) => Number(m[1]));
  return matches.filter((n) => n >= 3 && n <= 120);
}

export async function scrapeCompetitors() {
  const job = await prisma.jobRun.create({
    data: { name: "competitor-scan", status: "running" },
  });

  const targets = [
    { provider: "Airalo", url: "https://www.airalo.com/united-states-esim", country: "United States", countryCode: "US" },
    { provider: "Airalo", url: "https://www.airalo.com/turkey-esim", country: "Turkey", countryCode: "TR" },
    { provider: "Saily", url: "https://saily.com", country: "United States", countryCode: "US" },
    { provider: "Nomad", url: "https://www.nomadesim.com/blog/esim-comparison", country: "United States", countryCode: "US" },
  ];

  const live: CatalogRow[] = [];
  for (const target of targets) {
    const html = await fetchText(target.url);
    const prices = extractUsdPrices(html);
    if (prices.length) {
      live.push({
        provider: target.provider,
        country: target.country,
        countryCode: target.countryCode,
        planName: "Public page starter",
        dataGb: 1,
        days: 7,
        priceUsd: Math.min(...prices),
        url: target.url,
      });
    }
  }

  const rows = live.length ? [...FALLBACK.filter((r) => !live.some((l) => l.provider === r.provider && l.country === r.country)), ...live] : FALLBACK;
  const source = live.length ? "scrape+catalog" : "catalog";
  const scrapedAt = new Date();

  await prisma.competitorPrice.deleteMany({});
  await prisma.competitorPrice.createMany({
    data: rows.map((r) => ({
      ...r,
      currency: "USD",
      source,
      scrapedAt,
    })),
  });

  const grouped = new Map<string, CatalogRow[]>();
  for (const row of rows) {
    const key = `${row.country}|${row.dataGb}|${row.days}`;
    const list = grouped.get(key) || [];
    list.push(row);
    grouped.set(key, list);
  }

  await prisma.priceRecommendation.deleteMany({});
  const recs = [];
  for (const [key, list] of grouped) {
    const prices = list.map((r) => r.priceUsd);
    const min = Math.min(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const suggested = Math.round((min * 0.92 + Number.EPSILON) * 100) / 100;
    const sample = list[0];
    const rationaleRaw = await runHarness({
      kind: "pricing",
      messages: [
        {
          role: "user",
          content: `Recommend a retail USD price for ${sample.country} ${sample.planName}. Rivals: ${list
            .map((r) => `${r.provider} $${r.priceUsd}`)
            .join(", ")}. Stay ~5–10% under cheapest if margin allows, never dump below $3. Two sentences.`,
        },
      ],
    });
    recs.push(
      await prisma.priceRecommendation.create({
        data: {
          country: sample.country,
          planName: sample.planName,
          dataGb: sample.dataGb,
          days: sample.days,
          suggestedUsd: suggested,
          competitorAvg: Math.round(avg * 100) / 100,
          competitorMin: min,
          rationale: rationaleRaw.text,
          status: "draft",
        },
      }),
    );
    void key;
  }

  await prisma.jobRun.update({
    where: { id: job.id },
    data: {
      status: "success",
      message: `${rows.length} prices, source=${source}`,
      finishedAt: new Date(),
    },
  });
  await audit({
    action: "scrape",
    entity: "CompetitorPrice",
    detail: `${rows.length} rows stored (${source})`,
  });

  return { rows: rows.length, source, recommendations: recs.length };
}
