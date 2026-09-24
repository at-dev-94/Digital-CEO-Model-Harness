"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/Providers";
import { SpeakButton } from "@/components/SpeakButton";

type Mail = {
  id: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  body: string;
  priority: string;
  status: string;
  draftReply?: string | null;
};

export default function InboxPage() {
  const { t, refreshMe } = useApp();
  const [items, setItems] = useState<Mail[]>([]);
  const [active, setActive] = useState<Mail | null>(null);

  async function load() {
    const res = await fetch("/api/inbox");
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.items || []);
    setActive((prev) => prev || data.items?.[0] || null);
  }
  useEffect(() => {
    void load();
  }, []);

  async function act(action: "draft" | "queue") {
    if (!active) return;
    const res = await fetch("/api/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: active.id, action }),
    });
    const data = await res.json();
    setActive(data.email);
    await load();
    await refreshMe();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <aside className="panel rounded-2xl p-3">
        {items.map((m) => (
          <button
            key={m.id}
            onClick={() => setActive(m)}
            className={`mb-1 w-full rounded-xl px-3 py-3 text-left transition ${
              active?.id === m.id ? "soft-active" : "hover:bg-white/5"
            }`}
          >
            <div className="flex justify-between text-xs text-[var(--muted)]">
              <span>{m.fromName}</span>
              <span className={m.priority === "urgent" ? "text-[var(--rose)]" : ""}>{m.priority}</span>
            </div>
            <div className="text-sm">{m.subject}</div>
          </button>
        ))}
      </aside>
      {active ? (
        <article className="panel rounded-2xl p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">{t("inbox")}</div>
          <h1 className="mt-2 text-xl font-semibold">{active.subject}</h1>
          <p className="text-sm text-[var(--muted)]">
            {active.fromName} · {active.fromEmail}
          </p>
          <p className="mt-4 whitespace-pre-wrap leading-7">{active.body}</p>
          <div className="gold-line my-6" />
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--teal)]">{t("draftReply")}</div>
            <SpeakButton text={active.draftReply || ""} variant="icon" />
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{active.draftReply || t("noItems")}</p>
          <div className="mt-4 flex gap-2">
            <button onClick={() => act("draft")} className="action-btn edit">
              {t("draftReply")}
            </button>
            <button onClick={() => act("queue")} className="action-btn add">
              {t("oneClick")}
            </button>
          </div>
        </article>
      ) : null}
    </div>
  );
}
