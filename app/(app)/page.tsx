"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  CalendarClock,
  ChevronRight,
  Globe,
  Mail,
  Music2,
  Pause,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Square,
  TrendingDown,
  TrendingUp,
  Users,
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

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight md:text-[30px]">{t("assistantTitle")}</h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--success-soft)] px-2.5 py-1 font-medium text-[var(--success)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
            {t("systemOnline")}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 font-medium text-[var(--muted)] ring-1 ring-[var(--line)]">
            <CalendarClock size={13} />
            {now ? (
              <>
                {now.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                <span className="text-[var(--faint)]">
                  {now.toLocaleTimeString(lang === "bn" ? "bn-BD" : "en-GB", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </>
            ) : (
              <span className="inline-block min-w-[9rem]">&nbsp;</span>
            )}
          </span>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Globe size={18} />}
          tone="blue"
          label={t("websiteVisits")}
          value={formatNumber(stats?.visits.value ?? 0, lang)}
          change={stats?.visits.change}
          caption={t("vsLastPeriod")}
        />
        <StatCard
          icon={<Users size={18} />}
          tone="violet"
          label={t("socialReach")}
          value={formatNumber(stats?.reach.value ?? 0, lang)}
          change={stats?.reach.change}
          caption={t("vsLastPeriod")}
        />
        <StatCard
          icon={<Mail size={18} />}
          tone="rose"
          label={t("emailsProcessed")}
          value={formatNumber(stats?.emails.value ?? 0, lang)}
          change={stats?.emails.change}
          caption={t("vsLastPeriod")}
        />
        <StatCard
          icon={<ShoppingCart size={18} />}
          tone="teal"
          label={t("totalSales")}
          value={formatMoney(stats?.sales.value ?? 0)}
          change={stats?.sales.change}
          caption={`${stats?.sales.orders ?? 0} ${t("ordersLabel")} · ${t("last7Days")}`}
        />
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
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold)] p-1 text-white">
                <button
                  type="button"
                  onClick={() => (paused ? resume() : pause())}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium"
                >
                  {paused ? <Play size={14} /> : <Pause size={14} />}
                  {paused ? t("resumeReading") : t("nowReading")}
                </button>
                <button
                  type="button"
                  onClick={stop}
                  aria-label={t("stopReading")}
                  className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/15"
                >
                  <Square size={12} />
                </button>
              </span>
            ) : (
              <button
                type="button"
                disabled={!briefText.trim()}
                onClick={() => speak(briefText)}
                className="btn-accent inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                <Volume2 size={16} />
                {t("readThisBrief")}
              </button>
            )}
            <button
              type="button"
              onClick={() => wakeSupported && setWakeEnabled(!wakeEnabled)}
              disabled={!wakeSupported}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium disabled:opacity-60 ${
                wakeEnabled ? "bg-[var(--gold-soft)] text-[var(--gold)]" : "btn-quiet"
              }`}
            >
              {wakeEnabled ? t("wakeListening", { name: assistantName }) : t("wakeWord")}
              {wakeEnabled ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--gold)]" /> : null}
            </button>
            <button onClick={rebuild} className="btn-quiet rounded-full px-4 py-2 text-sm font-medium">
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
            <SalesCard series={data?.series || []} lang={lang} change={stats?.sales.change} />
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

const TONES: Record<string, string> = {
  blue: "bg-[#e8effe] text-[#2563eb]",
  violet: "bg-[#f0eafe] text-[#7c3aed]",
  rose: "bg-[#fdeaf0] text-[#e11d48]",
  teal: "bg-[#e0f5f2] text-[#0d9488]",
};

function StatCard({
  icon,
  tone,
  label,
  value,
  change,
  caption,
}: {
  icon: React.ReactNode;
  tone: keyof typeof TONES;
  label: string;
  value: string;
  change?: number;
  caption: string;
}) {
  const up = (change ?? 0) >= 0;
  return (
    <div className="panel panel-hover rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div className={`stat-icon ${TONES[tone]}`}>{icon}</div>
        {change !== undefined ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
              up ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--rose-soft)] text-[var(--rose)]"
            }`}
          >
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {up ? "+" : ""}
            {change}%
          </span>
        ) : null}
      </div>
      <div className="mt-4 text-[26px] leading-none font-semibold tracking-tight">{value}</div>
      <div className="mt-1.5 text-[13px] font-medium text-[var(--text)]">{label}</div>
      <div className="mt-0.5 text-[11px] text-[var(--faint)]">{caption}</div>
    </div>
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
    <div>
      <Link href={href} className="flex items-center gap-1 text-[11px] font-semibold tracking-wider text-[var(--muted)] uppercase hover:text-[var(--gold)]">
        {title} <ChevronRight size={12} />
      </Link>
      <ul className="mt-2 space-y-1.5 text-[13px] text-[var(--muted)]">
        {items.length ? (
          items.slice(0, 3).map((item) => (
            <li key={item} className="line-clamp-1">
              {item}
            </li>
          ))
        ) : (
          <li>—</li>
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
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold">{t("autopilotMode")}</div>
          <div className={`mt-1 text-[13px] font-medium ${auto ? "text-[var(--teal)]" : "text-[var(--gold)]"}`}>
            {auto ? t("fullyAutomatic") : t("manualMode")}
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={auto}
          onClick={onToggle}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${auto ? "bg-[var(--teal)]" : "bg-[#cbd5e1]"}`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
              auto ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[13px] text-[var(--muted)]">
        <Bot size={15} className={auto ? "text-[var(--teal)]" : "text-[var(--gold)]"} />
        {auto ? t("autopilotOnHint") : t("autopilotOffHint")}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-[var(--line)] pt-3">
        <div className="text-[12px] text-[var(--muted)]">
          {t("pending")}: <span className="font-semibold text-[var(--text)]">{pending}</span>
        </div>
        <Link href="/approvals" className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--gold)]">
          {t("approvals")} <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}

function SalesCard({ series, lang, change }: { series: Dashboard["series"]; lang: Lang; change?: number }) {
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
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
                up ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--rose-soft)] text-[var(--rose)]"
              }`}
            >
              {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {up ? "+" : ""}
              {change}%
            </span>
          ) : null}
          <span className="rounded-full bg-[var(--gold-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--gold)]">
            {t("last7Days")}
          </span>
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
              <CartesianGrid stroke="#eef2f8" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} width={52} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f3",
                  fontSize: 12,
                  boxShadow: "0 10px 30px rgba(15,27,45,0.1)",
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
      <div className="stat-icon bg-[#f0eafe] text-[#7c3aed]">
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
