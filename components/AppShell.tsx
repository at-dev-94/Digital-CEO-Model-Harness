"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckSquare,
  FileText,
  Inbox,
  LayoutDashboard,
  LineChart,
  LogOut,
  MessageSquare,
  Mic,
  ScrollText,
  Settings,
  Share2,
  Shield,
} from "lucide-react";
import { useApp } from "./Providers";

const NAV = [
  { href: "/", key: "brief" as const, icon: LayoutDashboard },
  { href: "/chat", key: "chat" as const, icon: MessageSquare },
  { href: "/approvals", key: "approvals" as const, icon: CheckSquare },
  { href: "/competitors", key: "competitors" as const, icon: LineChart },
  { href: "/social", key: "social" as const, icon: Share2 },
  { href: "/inbox", key: "inbox" as const, icon: Inbox },
  { href: "/calendar", key: "calendar" as const, icon: CalendarDays },
  { href: "/reports", key: "reports" as const, icon: FileText },
  { href: "/workspace", key: "workspace" as const, icon: ScrollText },
  { href: "/audit", key: "audit" as const, icon: Shield },
  { href: "/settings", key: "settings" as const, icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, lang, setLang, pending, settings, user, refreshMe } = useApp();
  const auto = settings.executionMode === "auto" || settings.autoMode === "true";

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
    <div className="grid-noise min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-[var(--line)] bg-black/20 p-5 lg:flex lg:flex-col">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#e2c275] to-[#3ee0c6] text-sm font-bold text-[#071018]">
            DC
          </div>
          <div>
            <div className="text-sm tracking-[0.22em] text-[var(--gold)] uppercase">{t("appName")}</div>
            <div className="text-xs text-[var(--muted)]">{t("tagline")}</div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active ? "bg-white/10 text-[var(--gold)]" : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={16} />
                <span className="flex-1">{t(item.key)}</span>
                {item.href === "/approvals" && pending > 0 ? (
                  <span className="rounded-full bg-[var(--rose)] px-2 py-0.5 text-[10px] text-white">{pending}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 rounded-2xl border border-[var(--line)] p-3 text-xs text-[var(--muted)]">
          <div className="font-medium text-white">{user?.name || t("owner")}</div>
          <div>{user?.email}</div>
        </div>
      </aside>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-[var(--line)] bg-[#071018]/80 px-4 py-3 backdrop-blur-xl">
          <div className="lg:hidden font-semibold tracking-widest text-[var(--gold)]">DC</div>
          <div className="flex-1" />
          <Link href="/chat" className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white">
            <Mic size={14} /> {t("voice")}
          </Link>
          <button
            onClick={() => setLang(lang === "en" ? "bn" : "en")}
            className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs"
          >
            {lang === "en" ? "বাংলা" : "EN"}
          </button>
          <button
            onClick={toggleMode}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              auto ? "bg-[var(--teal)] text-[#071018]" : "bg-[var(--gold)] text-[#071018]"
            }`}
          >
            {auto ? t("autoMode") : t("manualMode")}
          </button>
          <button onClick={logout} className="rounded-full border border-[var(--line)] p-2 text-[var(--muted)] hover:text-white">
            <LogOut size={14} />
          </button>
        </header>
        <div className="flex gap-2 overflow-x-auto border-b border-[var(--line)] px-3 py-2 lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ${
                pathname === item.href ? "bg-white/10 text-[var(--gold)]" : "text-[var(--muted)]"
              }`}
            >
              {t(item.key)}
            </Link>
          ))}
        </div>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
