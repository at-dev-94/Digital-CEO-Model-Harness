"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { t } from "@/lib/i18n";
import { useApp } from "@/components/Providers";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { refreshMe } = useApp();
  const [email, setEmail] = useState("eshmum@digitalceo.local");
  const [password, setPassword] = useState("ChangeMe!CEO2026");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      setLoading(false);
      setError(t("en", "loginError"));
      return;
    }
    await refreshMe();
    router.push(params.get("next") || "/");
    router.refresh();
  }

  return (
    <div className="grid-noise relative min-h-screen overflow-hidden">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-2">
        <div>
          <img
            src="/brand/logo-247.jpg"
            alt="247 Digital Services"
            className="mb-6 h-16 w-auto rounded-2xl object-cover ring-1 ring-[var(--line)]"
          />
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs tracking-[0.18em] text-[var(--gold)] uppercase">
            AI CEO Assistant
          </div>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight md:text-5xl">
            Your business, automated.
          </h1>
          <p className="mt-4 max-w-lg text-[var(--muted)]">
            Morning Brief, competitor prices, inbox, social drafts and approvals — in English and Bangla.
            Ask it to read the brief out loud, or call it by name.
          </p>
          <p className="mt-6 text-sm text-[var(--teal)]">ইংরেজি ও বাংলা · English &amp; Bangla</p>
        </div>
        <form onSubmit={onSubmit} className="panel rounded-2xl p-8">
          <div className="text-sm font-semibold tracking-[0.16em] text-[var(--gold)] uppercase">{t("en", "loginTitle")}</div>
          <p className="mt-2 text-sm text-[var(--muted)]">{t("en", "loginSubtitle")}</p>
          <label className="mt-6 block text-xs font-medium text-[var(--muted)]">{t("en", "email")}</label>
          <input
            className="field mt-1 w-full rounded-xl px-3 py-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="username"
          />
          <label className="mt-4 block text-xs font-medium text-[var(--muted)]">{t("en", "password")}</label>
          <input
            className="field mt-1 w-full rounded-xl px-3 py-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
          />
          {error ? <p className="mt-3 text-sm text-[var(--rose)]">{error}</p> : null}
          <button disabled={loading} className="btn-accent mt-6 w-full rounded-xl py-3 font-medium disabled:opacity-60">
            {loading ? t("en", "signingIn") : t("en", "signIn")}
          </button>
          <p className="mt-4 text-xs text-[var(--muted)]">Demo: eshmum@digitalceo.local / ChangeMe!CEO2026</p>
        </form>
      </div>
    </div>
  );
}
