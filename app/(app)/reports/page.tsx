"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/Providers";

type Report = { id: string; type: string; title: string; content: string; createdAt: string };

export default function ReportsPage() {
  const { t, lang } = useApp();
  const [reports, setReports] = useState<Report[]>([]);

  async function load() {
    const res = await fetch("/api/reports");
    if (res.ok) setReports((await res.json()).reports || []);
  }
  useEffect(() => {
    void load();
  }, []);

  async function create(type: string) {
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, language: lang }),
    });
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => create("daily")} className="rounded-full bg-[var(--gold)] px-4 py-2 text-sm text-[#071018]">
          Daily
        </button>
        <button onClick={() => create("weekly")} className="rounded-full border border-[var(--line)] px-4 py-2 text-sm">
          Weekly
        </button>
        <button onClick={() => create("competitor")} className="rounded-full border border-[var(--line)] px-4 py-2 text-sm">
          Market
        </button>
      </div>
      {reports.map((r) => (
        <article key={r.id} className="panel rounded-2xl p-5">
          <div className="text-xs text-[var(--muted)]">
            {r.type} · {new Date(r.createdAt).toLocaleString()}
          </div>
          <h2 className="mt-1 text-xl">{r.title}</h2>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-7">{r.content}</pre>
        </article>
      ))}
      {reports.length === 0 ? <p className="text-[var(--muted)]">{t("noItems")}</p> : null}
    </div>
  );
}
