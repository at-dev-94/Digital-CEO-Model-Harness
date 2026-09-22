"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/Providers";
import { SpeakButton } from "@/components/SpeakButton";
import { useReadable } from "@/components/SpeechProvider";

type Report = { id: string; type: string; title: string; content: string; createdAt: string };

export default function ReportsPage() {
  const { t, lang } = useApp();
  const [reports, setReports] = useState<Report[]>([]);
  useReadable("latest-report", reports[0]?.title || t("reports"), reports[0]?.content || "");

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
        <button onClick={() => create("daily")} className="btn-accent rounded-full px-4 py-2 text-sm font-medium">
          Daily
        </button>
        <button onClick={() => create("weekly")} className="btn-quiet rounded-full px-4 py-2 text-sm font-medium">
          Weekly
        </button>
        <button onClick={() => create("competitor")} className="btn-quiet rounded-full px-4 py-2 text-sm font-medium">
          Market
        </button>
      </div>
      {reports.map((r) => (
        <article key={r.id} className="panel rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-[var(--muted)]">
              {r.type} · {new Date(r.createdAt).toLocaleString()}
            </div>
            <SpeakButton text={r.content} />
          </div>
          <h2 className="mt-1 text-lg font-medium">{r.title}</h2>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-7">{r.content}</pre>
        </article>
      ))}
      {reports.length === 0 ? <p className="text-[var(--muted)]">{t("noItems")}</p> : null}
    </div>
  );
}
