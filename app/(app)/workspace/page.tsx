"use client";

import { FormEvent, useEffect, useState } from "react";
import { useApp } from "@/components/Providers";

type Doc = { id: string; kind: string; title: string; content: string };

export default function WorkspacePage() {
  const { t, lang } = useApp();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [prompt, setPrompt] = useState("90-day plan to beat Airalo on UK↔BD diaspora and Turkey tourism.");
  const [kind, setKind] = useState("plan");

  async function load() {
    const res = await fetch("/api/workspace");
    if (res.ok) setDocs((await res.json()).docs || []);
  }
  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, prompt, language: lang }),
    });
    await load();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="panel rounded-3xl p-5">
        <div className="flex flex-wrap gap-2">
          {["plan", "proposal", "analysis", "brainstorm"].map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => setKind(k)}
              className={`rounded-full px-3 py-1 text-sm ${kind === k ? "bg-[var(--gold)] text-[#071018]" : "border border-[var(--line)]"}`}
            >
              {k}
            </button>
          ))}
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="mt-4 h-28 w-full rounded-2xl border border-[var(--line)] bg-black/30 p-3"
        />
        <button className="mt-3 rounded-full bg-[var(--teal)] px-4 py-2 text-sm text-[#071018]">{t("compose")}</button>
      </form>
      {docs.map((d) => (
        <article key={d.id} className="panel rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-[var(--gold)]">{d.kind}</div>
          <h2 className="mt-1 text-xl">{d.title}</h2>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-7">{d.content}</pre>
        </article>
      ))}
    </div>
  );
}
