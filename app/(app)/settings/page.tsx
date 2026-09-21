"use client";

import { FormEvent, useEffect, useState } from "react";
import { useApp } from "@/components/Providers";

export default function SettingsPage() {
  const { t, settings, refreshMe } = useApp();
  const [form, setForm] = useState({ companyName: "", postsPerDay: "4", executionMode: "manual" });

  useEffect(() => {
    setForm({
      companyName: settings.companyName || "Eshmum eSIM",
      postsPerDay: settings.postsPerDay || "4",
      executionMode: settings.executionMode || "manual",
    });
  }, [settings]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        autoMode: form.executionMode === "auto" ? "true" : "false",
      }),
    });
    await refreshMe();
  }

  return (
    <form onSubmit={onSubmit} className="panel max-w-xl space-y-4 rounded-3xl p-6">
      <div className="text-xs tracking-[0.2em] text-[var(--gold)] uppercase">{t("settings")}</div>
      <p className="text-sm text-[var(--muted)]">{t("securityNote")}</p>
      <label className="block text-xs text-[var(--muted)]">{t("company")}</label>
      <input
        className="w-full rounded-xl border border-[var(--line)] bg-black/30 px-3 py-2"
        value={form.companyName}
        onChange={(e) => setForm({ ...form, companyName: e.target.value })}
      />
      <label className="block text-xs text-[var(--muted)]">{t("killSwitch")}</label>
      <select
        className="w-full rounded-xl border border-[var(--line)] bg-black/30 px-3 py-2"
        value={form.executionMode}
        onChange={(e) => setForm({ ...form, executionMode: e.target.value })}
      >
        <option value="manual">{t("manualMode")}</option>
        <option value="auto">{t("autoMode")}</option>
      </select>
      <label className="block text-xs text-[var(--muted)]">Posts / day</label>
      <input
        className="w-full rounded-xl border border-[var(--line)] bg-black/30 px-3 py-2"
        value={form.postsPerDay}
        onChange={(e) => setForm({ ...form, postsPerDay: e.target.value })}
      />
      <div className="rounded-2xl border border-[var(--line)] p-4 text-sm leading-6 text-[var(--muted)]">
        <div className="text-[var(--gold)]">{t("models")}</div>
        Writing → Claude · General → GPT · Research → Grok · Fast/cost → DeepSeek/Hermes · Vision → Gemini.
        Routed by the model harness. Keys live in OpenRouter / n8n, never in the browser.
      </div>
      <p className="text-sm text-[var(--muted)]">{t("n8nHint")}</p>
      <button className="rounded-full bg-[var(--gold)] px-4 py-2 text-sm text-[#071018]">{t("save")}</button>
    </form>
  );
}
