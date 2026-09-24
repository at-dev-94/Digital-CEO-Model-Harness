"use client";

import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApp } from "@/components/Providers";
import { SpeakButton } from "@/components/SpeakButton";

type Post = {
  id: string;
  platform: string;
  caption: string;
  captionBn?: string | null;
  hashtags: string;
  status: string;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  seoKeywords: string;
  geoTargets: string;
};

export default function SocialPage() {
  const { t, refreshMe } = useApp();
  const [posts, setPosts] = useState<Post[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/social");
    if (res.ok) setPosts((await res.json()).posts || []);
  }
  useEffect(() => {
    void load();
  }, []);

  async function generate() {
    setBusy(true);
    await fetch("/api/social", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    await load();
    await refreshMe();
    setBusy(false);
  }

  const performance = useMemo(
    () =>
      posts
        .filter((p) => p.impressions)
        .map((p) => ({ name: p.platform, impressions: p.impressions, likes: p.likes })),
    [posts],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-[0.16em] text-[var(--gold)] uppercase">{t("social")}</div>
          <h1 className="text-xl font-semibold">Facebook · Instagram · TikTok</h1>
        </div>
        <button onClick={generate} className="action-btn add">
          {busy ? "…" : t("generatePosts")}
        </button>
      </div>
      {performance.length ? (
        <div className="panel h-64 rounded-2xl p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performance}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6b7688" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6b7688" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f3", fontSize: 12 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="impressions" stroke="#2563eb" strokeWidth={2.4} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="likes" stroke="#0d9488" strokeWidth={2.4} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((p) => (
          <article key={p.id} className="panel rounded-2xl p-5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              <span>{p.platform}</span>
              <span className="flex items-center gap-1">
                {p.status}
                <SpeakButton text={`${p.caption} ${p.hashtags}`} variant="icon" />
              </span>
            </div>
            <p className="mt-3 text-sm leading-6">{p.caption}</p>
            {p.captionBn ? <p className="mt-2 text-sm text-[var(--teal)]">{p.captionBn}</p> : null}
            <p className="mt-3 text-xs text-[var(--muted)]">{p.hashtags}</p>
            <p className="mt-1 text-xs text-[var(--gold)]">SEO {p.seoKeywords} · GEO {p.geoTargets}</p>
            <p className="mt-2 text-xs text-[var(--muted)]">
              {t("impressions")} {p.impressions} · {t("likes")} {p.likes} · {t("comments")} {p.comments} · {t("shares")} {p.shares}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
