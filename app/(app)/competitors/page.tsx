"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApp } from "@/components/Providers";

type Price = {
  id: string;
  provider: string;
  country: string;
  planName: string;
  priceUsd: number;
  source: string;
  scrapedAt: string;
};
type Rec = {
  id: string;
  country: string;
  planName: string;
  suggestedUsd: number;
  competitorMin: number;
  competitorAvg: number;
  rationale: string;
};

export default function CompetitorsPage() {
  const { t } = useApp();
  const [prices, setPrices] = useState<Price[]>([]);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/competitors");
    if (!res.ok) return;
    const data = await res.json();
    setPrices(data.prices || []);
    setRecs(data.recs || []);
  }
  useEffect(() => {
    void load();
  }, []);

  async function refresh() {
    setBusy(true);
    await fetch("/api/competitors", { method: "POST" });
    await load();
    setBusy(false);
  }

  const chart = useMemo(() => {
    const map = new Map<string, { country: string; Airalo?: number; Saily?: number; Nomad?: number }>();
    for (const p of prices) {
      const row = map.get(p.country) || { country: p.country };
      row[p.provider as "Airalo" | "Saily" | "Nomad"] = p.priceUsd;
      map.set(p.country, row);
    }
    return [...map.values()];
  }, [prices]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-[0.16em] text-[var(--gold)] uppercase">{t("competitors")}</div>
          <h1 className="text-xl font-semibold">Airalo · Saily · Nomad</h1>
        </div>
        <button onClick={refresh} className="btn-accent rounded-full px-4 py-2 text-sm font-medium">
          {busy ? "…" : t("refreshMarket")}
        </button>
      </div>
      <div className="panel h-80 rounded-2xl p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart}>
            <CartesianGrid stroke="#eef2f8" vertical={false} />
            <XAxis dataKey="country" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f3", fontSize: 12 }}
              cursor={{ fill: "rgba(37,99,235,0.05)" }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Airalo" fill="#2563eb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Saily" fill="#0d9488" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Nomad" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {recs.map((r) => (
          <article key={r.id} className="panel rounded-2xl p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">{r.country}</div>
            <h2 className="mt-1 text-lg font-medium">{r.planName}</h2>
            <p className="mt-2 text-3xl font-semibold text-[var(--teal)]">${r.suggestedUsd.toFixed(2)}</p>
            <p className="text-sm text-[var(--muted)]">
              {t("vsMarket")}: ${r.competitorMin.toFixed(2)} · avg ${r.competitorAvg.toFixed(2)}
            </p>
            <p className="mt-3 text-sm leading-6">{r.rationale}</p>
          </article>
        ))}
      </div>
      <div className="panel overflow-x-auto rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="soft text-left text-[var(--muted)]">
            <tr>
              <th className="p-3">Provider</th>
              <th className="p-3">Country</th>
              <th className="p-3">Plan</th>
              <th className="p-3">USD</th>
              <th className="p-3">{t("source")}</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((p) => (
              <tr key={p.id} className="border-t border-[var(--line)]">
                <td className="p-3">{p.provider}</td>
                <td className="p-3">{p.country}</td>
                <td className="p-3">{p.planName}</td>
                <td className="p-3">${p.priceUsd.toFixed(2)}</td>
                <td className="p-3 text-[var(--muted)]">{p.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
