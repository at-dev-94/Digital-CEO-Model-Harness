"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  Ear,
  FileText,
  Inbox,
  LayoutDashboard,
  LineChart,
  LogOut,
  MessageSquare,
  Mic,
  PenSquare,
  ScrollText,
  Settings,
  Shield,
  Sparkles,
  Workflow,
} from "lucide-react";
import { useApp } from "./Providers";
import { useSpeech } from "./SpeechProvider";
import type { dictionary } from "@/lib/i18n";

type NavKey = keyof typeof dictionary.en;

const NAV_GROUPS: Array<{
  label: NavKey;
  items: Array<{ href: string; key: NavKey; icon: typeof LayoutDashboard }>;
}> = [
  {
    label: "navOverview",
    items: [
      { href: "/", key: "dashboard", icon: LayoutDashboard },
      { href: "/chat", key: "messages", icon: MessageSquare },
    ],
  },
  {
    label: "navOperate",
    items: [
      { href: "/approvals", key: "automation", icon: Workflow },
      { href: "/social", key: "contentSeo", icon: PenSquare },
      { href: "/inbox", key: "inbox", icon: Inbox },
      { href: "/calendar", key: "calendar", icon: CalendarDays },
    ],
  },
  {
    label: "navIntelligence",
    items: [
      { href: "/competitors", key: "competitorTracker", icon: LineChart },
      { href: "/reports", key: "analytics", icon: FileText },
      { href: "/workspace", key: "workspace", icon: ScrollText },
    ],
  },
  {
    label: "navSystem",
    items: [
      { href: "/settings", key: "settings", icon: Settings },
      { href: "/audit", key: "securityNav", icon: Shield },
    ],
  },
];

const FLAT_NAV = NAV_GROUPS.flatMap((group) => group.items);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, lang, setLang, pending, settings, user, ready, refreshMe } = useApp();
  const { wakeSupported, wakeEnabled, setWakeEnabled, assistantName, readPrimary, speaking, stop } = useSpeech();
  const auto = settings.executionMode === "auto" || settings.autoMode === "true";

  useEffect(() => {
    if (ready && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
    }
  }, [ready, user, pathname, router]);

  async function toggleMode() {
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        executionMode: auto ? "manual" : "auto",
        autoMode: auto ? "false" : "true",
      }),
    });
    await refreshMe();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="hidden bg-[var(--side-bg)] p-4 lg:flex lg:flex-col">
        <div className="mb-6 px-1">
          <div className="overflow-hidden rounded-2xl bg-[#071018] ring-1 ring-white/10">
            <img
              src="/brand/logo-247.jpg"
              alt="247 Digital Services"
              className="h-[88px] w-full object-contain object-center"
            />
          </div>
          <div className="mt-3 px-1">
            <div className="truncate text-sm font-semibold text-white">{t("brandName")}</div>
            <div className="truncate text-[11px] text-[var(--side-muted)]">{t("assistantTitle")}</div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="mb-1.5 px-3 text-[10px] font-semibold tracking-[0.16em] text-[var(--side-muted)] uppercase">
                {t(group.label)}
              </div>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                        active
                          ? "bg-[var(--gold-soft)] font-medium text-white"
                          : "text-[var(--side-text)] hover:bg-[var(--side-bg-2)] hover:text-white"
                      }`}
                    >
                      <Icon size={17} />
                      <span className="flex-1 truncate">{t(item.key)}</span>
                      {item.href === "/approvals" && pending > 0 ? (
                        <span className="rounded-full bg-[var(--rose)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {pending}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[var(--side-bg-2)] p-3">
          <img
            src={settings.avatarMode === "logo" ? "/brand/logo-247.jpg" : "/brand/ceo.jpg"}
            alt={user?.name || t("owner")}
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-white">{user?.name || t("owner")}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--side-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
              {t("systemOnline")}
            </div>
          </div>
          <button
            onClick={logout}
            title={t("logout")}
            aria-label={t("logout")}
            className="grid h-8 w-8 place-items-center rounded-lg text-[var(--side-muted)] transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-[var(--line)] bg-[var(--bg)]/90 px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <img src="/brand/logo-247.jpg" alt="247" className="h-8 w-8 rounded-lg object-cover" />
          </div>

          <div className="hidden items-center gap-2 text-sm lg:flex">
            <span className="font-semibold">{t(currentKey(pathname))}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--success)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
              {t("systemOnline")}
            </span>
          </div>

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => (speaking ? stop() : readPrimary())}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              speaking ? "bg-[var(--gold)] text-white" : "btn-quiet"
            }`}
          >
            <Sparkles size={14} />
            {speaking ? t("stopReading") : t("readAloud")}
          </button>

          <button
            type="button"
            onClick={() => wakeSupported && setWakeEnabled(!wakeEnabled)}
            disabled={!wakeSupported}
            title={
              wakeSupported
                ? wakeEnabled
                  ? t("wakeListening", { name: assistantName })
                  : t("wakeOff")
                : t("wakeUnsupported")
            }
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
              wakeEnabled ? "bg-[var(--gold-soft)] text-[var(--gold)]" : "btn-quiet"
            }`}
          >
            <Ear size={14} />
            <span className="hidden sm:inline">{wakeEnabled ? t("wakeListening", { name: assistantName }) : assistantName}</span>
            {wakeEnabled ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--gold)]" /> : null}
          </button>

          <Link
            href="/chat"
            className="btn-quiet inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
          >
            <Mic size={14} /> <span className="hidden sm:inline">{t("voice")}</span>
          </Link>

          <button
            onClick={() => setLang(lang === "en" ? "bn" : "en")}
            className="btn-quiet rounded-full px-3 py-1.5 text-xs font-medium"
          >
            {lang === "en" ? "বাংলা" : "EN"}
          </button>

          <button
            onClick={toggleMode}
            className="btn-accent rounded-full px-3 py-1.5 text-xs font-semibold text-white"
          >
            {auto ? t("autoMode") : t("manualMode")}
          </button>
        </header>

        <div className="flex gap-2 overflow-x-auto border-b border-[var(--line)] bg-[var(--bg)] px-3 py-2 lg:hidden">
          {FLAT_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                pathname === item.href ? "bg-[var(--gold)] text-white" : "text-[var(--muted)]"
              }`}
            >
              {t(item.key)}
            </Link>
          ))}
        </div>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

function currentKey(pathname: string): NavKey {
  return FLAT_NAV.find((item) => item.href === pathname)?.key || "dashboard";
}
