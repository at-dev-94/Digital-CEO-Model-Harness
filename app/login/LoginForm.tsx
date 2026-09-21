"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { t } from "@/lib/i18n";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError(t("en", "loginError"));
      return;
    }
    router.push(params.get("next") || "/");
    router.refresh();
  }

  return (
    <div className="grid-noise relative min-h-screen overflow-hidden">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-2">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-1 text-xs tracking-[0.2em] text-[var(--gold)] uppercase">
            Digital CEO · Model Harness
          </div>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight md:text-5xl">
            Approval-first chief of staff for an eSIM business.
          </h1>
          <p className="mt-4 max-w-lg text-[var(--muted)]">
            Voice + Claude / GPT / Gemini / Grok / Hermes, n8n workflows, WhatsApp / Discord / email,
            competitor prices, and a Morning Brief — nothing outbound until you say so.
          </p>
          <p className="mt-6 text-sm text-[var(--teal)]">ইংরেজি ও বাংলা · English &amp; Bangla</p>
        </div>
        <form onSubmit={onSubmit} className="panel rounded-3xl p-8">
          <div className="text-sm tracking-[0.18em] text-[var(--gold)] uppercase">{t("en", "loginTitle")}</div>
          <p className="mt-2 text-sm text-[var(--muted)]">{t("en", "loginSubtitle")}</p>
          <label className="mt-6 block text-xs text-[var(--muted)]">{t("en", "email")}</label>
          <input
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-black/30 px-3 py-3 outline-none focus:border-[var(--gold)]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="username"
          />
          <label className="mt-4 block text-xs text-[var(--muted)]">{t("en", "password")}</label>
          <input
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-black/30 px-3 py-3 outline-none focus:border-[var(--gold)]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
          />
          {error ? <p className="mt-3 text-sm text-[var(--rose)]">{error}</p> : null}
          <button
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-[var(--gold)] py-3 font-medium text-[#071018]"
          >
            {loading ? t("en", "signingIn") : t("en", "signIn")}
          </button>
          <p className="mt-4 text-xs text-[var(--muted)]">Demo: eshmum@digitalceo.local / ChangeMe!CEO2026</p>
        </form>
      </div>
    </div>
  );
}
