"use client";

import { useEffect, useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApp } from "@/components/Providers";

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
          <div className="text-xs tracking-[0.2em] text-[var(--gold)] uppercase">{t("social")}</div>
          <h1 className="text-2xl font-semibold">Facebook · Instagram · TikTok</h1>
        </div>
        <button onClick={generate} className="rounded-full bg-[var(--gold)] px-4 py-2 text-sm text-[#071018]">
          {busy ? "…" : t("generatePosts")}
        </button>
      </div>
      {performance.length ? (
        <div className="panel h-64 rounded-3xl p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performance}>
              <XAxis dataKey="name" stroke="#9aa7b5" />
              <YAxis stroke="#9aa7b5" />
              <Tooltip contentStyle={{ background: "#0c1824", border: "1px solid #b8892d" }} />
              <Line type="monotone" dataKey="impressions" stroke="#e2c275" />
              <Line type="monotone" dataKey="likes" stroke="#3ee0c6" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((p) => (
          <article key={p.id} className="panel rounded-2xl p-5">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-[var(--muted)]">
              <span>{p.platform}</span>
              <span>{p.status}</span>
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
