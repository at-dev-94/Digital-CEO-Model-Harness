"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/Providers";
import { periodLabel } from "@/lib/i18n";

type BriefData = {
  brief?: { content: string; createdAt: string; title: string };
  emails: Array<{ id: string; fromName: string; subject: string; priority: string; status: string }>;
  meetings: Array<{ id: string; title: string; startAt: string; prepNote?: string | null }>;
  approvals: Array<{ id: string; title: string; type: string; risk: string }>;
  posts: Array<{ id: string; platform: string; caption: string; status: string }>;
  recs: Array<{ id: string; country: string; suggestedUsd: number; competitorMin: number; planName: string }>;
};

export default function BriefPage() {
  const { t, lang, user, refreshMe } = useApp();
  const [data, setData] = useState<BriefData | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/brief");
    if (res.ok) setData(await res.json());
  }

  useEffect(() => {
    void load();
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs tracking-[0.2em] text-[var(--gold)] uppercase">{t("brief")}</div>
          <h1 className="mt-1 text-3xl font-semibold">
            {t("greeting", { period: periodLabel(lang) })}, {user?.name || "Eshmum"}
          </h1>
        </div>
        <button onClick={rebuild} className="rounded-full bg-[var(--gold)] px-4 py-2 text-sm text-[#071018]">
          {busy ? "…" : t("generateBrief")}
        </button>
      </div>

      <section className="panel whitespace-pre-wrap rounded-3xl p-6 leading-7 text-[15px]">
        {data?.brief?.content || t("noItems")}
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title={t("urgentEmails")} items={(data?.emails || []).filter((e) => e.priority === "urgent").map((e) => `${e.fromName}: ${e.subject}`)} />
        <Card title={t("todayMeetings")} items={(data?.meetings || []).map((m) => m.title)} />
        <Card title={t("approvals")} items={(data?.approvals || []).map((a) => a.title)} />
        <Card
          title={t("priceAlerts")}
          items={(data?.recs || []).map((r) => `${r.country} ${r.planName} → $${r.suggestedUsd} (min $${r.competitorMin})`)}
        />
      </div>
    </div>
  );
}

function Card({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="panel rounded-2xl p-5">
      <div className="text-xs tracking-widest text-[var(--gold)] uppercase">{title}</div>
      <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
        {items.length ? items.slice(0, 4).map((item) => <li key={item}>{item}</li>) : <li>—</li>}
      </ul>
    </div>
  );
}
