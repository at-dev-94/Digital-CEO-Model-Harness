"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Lang, t as translate } from "@/lib/i18n";

type User = { id: string; email: string; name: string; role: string; language: string };

type AppState = {
  lang: Lang;
  user: User | null;
  settings: Record<string, string>;
  pending: number;
  setLang: (lang: Lang) => void;
  refreshMe: () => Promise<void>;
  t: (key: Parameters<typeof translate>[1], vars?: Record<string, string>) => string;
};

const Ctx = createContext<AppState | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(0);

  const refreshMe = useCallback(async () => {
    const res = await fetch("/api/me");
    if (!res.ok) return;
    const data = await res.json();
    setUser(data.user);
    setSettings(data.settings || {});
    setLangState((data.user?.language as Lang) || "en");
    const approvals = await fetch("/api/approvals");
    if (approvals.ok) {
      const json = await approvals.json();
      setPending((json.items || []).filter((i: { status: string }) => i.status === "pending").length);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const setLang = useCallback(async (next: Lang) => {
    setLangState(next);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: next }),
    });
  }, []);

  const value = useMemo(
    () => ({
      lang,
      user,
      settings,
      pending,
      setLang,
      refreshMe,
      t: (key: Parameters<typeof translate>[1], vars?: Record<string, string>) => translate(lang, key, vars),
    }),
    [lang, user, settings, pending, setLang, refreshMe],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp outside provider");
  return ctx;
}
