"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Mic, Send } from "lucide-react";
import { useApp } from "@/components/Providers";

type Msg = { id: string; role: string; content: string; model?: string | null };

export default function ChatPage() {
  const { t, lang } = useApp();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/chat");
      if (!res.ok) return;
      const data = await res.json();
      const first = data.conversations?.[0];
      if (first) {
        setConversationId(first.id);
        setMessages(first.messages || []);
      }
    })();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(value = text) {
    if (!value.trim()) return;
    setBusy(true);
    setText("");
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: value }]);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: value, conversationId, language: lang }),
    });
    const data = await res.json();
    setConversationId(data.conversationId);
    if (data.message) setMessages((m) => [...m, data.message]);
    setBusy(false);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send();
  }

  function listen() {
    const SR = (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition
      || (window as Window & { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition;
    if (!SR) {
      alert("Voice is available in Chrome/Edge. Type instead, or use the mic on a supported browser.");
      return;
    }
    const rec = new SR();
    rec.lang = lang === "bn" ? "bn-BD" : "en-GB";
    rec.onresult = (ev: SpeechRecognitionEvent) => {
      const said = ev.results[0][0].transcript;
      setText(said);
      void send(said);
    };
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col">
      <div className="mb-4">
        <div className="text-xs tracking-[0.2em] text-[var(--gold)] uppercase">{t("chat")}</div>
        <p className="text-sm text-[var(--muted)]">{t("voiceHint")}</p>
      </div>
      <div className="panel flex-1 space-y-4 overflow-y-auto rounded-3xl p-5">
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${m.role === "user" ? "ml-auto bg-[var(--gold)] text-[#071018]" : "bg-white/5"}`}>
            <div className="whitespace-pre-wrap">{m.content}</div>
            {m.model ? <div className="mt-1 text-[10px] opacity-60">{m.model}</div> : null}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <button type="button" onClick={listen} className={`rounded-2xl border border-[var(--line)] px-4 ${listening ? "text-[var(--rose)]" : ""}`}>
          <Mic size={18} />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("placeholder")}
          className="flex-1 rounded-2xl border border-[var(--line)] bg-black/30 px-4 py-3 outline-none"
        />
        <button disabled={busy} className="rounded-2xl bg-[var(--gold)] px-5 text-[#071018]">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

type SpeechRecognition = {
  lang: string;
  start: () => void;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionEvent = { results: { 0: { 0: { transcript: string } } } };
