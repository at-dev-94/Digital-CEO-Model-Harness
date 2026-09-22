"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/Providers";

type Item = {
  id: string;
  type: string;
  title: string;
  summary: string;
  status: string;
  risk: string;
  createdAt: string;
};

export default function ApprovalsPage() {
  const { t, refreshMe } = useApp();
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState("pending");

  async function load() {
    const res = await fetch("/api/approvals");
    if (res.ok) setItems((await res.json()).items || []);
  }
  useEffect(() => {
    void load();
  }, []);

  async function decide(id: string, decision: "approved" | "rejected") {
    await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision }),
    });
    await load();
    await refreshMe();
  }

  const shown = items.filter((i) => (filter === "all" ? true : i.status === filter));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-[0.16em] text-[var(--gold)] uppercase">{t("approvals")}</div>
          <h1 className="text-xl font-semibold">{t("oneClick")}</h1>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="field rounded-xl px-3 py-2 text-sm"
        >
          <option value="pending">{t("pending")}</option>
          <option value="executed">{t("executed")}</option>
          <option value="rejected">{t("rejected")}</option>
          <option value="all">All</option>
        </select>
      </div>
      <div className="grid gap-4">
        {shown.length === 0 ? <div className="panel rounded-2xl p-6 text-[var(--muted)]">{t("noItems")}</div> : null}
        {shown.map((item) => (
          <article key={item.id} className="panel rounded-2xl p-5">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-[var(--muted)]">
              <span>{item.type}</span>
              <span className={item.risk === "high" ? "text-[var(--rose)]" : "text-[var(--teal)]"}>{item.risk}</span>
              <span>{item.status}</span>
            </div>
            <h2 className="mt-2 text-lg font-medium">{item.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--muted)]">{item.summary}</p>
            {item.status === "pending" ? (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => decide(item.id, "approved")}
                  className="rounded-full bg-[var(--teal)] px-4 py-2 text-sm font-medium text-white"
                >
                  {t("approve")}
                </button>
                <button onClick={() => decide(item.id, "rejected")} className="btn-quiet rounded-full px-4 py-2 text-sm font-medium">
                  {t("reject")}
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
