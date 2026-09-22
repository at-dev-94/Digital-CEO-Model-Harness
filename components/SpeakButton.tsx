"use client";

import { Pause, Play, Square, Volume2 } from "lucide-react";
import { useApp } from "./Providers";
import { useSpeech } from "./SpeechProvider";

type Props = {
  text: string;
  label?: string;
  variant?: "solid" | "quiet" | "icon";
  className?: string;
};

export function SpeakButton({ text, label, variant = "quiet", className = "" }: Props) {
  const { t } = useApp();
  const { supported, speaking, paused, speak, pause, resume, stop } = useSpeech();

  const disabled = !supported || !text.trim();

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={() => (speaking ? stop() : speak(text))}
        disabled={disabled}
        title={speaking ? t("stopReading") : t("readAloud")}
        aria-label={speaking ? t("stopReading") : t("readAloud")}
        className={`grid h-8 w-8 place-items-center rounded-full text-[var(--muted)] transition hover:bg-[var(--gold-soft)] hover:text-[var(--gold)] disabled:opacity-40 ${className}`}
      >
        {speaking ? <Square size={13} /> : <Volume2 size={15} />}
      </button>
    );
  }

  const base =
    variant === "solid"
      ? "btn-accent"
      : "btn-quiet";

  if (!speaking) {
    return (
      <button
        type="button"
        onClick={() => speak(text)}
        disabled={disabled}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50 ${base} ${className}`}
      >
        <Volume2 size={15} />
        {label || t("readAloud")}
      </button>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full p-1 ${base} ${className}`}>
      <button
        type="button"
        onClick={() => (paused ? resume() : pause())}
        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
      >
        {paused ? <Play size={14} /> : <Pause size={14} />}
        {paused ? t("resumeReading") : t("reading")}
      </button>
      <button
        type="button"
        onClick={stop}
        title={t("stopReading")}
        aria-label={t("stopReading")}
        className="grid h-7 w-7 place-items-center rounded-full hover:bg-black/5"
      >
        <Square size={12} />
      </button>
    </span>
  );
}
