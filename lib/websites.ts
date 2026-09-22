import { prisma } from "./db";

const TIMEOUT_MS = 8000;

async function probe(url: string) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // Some hosts reject HEAD, so fall back to a ranged GET.
    let res = await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
        headers: { Range: "bytes=0-0" },
      });
    }
    return {
      status: res.ok || res.status === 206 ? "online" : "offline",
      statusCode: res.status,
      responseMs: Date.now() - started,
    };
  } catch {
    return { status: "offline", statusCode: null as number | null, responseMs: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

export async function checkWebsites() {
  const sites = await prisma.website.findMany();
  const results = await Promise.all(
    sites.map(async (site) => {
      const result = await probe(site.url);
      await prisma.website.update({
        where: { id: site.id },
        data: {
          status: result.status,
          statusCode: result.statusCode,
          responseMs: result.responseMs,
          lastCheckedAt: new Date(),
        },
      });
      return { name: site.name, ...result };
    }),
  );

  const online = results.filter((r) => r.status === "online").length;
  await prisma.jobRun.create({
    data: {
      name: "website_check",
      status: online === results.length ? "success" : "warning",
      message: `${online} of ${results.length} sites online`,
      finishedAt: new Date(),
    },
  });

  return { checked: results.length, online, results };
}
