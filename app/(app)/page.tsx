"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Globe,
  Music2,
  Pause,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Square,
  TrendingDown,
  TrendingUp,
  Volume2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "@/components/Providers";
import { useReadable, useSpeech } from "@/components/SpeechProvider";
import { periodLabel, type Lang } from "@/lib/i18n";

type Stat = { value: number; change: number; orders?: number };

type Dashboard = {
  stats: { visits: Stat; reach: Stat; emails: Stat; sales: Stat };
  series: Array<{ date: string; revenue: number; orders: number; visits: number }>;
  websites: Array<{ id: string; name: string; url: string; status: string; responseMs: number | null; lastCheckedAt: string | null }>;
  posts: Array<{ id: string; platform: string; caption: string; status: string; scheduledAt: string | null; publishedAt: string | null }>;
  activity: Array<{ id: string; action: string; entity: string; detail: string; createdAt: string }>;
  market: {
    providerCount: number;
    priceCount: number;
    lastScan: string | null;
    recommendationCount: number;
    topRecommendation: { country: string; planName: string; suggestedUsd: number; competitorMin: number } | null;
  };
  content: { draftPosts: number };
  autopilot: boolean;
  pendingApprovals: number;
};

type BriefData = {
  brief?: { content: string; title: string; createdAt: string } | null;
  emails: Array<{ id: string; fromName: string; subject: string; priority: string }>;
  meetings: Array<{ id: string; title: string; startAt: string }>;
  approvals: Array<{ id: string; title: string; risk: string }>;
};

export default function DashboardPage() {
  const { t, lang, user, refreshMe } = useApp();
  const { speaking, paused, speak, pause, resume, stop, assistantName, wakeEnabled, setWakeEnabled, wakeSupported } =
    useSpeech();
  const [data, setData] = useState<Dashboard | null>(null);
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [range, setRange] = useState<7 | 30 | 90>(7);

  const load = useCallback(async () => {
    const [dashRes, briefRes] = await Promise.all([fetch("/api/dashboard"), fetch("/api/brief")]);
    if (dashRes.ok) setData(await dashRes.json());
    if (briefRes.ok) setBrief(await briefRes.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const briefText = brief?.brief?.content || "";
  useReadable("morning-brief", t("brief"), briefText);

  async function rebuild() {
    setBusy(true);
    await fetch("/api/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: lang }),
    });
    await load();
    await refreshMe();
    setBusy(false);
  }

  async function recheckSites() {
    setChecking(true);
    await fetch("/api/websites", { method: "POST" });
    await load();
    setChecking(false);
  }

  async function toggleAutopilot() {
    const next = !data?.autopilot;
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ executionMode: next ? "auto" : "manual", autoMode: next ? "true" : "false" }),
    });
    await load();
    await refreshMe();
  }

  const stats = data?.stats;

  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const windowSeries = useMemo(() => (data?.series || []).slice(-range), [data?.series, range]);
  const priorSeries = useMemo(() => {
    const all = data?.series || [];
    return all.slice(Math.max(0, all.length - range * 2), Math.max(0, all.length - range));
  }, [data?.series, range]);
  const windowRevenue = windowSeries.reduce((sum, point) => sum + point.revenue, 0);
  const priorRevenue = priorSeries.reduce((sum, point) => sum + point.revenue, 0);
  const windowOrders = windowSeries.reduce((sum, point) => sum + point.orders, 0);
  const salesChange =
    range === 7 && stats?.sales.change !== undefined
      ? stats.sales.change
      : priorRevenue
        ? Math.round(((windowRevenue - priorRevenue) / priorRevenue) * 1000) / 10
        : 0;
  const rangeLabel = range === 7 ? t("last7Days") : range === 30 ? (lang === "bn" ? "৩০ দিন" : "30 days") : lang === "bn" ? "৯০ দিন" : "90 days";

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] text-[var(--muted)]">
            {t("totalSales")} · {rangeLabel}
          </p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight md:text-[30px]">
            {t("greeting", { period: periodLabel(lang, now?.getHours()) })}, {user?.name || "Eshmum"}
          </h1>
        </div>
        <div className="flex items-center gap-1 text-xs">
          {([7, 30, 90] as const).map((days) => (
            <button
              key={days}
              type="button"
              data-active={range === days}
              onClick={() => setRange(days)}
              className="range-tab"
            >
              {days}d
            </button>
          ))}
        </div>
      </header>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(240px,0.8fr)]">
        <div className="panel rounded-2xl p-5">
          <div className="text-[13px] text-[var(--muted)]">{t("totalSales")}</div>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div className="text-[40px] leading-none font-semibold tracking-tight">{formatMoney(windowRevenue || stats?.sales.value || 0)}</div>
            <Sparkline points={windowSeries.map((point) => point.revenue)} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success-soft)] px-2 py-0.5 text-[12px] font-medium text-[var(--success)]">
              {salesChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {salesChange >= 0 ? "+" : ""}
              {salesChange}% {t("vsLastPeriod")}
            </span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--line)] pt-4">
            <div>
              <div className="text-[12px] text-[var(--muted)]">{t("ordersLabel")}</div>
              <div className="mt-1 text-lg font-semibold">{formatNumber(windowOrders || stats?.sales.orders || 0, lang)}</div>
            </div>
            <div>
              <div className="text-[12px] text-[var(--muted)]">{t("websiteVisits")}</div>
              <div className="mt-1 text-lg font-semibold">{formatNumber(stats?.visits.value ?? 0, lang)}</div>
            </div>
          </div>
        </div>
        <div className="grid gap-3">
          <SecondaryStat label={t("socialReach")} value={formatNumber(stats?.reach.value ?? 0, lang)} change={stats?.reach.change} />
          <SecondaryStat label={t("emailsProcessed")} value={formatNumber(stats?.emails.value ?? 0, lang)} change={stats?.emails.change} />
          <SecondaryStat
            label={t("websiteVisits")}
            value={formatNumber(stats?.visits.value ?? 0, lang)}
            change={stats?.visits.change}
          />
        </div>
      </section>

      <section className="panel overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.16em] text-[var(--gold)] uppercase">{t("brief")}</div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              {t("greeting", { period: periodLabel(lang, now?.getHours()) })}, {user?.name || "Eshmum"}
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              <Link href="/settings" className="hover:text-[var(--gold)]">
                {t("namedAs", { name: assistantName })}
              </Link>
              {" · "}
              {t("sayToRead", { name: assistantName })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {speaking ? (
              <span className="inline-flex items-center gap-1 rounded-xl bg-[var(--gold)] p-1 text-white">
                <button
                  type="button"
                  onClick={() => (paused ? resume() : pause())}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium"
                >
                  {paused ? <Play size={14} /> : <Pause size={14} />}
                  {paused ? t("resumeReading") : t("nowReading")}
                </button>
                <button
                  type="button"
                  onClick={stop}
                  aria-label={t("stopReading")}
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/15"
                >
                  <Square size={12} />
                </button>
              </span>
            ) : (
              <button
                type="button"
                disabled={!briefText.trim()}
                onClick={() => speak(briefText)}
                className="action-btn export disabled:opacity-50"
              >
                <Volume2 size={14} className="action-ico" />
                {t("readThisBrief")}
              </button>
            )}
            <button
              type="button"
              onClick={() => wakeSupported && setWakeEnabled(!wakeEnabled)}
              disabled={!wakeSupported}
              className="action-btn edit disabled:opacity-50"
            >
              {wakeEnabled ? t("wakeListening", { name: assistantName }) : t("wakeWord")}
            </button>
            <button onClick={rebuild} className="action-btn add">
              <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
              {busy ? "…" : t("generateBrief")}
            </button>
          </div>
        </div>
        <div className="px-5 py-4">
          <p className="whitespace-pre-wrap text-[14.5px] leading-7 text-[var(--text)]">{briefText || t("noItems")}</p>
          <div className="mt-4 grid gap-3 border-t border-[var(--line)] pt-4 sm:grid-cols-3">
            <MiniList
              title={t("urgentEmails")}
              href="/inbox"
              items={(brief?.emails || []).filter((e) => e.priority === "urgent").map((e) => `${e.fromName}: ${e.subject}`)}
            />
            <MiniList title={t("todayMeetings")} href="/calendar" items={(brief?.meetings || []).map((m) => m.title)} />
            <MiniList title={t("approvals")} href="/approvals" items={(brief?.approvals || []).map((a) => a.title)} />
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <WebsiteStatusCard
              websites={data?.websites || []}
              checking={checking}
              onRecheck={recheckSites}
              lang={lang}
            />
            <AutopilotCard auto={Boolean(data?.autopilot)} pending={data?.pendingApprovals ?? 0} onToggle={toggleAutopilot} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <SalesCard series={windowSeries} lang={lang} change={salesChange} rangeLabel={rangeLabel} />
            <SocialPostsCard posts={data?.posts || []} lang={lang} />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <PriceMonitorCard market={data?.market} lang={lang} />
            <ContentCard drafts={data?.content.draftPosts ?? 0} />
            <SecurityCard />
          </div>
        </div>

        <div className="space-y-5">
          <HeroCard />
          <AssistantCard />
          <ActivityCard items={data?.activity || []} lang={lang} />
        </div>
      </div>
    </div>
  );
}

/* ---------- cards ---------- */

function SecondaryStat({ label, value, change }: { label: string; value: string; change?: number }) {
  const up = (change ?? 0) >= 0;
  return (
    <div className="panel flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
      <div className="min-w-0">
        <div className="truncate text-[12px] text-[var(--muted)]">{label}</div>
        <div className="mt-0.5 text-[22px] leading-none font-semibold tracking-tight">{value}</div>
      </div>
      {change !== undefined ? (
        <span className={`text-[12px] font-medium ${up ? "text-[var(--success)]" : "text-[var(--rose)]"}`}>
          {up ? "+" : ""}
          {change}%
        </span>
      ) : null}
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const width = 112;
  const height = 36;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const d = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point - min) / span) * (height - 4) - 2;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="shrink-0 text-[var(--success)]">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function HeroCard() {
  const { t } = useApp();
  return (
    <div className="hero-card overflow-hidden rounded-2xl text-white">
      <div className="relative min-h-[168px] p-5">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1b3a]/85 via-[#0b1b3a]/25 to-transparent" />
        <div className="relative flex h-full min-h-[148px] flex-col justify-end">
          <p className="text-[17px] font-semibold leading-6">{t("stayConnected")}</p>
          <p className="mt-1 text-[12px] text-white/80">{t("heroCaption")}</p>
        </div>
      </div>
    </div>
  );
}

function MiniList({ title, href, items }: { title: string; href: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel-2)] p-4">
      <Link href={href} className="flex items-center gap-1 text-[11px] font-semibold tracking-[0.14em] text-[var(--gold)] uppercase">
        {title} <ChevronRight size={12} />
      </Link>
      <ul className="mt-3 space-y-2 text-[13px]">
        {items.length ? (
          items.slice(0, 3).map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-[2px] bg-[var(--gold)]" />
              <span className="line-clamp-2 text-[var(--text)]">{item}</span>
            </li>
          ))
        ) : (
          <li className="text-[var(--muted)]">—</li>
        )}
      </ul>
    </div>
  );
}

function WebsiteStatusCard({
  websites,
  checking,
  onRecheck,
  lang,
}: {
  websites: Dashboard["websites"];
  checking: boolean;
  onRecheck: () => void;
  lang: Lang;
}) {
  const { t } = useApp();
  const allUp = websites.length > 0 && websites.every((w) => w.status === "online");
  const lastCheck = websites.map((w) => w.lastCheckedAt).filter(Boolean).sort().at(-1);

  return (
    <div className="panel rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{t("websiteStatus")}</div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
            allUp ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--amber-soft)] text-[var(--amber)]"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${allUp ? "bg-[var(--success)]" : "bg-[var(--amber)]"}`} />
          {allUp ? t("allOperational") : t("someDown")}
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {websites.length ? (
          websites.map((site) => (
            <li key={site.id} className="soft flex items-center gap-3 rounded-xl px-3 py-2.5">
              <Globe size={15} className="text-[var(--muted)]" />
              <span className="flex-1 truncate text-[13px] font-medium">{site.name}</span>
              {site.responseMs ? <span className="text-[11px] text-[var(--faint)]">{site.responseMs}ms</span> : null}
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  site.status === "online"
                    ? "bg-[var(--success-soft)] text-[var(--success)]"
                    : "bg-[var(--rose-soft)] text-[var(--rose)]"
                }`}
              >
                {site.status === "online" ? t("online") : t("offline")}
              </span>
            </li>
          ))
        ) : (
          <li className="text-sm text-[var(--muted)]">{t("noItems")}</li>
        )}
      </ul>

      <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--faint)]">
        <span>{lastCheck ? `${t("lastScraped")}: ${timeAgo(lastCheck, lang)}` : ""}</span>
        <button onClick={onRecheck} className="inline-flex items-center gap-1.5 font-medium text-[var(--gold)]">
          <RefreshCw size={12} className={checking ? "animate-spin" : ""} />
          {checking ? t("checking") : t("recheck")}
        </button>
      </div>
    </div>
  );
}

function AutopilotCard({ auto, pending, onToggle }: { auto: boolean; pending: number; onToggle: () => void }) {
  const { t } = useApp();
  return (
    <div className="panel flex flex-col rounded-2xl p-5">
      <div className="text-sm font-semibold">{t("autopilotMode")}</div>
      <div className="mt-3 grid gap-2">
        <button type="button" data-checked={!auto} onClick={() => auto && onToggle()} className="choice">
          <span className="choice-dot" />
          <span>
            <span className="block text-[14px] font-semibold">{t("manualMode")}</span>
            <span className="mt-0.5 block text-[12px] text-[var(--muted)]">{t("autopilotOffHint")}</span>
          </span>
        </button>
        <button type="button" data-checked={auto} onClick={() => !auto && onToggle()} className="choice">
          <span className="choice-dot" />
          <span>
            <span className="block text-[14px] font-semibold">{t("autoMode")}</span>
            <span className="mt-0.5 block text-[12px] text-[var(--muted)]">{t("autopilotOnHint")}</span>
          </span>
        </button>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-[var(--line)] pt-3">
        <div className="text-[12px] text-[var(--muted)]">
          {t("pending")}: <span className="font-semibold text-[var(--text)]">{pending}</span>
        </div>
        <Link href="/approvals" className="action-btn add px-3 py-1.5">
          {t("approvals")} <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}

function SalesCard({
  series,
  lang,
  change,
  rangeLabel,
}: {
  series: Dashboard["series"];
  lang: Lang;
  change?: number;
  rangeLabel: string;
}) {
  const { t } = useApp();
  const chart = useMemo(
    () =>
      series.map((point) => ({
        label: new Date(point.date).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
          day: "numeric",
          month: "short",
        }),
        revenue: point.revenue,
        orders: point.orders,
      })),
    [series, lang],
  );
  const up = (change ?? 0) >= 0;

  return (
    <div className="panel rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold">{t("salesPerformance")}</div>
        <div className="flex items-center gap-2">
          {change !== undefined ? (
            <span className={`text-[12px] font-medium ${up ? "text-[var(--success)]" : "text-[var(--rose)]"}`}>
              {up ? "+" : ""}
              {change}%
            </span>
          ) : null}
          <span className="text-[12px] text-[var(--faint)]">{rangeLabel}</span>
        </div>
      </div>

      <div className="mt-4 h-[180px]">
        {chart.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6b7688" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6b7688" }} width={52} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "#12161e",
                  color: "#f4f7fb",
                  fontSize: 12,
                }}
                formatter={(value, name) => {
                  const amount = Number(value ?? 0);
                  return name === "revenue" ? [formatMoney(amount), t("revenueLabel")] : [amount, t("ordersLabel")];
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                strokeWidth={2.4}
                fill="url(#revenueFill)"
                dot={{ r: 3, fill: "#2563eb", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center text-sm text-[var(--muted)]">{t("noSalesYet")}</div>
        )}
      </div>
    </div>
  );
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: <InstagramMark />,
  facebook: <FacebookMark />,
  tiktok: <Music2 size={14} />,
  x: <XMark />,
  twitter: <XMark />,
};

function XMark() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
      <path d="M14.5 8.5V6.8c0-.7.5-1.3 1.2-1.3H17V3h-1.8C12.5 3 11 4.6 11 6.7v1.8H9v2.6h2V21h3.5v-9.9h2.3l.4-2.6h-2.7z" />
    </svg>
  );
}

const STATUS_TONES: Record<string, string> = {
  published: "bg-[var(--success-soft)] text-[var(--success)]",
  scheduled: "bg-[var(--gold-soft)] text-[var(--gold)]",
  pending: "bg-[var(--amber-soft)] text-[var(--amber)]",
  approved: "bg-[var(--teal-soft)] text-[var(--teal)]",
  draft: "soft text-[var(--muted)]",
};

function SocialPostsCard({ posts, lang }: { posts: Dashboard["posts"]; lang: Lang }) {
  const { t } = useApp();
  return (
    <div className="panel rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{t("recentSocialPosts")}</div>
        <Link href="/social" className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--gold)]">
          {t("viewAll")} <ChevronRight size={12} />
        </Link>
      </div>
      <ul className="mt-3 divide-y divide-[var(--line)]">
        {posts.length ? (
          posts.map((post) => (
            <li key={post.id} className="flex items-start gap-3 py-3">
              <span className="stat-icon h-8 w-8 shrink-0 bg-[var(--gold-soft)] text-[var(--gold)]">
                {PLATFORM_ICONS[post.platform] || <Sparkles size={14} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[13px] leading-5">{post.caption}</p>
                <div className="mt-1 text-[11px] text-[var(--faint)]">
                  {post.publishedAt
                    ? timeAgo(post.publishedAt, lang)
                    : post.scheduledAt
                      ? new Date(post.scheduledAt).toLocaleTimeString(lang === "bn" ? "bn-BD" : "en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  STATUS_TONES[post.status] || "soft text-[var(--muted)]"
                }`}
              >
                {post.status}
              </span>
            </li>
          ))
        ) : (
          <li className="py-3 text-sm text-[var(--muted)]">{t("noItems")}</li>
        )}
      </ul>
    </div>
  );
}

function PriceMonitorCard({ market, lang }: { market?: Dashboard["market"]; lang: Lang }) {
  const { t } = useApp();
  const rec = market?.topRecommendation;
  return (
    <div className="panel panel-hover flex flex-col rounded-2xl p-5">
      <div className="stat-icon bg-[var(--gold-soft)] text-[var(--gold)]">
        <Search size={17} />
      </div>
      <div className="mt-3 text-[13px] font-semibold">{t("priceMonitor")}</div>
      <div className="mt-1 text-[12px] text-[var(--muted)]">{t("priceCheckComplete")}</div>
      <div className="text-[11px] text-[var(--faint)]">
        {t("competitorsAnalysed", { count: String(market?.providerCount ?? 0) })}
        {market?.lastScan ? ` · ${timeAgo(market.lastScan, lang)}` : ""}
      </div>
      {rec ? (
        <span className="mt-3 w-fit rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--success)]">
          {t("bestPriceFound")}: {rec.country} ${rec.suggestedUsd}
        </span>
      ) : null}
      <Link
        href="/competitors"
        className="mt-auto inline-flex items-center gap-1 pt-3 text-[12px] font-medium text-[var(--gold)]"
      >
        {t("viewReport")} <ArrowRight size={12} />
      </Link>
    </div>
  );
}

function ContentCard({ drafts }: { drafts: number }) {
  const { t } = useApp();
  return (
    <div className="panel panel-hover flex flex-col rounded-2xl p-5">
      <div className="stat-icon bg-[var(--gold-soft)] text-[var(--gold)]">
        <Sparkles size={17} />
      </div>
      <div className="mt-3 text-[13px] font-semibold">{t("contentGenerator")}</div>
      <div className="mt-1 text-[12px] text-[var(--muted)]">{t("postsCreated", { count: String(drafts) })}</div>
      <div className="text-[11px] text-[var(--faint)]">{t("readyForReview")}</div>
      <Link href="/social" className="mt-auto inline-flex items-center gap-1 pt-3 text-[12px] font-medium text-[var(--gold)]">
        {t("viewContent")} <ArrowRight size={12} />
      </Link>
    </div>
  );
}

function SecurityCard() {
  const { t } = useApp();
  return (
    <div className="panel panel-hover flex flex-col rounded-2xl p-5">
      <div className="stat-icon bg-[var(--teal-soft)] text-[var(--teal)]">
        <ShieldCheck size={17} />
      </div>
      <div className="mt-3 text-[13px] font-semibold">{t("securityStatus")}</div>
      <div className="mt-1 text-[12px] text-[var(--muted)]">{t("multiLayerProtection")}</div>
      <div className="text-[11px] text-[var(--faint)]">{t("activeAndSecure")}</div>
      <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--success)]">
        <BadgeCheck size={12} /> {t("protectedLabel")}
      </span>
      <Link href="/audit" className="mt-auto inline-flex items-center gap-1 pt-3 text-[12px] font-medium text-[var(--gold)]">
        {t("securityDetails")} <ArrowRight size={12} />
      </Link>
    </div>
  );
}

function AssistantCard() {
  const { t, settings } = useApp();
  const actions: Array<{ key: Parameters<typeof t>[0]; prompt: string }> = [
    { key: "quickCheckPrices", prompt: "Check the latest eSIM prices from Airalo, Saily and Nomad and tell me where we should undercut." },
    { key: "quickCreateCampaign", prompt: "Create a social media campaign for this week across Instagram, Facebook and TikTok." },
    { key: "quickUpdatePricing", prompt: "Recommend website pricing updates based on the latest competitor scan." },
    { key: "quickShowReports", prompt: "Show me the latest reports and summarise what changed." },
  ];
  const face = settings.avatarMode === "logo" ? "/brand/logo-247.jpg" : "/brand/ceo.jpg";

  return (
    <div className="panel rounded-2xl p-5">
      <div className="flex items-center gap-2.5">
        <img src={face} alt="" className="h-11 w-11 rounded-2xl object-cover ring-1 ring-[var(--line)]" />
        <div>
          <div className="text-sm font-semibold">{t("brandName")}</div>
          <div className="text-[12px] text-[var(--muted)]">{t("assistantPrompt")}</div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {actions.map((action) => (
          <Link
            key={action.key}
            href={`/chat?ask=${encodeURIComponent(action.prompt)}`}
            className="soft flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] transition hover:bg-[var(--gold-soft)]"
          >
            <Sparkles size={13} className="shrink-0 text-[var(--gold)]" />
            <span className="flex-1">{t(action.key)}</span>
            <ChevronRight size={13} className="text-[var(--faint)]" />
          </Link>
        ))}
      </div>
    </div>
  );
}

const ACTIVITY_LABELS: Record<string, { en: string; bn: string }> = {
  price_analysis_completed: { en: "Price analysis completed", bn: "দাম বিশ্লেষণ সম্পন্ন" },
  social_posts_generated: { en: "Social posts generated", bn: "সোশ্যাল পোস্ট তৈরি" },
  website_status_check: { en: "Website status check", bn: "ওয়েবসাইট যাচাই" },
  order_ingested: { en: "New order received", bn: "নতুন অর্ডার এসেছে" },
  update_settings: { en: "Settings updated", bn: "সেটিংস হালনাগাদ" },
  decide_approval: { en: "Approval decided", bn: "অনুমোদন সিদ্ধান্ত" },
  seed: { en: "Workspace initialised", bn: "ওয়ার্কস্পেস চালু" },
};

function ActivityCard({ items, lang }: { items: Dashboard["activity"]; lang: Lang }) {
  const { t } = useApp();
  return (
    <div className="panel rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{t("recentActivity")}</div>
        <Link href="/audit" className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--gold)]">
          {t("viewAll")} <ChevronRight size={12} />
        </Link>
      </div>
      <ul className="mt-3 space-y-3">
        {items.length ? (
          items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${activityDot(item.action)}`} />
              <div className="min-w-0">
                <div className="text-[13px] font-medium">
                  {ACTIVITY_LABELS[item.action]?.[lang] || item.action.replace(/_/g, " ")}
                </div>
                <div className="line-clamp-1 text-[11px] text-[var(--muted)]">{item.detail}</div>
                <div className="text-[11px] text-[var(--faint)]">{timeAgo(item.createdAt, lang)}</div>
              </div>
            </li>
          ))
        ) : (
          <li className="text-sm text-[var(--muted)]">{t("noItems")}</li>
        )}
      </ul>
    </div>
  );
}

/* ---------- formatting ---------- */

function activityDot(action: string) {
  if (action.includes("price")) return "bg-[#f59e0b]";
  if (action.includes("social")) return "bg-[#8b5cf6]";
  if (action.includes("website") || action.includes("order")) return "bg-[#3b82f6]";
  if (action.includes("approval") || action.includes("settings")) return "bg-[#10b981]";
  return "bg-[var(--gold)]";
}

function formatNumber(value: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-US").format(Math.round(value));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function timeAgo(iso: string, lang: Lang) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));
  const bn = lang === "bn";
  if (minutes < 1) return bn ? "এইমাত্র" : "just now";
  if (minutes < 60) return bn ? `${minutes} মিনিট আগে` : `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return bn ? `${hours} ঘণ্টা আগে` : `${hours}h ago`;
  const days = Math.round(hours / 24);
  return bn ? `${days} দিন আগে` : `${days}d ago`;
}
