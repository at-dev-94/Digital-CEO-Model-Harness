"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/Providers";

type Event = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  location?: string | null;
  attendees?: string | null;
  prepNote?: string | null;
};

export default function CalendarPage() {
  const { t } = useApp();
  const [events, setEvents] = useState<Event[]>([]);

  async function load() {
    const res = await fetch("/api/calendar");
    if (res.ok) setEvents((await res.json()).events || []);
  }
  useEffect(() => {
    void load();
  }, []);

  async function prep(id: string) {
    await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="text-xs tracking-[0.2em] text-[var(--gold)] uppercase">{t("calendar")}</div>
      {events.map((e) => (
        <article key={e.id} className="panel rounded-2xl p-5">
          <div className="text-xs text-[var(--muted)]">
            {new Date(e.startAt).toLocaleString()} → {new Date(e.endAt).toLocaleTimeString()}
          </div>
          <h2 className="mt-1 text-xl">{e.title}</h2>
          <p className="text-sm text-[var(--muted)]">
            {e.location} {e.attendees ? `· ${e.attendees}` : ""}
          </p>
          <div className="mt-3 text-xs uppercase tracking-widest text-[var(--teal)]">{t("prepNote")}</div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{e.prepNote || t("noItems")}</p>
          <button onClick={() => prep(e.id)} className="mt-4 rounded-full border border-[var(--line)] px-4 py-2 text-sm">
            {t("generateBrief")}
          </button>
        </article>
      ))}
    </div>
  );
}
