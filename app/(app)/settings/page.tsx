"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Ear, Volume2 } from "lucide-react";
import { useApp } from "@/components/Providers";
import { useSpeech } from "@/components/SpeechProvider";

export default function SettingsPage() {
  const { t, settings, refreshMe } = useApp();
  const { speak, wakeSupported, wakeEnabled, setWakeEnabled } = useSpeech();
  const [form, setForm] = useState({
    companyName: "",
    postsPerDay: "4",
    executionMode: "manual",
    assistantName: "Nova",
    voiceRate: "1",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm({
      companyName: settings.companyName || "Eshmum eSIM",
      postsPerDay: settings.postsPerDay || "4",
      executionMode: settings.executionMode || "manual",
      assistantName: settings.assistantName || "Nova",
      voiceRate: settings.voiceRate || "1",
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
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  const name = form.assistantName || "Nova";

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-5">
      <div className="panel space-y-4 rounded-2xl p-6">
        <div>
          <h1 className="text-lg font-semibold">{t("settings")}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{t("securityNote")}</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">{t("company")}</label>
          <input
            className="field w-full rounded-xl px-3 py-2.5 text-sm"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">{t("killSwitch")}</label>
          <select
            className="field w-full rounded-xl px-3 py-2.5 text-sm"
            value={form.executionMode}
            onChange={(e) => setForm({ ...form, executionMode: e.target.value })}
          >
            <option value="manual">{t("manualMode")}</option>
            <option value="auto">{t("autoMode")}</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">Posts / day</label>
          <input
            className="field w-full rounded-xl px-3 py-2.5 text-sm"
            value={form.postsPerDay}
            onChange={(e) => setForm({ ...form, postsPerDay: e.target.value })}
          />
        </div>
      </div>

      <div className="panel space-y-4 rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-[var(--gold)]" />
          <h2 className="text-sm font-semibold">{t("voiceSettings")}</h2>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">{t("assistantNameLabel")}</label>
          <div className="flex gap-2">
            <input
              className="field w-full rounded-xl px-3 py-2.5 text-sm"
              value={form.assistantName}
              onChange={(e) => setForm({ ...form, assistantName: e.target.value })}
              placeholder="Nova"
            />
            <button
              type="button"
              onClick={() => speak(`Hello, I am ${name}. I will read your morning brief whenever you ask.`)}
              className="btn-quiet shrink-0 rounded-xl px-4 text-sm font-medium"
            >
              <Volume2 size={15} />
            </button>
          </div>
          <p className="mt-1.5 text-xs text-[var(--muted)]">{t("assistantNameHint", { name })}</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
            {t("speechRate")} — {form.voiceRate}×
          </label>
          <input
            type="range"
            min="0.6"
            max="1.6"
            step="0.1"
            value={form.voiceRate}
            onChange={(e) => setForm({ ...form, voiceRate: e.target.value })}
            className="w-full accent-[var(--gold)]"
          />
        </div>

        <div className="flex items-start justify-between gap-4 rounded-xl border border-[var(--line)] p-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Ear size={15} className="text-[var(--gold)]" />
              {t("wakeWord")}
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {wakeSupported ? t("assistantNameHint", { name }) : t("wakeUnsupported")}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={wakeEnabled}
            disabled={!wakeSupported}
            onClick={() => setWakeEnabled(!wakeEnabled)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-40 ${
              wakeEnabled ? "bg-[var(--teal)]" : "bg-[#cbd5e1]"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                wakeEnabled ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="panel rounded-2xl p-6 text-sm leading-6 text-[var(--muted)]">
        <div className="font-medium text-[var(--gold)]">{t("models")}</div>
        Writing → Claude · General → GPT · Research → Grok · Fast/cost → DeepSeek/Hermes · Vision → Gemini. Routed by the
        model harness. Keys live in OpenRouter / n8n, never in the browser.
        <p className="mt-3">{t("n8nHint")}</p>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn-accent rounded-full px-5 py-2.5 text-sm font-medium">{t("save")}</button>
        {saved ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--success)]">
            <Check size={15} /> {t("save")}
          </span>
        ) : null}
      </div>
    </form>
  );
}
