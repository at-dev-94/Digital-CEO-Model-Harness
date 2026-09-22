"use client";

import { FormEvent, useEffect, useState } from "react";
import { useApp } from "@/components/Providers";
import { SpeakButton } from "@/components/SpeakButton";

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
      <form onSubmit={onSubmit} className="panel rounded-2xl p-5">
        <div className="flex flex-wrap gap-2">
          {["plan", "proposal", "analysis", "brainstorm"].map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => setKind(k)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${
                kind === k ? "btn-accent" : "btn-quiet"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="field mt-4 h-28 w-full rounded-2xl p-3 text-sm"
        />
        <button className="mt-3 rounded-full bg-[var(--teal)] px-4 py-2 text-sm font-medium text-white">
          {t("compose")}
        </button>
      </form>
      {docs.map((d) => (
        <article key={d.id} className="panel rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">{d.kind}</div>
            <SpeakButton text={d.content} />
          </div>
          <h2 className="mt-1 text-lg font-medium">{d.title}</h2>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-7">{d.content}</pre>
        </article>
      ))}
    </div>
  );
}
