"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Mic, Send } from "lucide-react";
import { useApp } from "@/components/Providers";
import { SpeakButton } from "@/components/SpeakButton";
import { useReadable, useSpeech } from "@/components/SpeechProvider";

type Msg = { id: string; role: string; content: string; model?: string | null };

export default function ChatPage() {
  const { t, lang, settings } = useApp();
  const { speak } = useSpeech();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const autoSpeak = settings.readAloud !== "false";

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")?.content || "";
  useReadable("chat-reply", t("chat"), lastAssistant);

  const send = useCallback(
    async (value: string, currentConversationId?: string) => {
      if (!value.trim()) return;
      setBusy(true);
      setText("");
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: value }]);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: value, conversationId: currentConversationId, language: lang }),
        });
        const data = await res.json().catch(() => ({ error: "Bad response" }));
        if (res.status === 401) {
          window.location.href = `/login?next=${encodeURIComponent("/chat")}`;
          return;
        }
        if (!res.ok || !data.message) {
          setMessages((m) => [
            ...m,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: data.error ? `${t("chatError")} (${data.error})` : t("chatError"),
            },
          ]);
          return;
        }
        setConversationId(data.conversationId);
        setMessages((m) => [...m, data.message]);
        if (autoSpeak) speak(data.message.content);
      } catch {
        setMessages((m) => [
          ...m,
          { id: crypto.randomUUID(), role: "assistant", content: t("chatError") },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [autoSpeak, lang, speak, t],
  );

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/chat", { credentials: "include" });
      let activeId: string | undefined;
      if (res.ok) {
        const data = await res.json();
        const first = data.conversations?.[0];
        if (first) {
          activeId = first.id;
          setConversationId(first.id);
          setMessages(first.messages || []);
        }
      }
      const ask = new URLSearchParams(window.location.search).get("ask");
      if (ask) {
        window.history.replaceState(null, "", "/chat");
        await send(ask, activeId);
      }
    })();
    // Load history once on mount. `send` is stable enough for the ?ask= handoff.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(text, conversationId);
  }

  function listen() {
    const SR =
      (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition ||
      (window as Window & { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition;
    if (!SR) {
      alert("Voice input needs Chrome, Edge or Safari. You can type instead.");
      return;
    }
    const rec = new SR();
    rec.lang = lang === "bn" ? "bn-BD" : "en-GB";
    rec.onresult = (ev: SpeechRecognitionEvent) => {
      const said = ev.results[0][0].transcript;
      setText(said);
      void send(said, conversationId);
    };
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-4xl flex-col">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">{t("chat")}</h1>
        <p className="text-sm text-[var(--muted)]">{t("voiceHint")}</p>
      </div>

      <div className="panel flex-1 space-y-3 overflow-y-auto rounded-2xl p-5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
              m.role === "user" ? "ml-auto bg-[var(--gold)] text-white" : "soft"
            }`}
          >
            <div className="whitespace-pre-wrap">{m.content}</div>
            <div className="mt-1 flex items-center gap-2">
              {m.model ? <span className="text-[10px] text-[var(--faint)]">{m.model}</span> : null}
              {m.role === "assistant" ? <SpeakButton text={m.content} variant="icon" /> : null}
            </div>
          </div>
        ))}
        {busy ? (
          <div className="soft max-w-[85%] rounded-2xl px-4 py-3 text-sm text-[var(--muted)]">{t("thinking")}</div>
        ) : null}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={listen}
          title={t("voice")}
          className={`btn-quiet grid w-12 place-items-center rounded-2xl ${listening ? "text-[var(--rose)]" : ""}`}
        >
          <Mic size={18} />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("placeholder")}
          className="field flex-1 rounded-2xl px-4 py-3 text-sm"
        />
        <button disabled={busy} className="btn-accent grid w-14 place-items-center rounded-2xl disabled:opacity-60">
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
