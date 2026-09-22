"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Ear, Globe, Link2, Plus, Trash2, Volume2 } from "lucide-react";
import { useApp } from "@/components/Providers";
import { useSpeech } from "@/components/SpeechProvider";
import { VOICE_PRESETS } from "@/lib/voices";

type Site = { id: string; name: string; url: string; status: string };
type ScrapeRow = { name: string; url: string; country: string; countryCode: string };

export default function SettingsPage() {
  const { t, settings, refreshMe } = useApp();
  const { speak, wakeSupported, wakeEnabled, setWakeEnabled } = useSpeech();
  const [form, setForm] = useState({
    companyName: "",
    postsPerDay: "4",
    executionMode: "manual",
    assistantName: "Nova",
    voiceRate: "1",
    voicePreset: "en-GB-male",
    avatarMode: "photo",
    gmailUser: "",
    gmailPass: "",
    imapHost: "imap.gmail.com",
    instagramUser: "",
    instagramPass: "",
    facebookUser: "",
    facebookPass: "",
    xUser: "",
    xPass: "",
    tiktokUser: "",
    tiktokPass: "",
  });
  const [saved, setSaved] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [targets, setTargets] = useState<ScrapeRow[]>([]);
  const [newSite, setNewSite] = useState({ name: "", url: "" });
  const [newTarget, setNewTarget] = useState<ScrapeRow>({ name: "", url: "", country: "", countryCode: "" });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      companyName: settings.companyName || "247eSIM",
      postsPerDay: settings.postsPerDay || "4",
      executionMode: settings.executionMode || "manual",
      assistantName: settings.assistantName || "Nova",
      voiceRate: settings.voiceRate || "1",
      voicePreset: settings.voicePreset || "en-GB-male",
      avatarMode: settings.avatarMode || "photo",
      gmailUser: settings.gmailUser || "",
      imapHost: settings.imapHost || "imap.gmail.com",
      instagramUser: settings.instagramUser || "",
      facebookUser: settings.facebookUser || "",
      xUser: settings.xUser || "",
      tiktokUser: settings.tiktokUser || "",
    }));
    try {
      setTargets(JSON.parse(settings.scrapeTargets || "[]"));
    } catch {
      setTargets([]);
    }
  }, [settings]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/websites");
      if (res.ok) setSites((await res.json()).websites || []);
    })();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const payload: Record<string, string> = {
      companyName: form.companyName,
      postsPerDay: form.postsPerDay,
      executionMode: form.executionMode,
      autoMode: form.executionMode === "auto" ? "true" : "false",
      assistantName: form.assistantName,
      voiceRate: form.voiceRate,
      voicePreset: form.voicePreset,
      avatarMode: form.avatarMode,
      gmailUser: form.gmailUser,
      imapHost: form.imapHost,
      instagramUser: form.instagramUser,
      facebookUser: form.facebookUser,
      xUser: form.xUser,
      tiktokUser: form.tiktokUser,
      scrapeTargets: JSON.stringify(targets),
    };
    if (form.gmailPass) payload.gmailPass = form.gmailPass;
    if (form.instagramPass) payload.instagramPass = form.instagramPass;
    if (form.facebookPass) payload.facebookPass = form.facebookPass;
    if (form.xPass) payload.xPass = form.xPass;
    if (form.tiktokPass) payload.tiktokPass = form.tiktokPass;
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await refreshMe();
    setForm((f) => ({ ...f, gmailPass: "", instagramPass: "", facebookPass: "", xPass: "", tiktokPass: "" }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  async function addSite() {
    if (!newSite.url) return;
    await fetch("/api/websites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSite),
    });
    setNewSite({ name: "", url: "" });
    const res = await fetch("/api/websites");
    if (res.ok) setSites((await res.json()).websites || []);
  }

  async function removeSite(id: string) {
    await fetch("/api/websites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    setSites((list) => list.filter((s) => s.id !== id));
  }

  const name = form.assistantName || "Nova";

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-5">
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
          <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">{t("aiFace")}</label>
          <p className="mb-2 text-xs text-[var(--muted)]">{t("aiFaceHint")}</p>
          <div className="flex flex-wrap gap-3">
            {(
              [
                { id: "photo", label: t("useOwnerPhoto"), src: "/brand/ceo.jpg" },
                { id: "logo", label: t("useBrandLogo"), src: "/brand/logo-247.jpg" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setForm({ ...form, avatarMode: opt.id })}
                className={`flex items-center gap-3 rounded-2xl border p-2 pr-4 text-left text-sm ${
                  form.avatarMode === opt.id ? "border-[var(--gold)] bg-[var(--gold-soft)]" : "border-[var(--line)]"
                }`}
              >
                <img src={opt.src} alt="" className="h-12 w-12 rounded-xl object-cover" />
                {opt.label}
              </button>
            ))}
          </div>
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
      </div>

      <div className="panel space-y-4 rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-[var(--gold)]" />
          <h2 className="text-sm font-semibold">{t("voiceSettings")}</h2>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">{t("assistantNameLabel")}</label>
          <input
            className="field w-full rounded-xl px-3 py-2.5 text-sm"
            value={form.assistantName}
            onChange={(e) => setForm({ ...form, assistantName: e.target.value })}
            placeholder="Nova"
          />
          <p className="mt-1.5 text-xs text-[var(--muted)]">{t("assistantNameHint", { name })}</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">{t("voiceTone")}</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {VOICE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setForm({ ...form, voicePreset: preset.id })}
                className={`rounded-xl border px-3 py-3 text-left text-sm ${
                  form.voicePreset === preset.id ? "border-[var(--gold)] bg-[var(--gold-soft)]" : "border-[var(--line)]"
                }`}
              >
                <div className="font-medium">{preset.label}</div>
                <div className="mt-1 text-[11px] text-[var(--muted)]">{preset.locale}</div>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              speak(
                `Hello, I am ${name}, your AI CEO. This is the ${VOICE_PRESETS.find((p) => p.id === form.voicePreset)?.label} voice.`,
                "en",
                form.voicePreset,
              )
            }
            className="btn-quiet mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
          >
            <Volume2 size={15} /> {t("previewVoice")}
          </button>
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

      <div className="panel space-y-4 rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <Link2 size={16} className="text-[var(--gold)]" />
          <h2 className="text-sm font-semibold">{t("connections")}</h2>
        </div>
        <p className="text-xs leading-5 text-[var(--muted)]">{t("connectionsHint")}</p>
        <CredField
          label="Gmail / IMAP"
          user={form.gmailUser}
          pass={form.gmailPass}
          passSet={settings.gmailPassSet === "true"}
          extra={form.imapHost}
          extraLabel="IMAP host"
          onUser={(gmailUser) => setForm({ ...form, gmailUser })}
          onPass={(gmailPass) => setForm({ ...form, gmailPass })}
          onExtra={(imapHost) => setForm({ ...form, imapHost })}
        />
        <CredField
          label="Instagram"
          user={form.instagramUser}
          pass={form.instagramPass}
          passSet={settings.instagramPassSet === "true"}
          onUser={(instagramUser) => setForm({ ...form, instagramUser })}
          onPass={(instagramPass) => setForm({ ...form, instagramPass })}
        />
        <CredField
          label="Facebook / Meta"
          user={form.facebookUser}
          pass={form.facebookPass}
          passSet={settings.facebookPassSet === "true"}
          onUser={(facebookUser) => setForm({ ...form, facebookUser })}
          onPass={(facebookPass) => setForm({ ...form, facebookPass })}
        />
        <CredField
          label="X (Twitter)"
          user={form.xUser}
          pass={form.xPass}
          passSet={settings.xPassSet === "true"}
          onUser={(xUser) => setForm({ ...form, xUser })}
          onPass={(xPass) => setForm({ ...form, xPass })}
        />
        <CredField
          label="TikTok"
          user={form.tiktokUser}
          pass={form.tiktokPass}
          passSet={settings.tiktokPassSet === "true"}
          onUser={(tiktokUser) => setForm({ ...form, tiktokUser })}
          onPass={(tiktokPass) => setForm({ ...form, tiktokPass })}
        />
      </div>

      <div className="panel space-y-4 rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-[var(--gold)]" />
          <h2 className="text-sm font-semibold">{t("monitorSites")}</h2>
        </div>
        <p className="text-xs text-[var(--muted)]">{t("monitorSitesHint")}</p>
        <ul className="space-y-2">
          {sites.map((site) => (
            <li key={site.id} className="flex items-center gap-2 rounded-xl border border-[var(--line)] px-3 py-2 text-sm">
              <span className="flex-1 truncate">{site.name} · {site.url}</span>
              <span className="text-[11px] text-[var(--muted)]">{site.status}</span>
              <button type="button" onClick={() => removeSite(site.id)} className="text-[var(--rose)]">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input className="field rounded-xl px-3 py-2 text-sm" placeholder="247eSIM.com" value={newSite.name} onChange={(e) => setNewSite({ ...newSite, name: e.target.value })} />
          <input className="field rounded-xl px-3 py-2 text-sm" placeholder="https://" value={newSite.url} onChange={(e) => setNewSite({ ...newSite, url: e.target.value })} />
          <button type="button" onClick={addSite} className="btn-quiet inline-flex items-center justify-center gap-1 rounded-xl px-3 text-sm">
            <Plus size={14} /> {t("add")}
          </button>
        </div>
      </div>

      <div className="panel space-y-4 rounded-2xl p-6">
        <h2 className="text-sm font-semibold">{t("scrapeSites")}</h2>
        <p className="text-xs text-[var(--muted)]">{t("scrapeSitesHint")}</p>
        <ul className="space-y-2">
          {targets.map((row, i) => (
            <li key={`${row.url}-${i}`} className="flex items-center gap-2 rounded-xl border border-[var(--line)] px-3 py-2 text-sm">
              <span className="flex-1 truncate">{row.name} · {row.country} · {row.url}</span>
              <button type="button" onClick={() => setTargets((list) => list.filter((_, idx) => idx !== i))} className="text-[var(--rose)]">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
        <div className="grid gap-2 md:grid-cols-2">
          <input className="field rounded-xl px-3 py-2 text-sm" placeholder="Airalo" value={newTarget.name} onChange={(e) => setNewTarget({ ...newTarget, name: e.target.value })} />
          <input className="field rounded-xl px-3 py-2 text-sm" placeholder="United States" value={newTarget.country} onChange={(e) => setNewTarget({ ...newTarget, country: e.target.value, countryCode: e.target.value.slice(0, 2).toUpperCase() })} />
          <input className="field rounded-xl px-3 py-2 text-sm md:col-span-2" placeholder="https://www.airalo.com/..." value={newTarget.url} onChange={(e) => setNewTarget({ ...newTarget, url: e.target.value })} />
        </div>
        <button
          type="button"
          onClick={() => {
            if (!newTarget.url || !newTarget.name) return;
            setTargets((list) => [...list, newTarget]);
            setNewTarget({ name: "", url: "", country: "", countryCode: "" });
          }}
          className="btn-quiet inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm"
        >
          <Plus size={14} /> {t("add")}
        </button>
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

function CredField({
  label,
  user,
  pass,
  passSet,
  extra,
  extraLabel,
  onUser,
  onPass,
  onExtra,
}: {
  label: string;
  user: string;
  pass: string;
  passSet: boolean;
  extra?: string;
  extraLabel?: string;
  onUser: (v: string) => void;
  onPass: (v: string) => void;
  onExtra?: (v: string) => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] p-3">
      <div className="mb-2 text-xs font-semibold text-[var(--muted)]">{label}</div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input className="field rounded-xl px-3 py-2 text-sm" placeholder="User ID / email" value={user} onChange={(e) => onUser(e.target.value)} autoComplete="off" />
        <input
          className="field rounded-xl px-3 py-2 text-sm"
          placeholder={passSet ? "Saved — type to replace" : "Password or app token"}
          value={pass}
          onChange={(e) => onPass(e.target.value)}
          type="password"
          autoComplete="new-password"
        />
        {onExtra ? (
          <input className="field rounded-xl px-3 py-2 text-sm sm:col-span-2" placeholder={extraLabel} value={extra} onChange={(e) => onExtra(e.target.value)} />
        ) : null}
      </div>
    </div>
  );
}
