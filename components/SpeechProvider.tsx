"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Lang } from "@/lib/i18n";
import { getVoicePreset, matchBrowserVoice } from "@/lib/voices";
import { useApp } from "./Providers";

type ReaderEntry = { id: string; label: string; getText: () => string };

type SpeechState = {
  supported: boolean;
  speaking: boolean;
  paused: boolean;
  speak: (text: string, lang?: Lang, presetId?: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  readPrimary: () => void;
  registerReader: (entry: ReaderEntry) => () => void;
  hasReader: boolean;
  wakeSupported: boolean;
  wakeEnabled: boolean;
  setWakeEnabled: (value: boolean) => void;
  heard: string;
  assistantName: string;
};

const Ctx = createContext<SpeechState | null>(null);

type RecognitionResult = { 0: { transcript: string }; isFinal: boolean };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};

function recognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/** Strips markdown scaffolding so the voice reads prose, not punctuation. */
function toSpeakable(raw: string) {
  return raw
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[*_`#>]/g, "")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/^\s*[-•]\s*/gm, ", ")
    .replace(/\n{2,}/g, ". \n")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const READ_WORDS = /\b(read|speak|say|tell|brief|aloud)\b|পড়|শোনাও|বল/i;
const STOP_WORDS = /\b(stop|quiet|silence|enough)\b|থাম|চুপ/i;

export function SpeechProvider({ children }: { children: React.ReactNode }) {
  const { lang, settings } = useApp();
  const assistantName = settings.assistantName || "Nova";
  const voiceRate = Number(settings.voiceRate || "1") || 1;
  const voicePreset = settings.voicePreset || "en-GB-male";

  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [wakeEnabled, setWakeEnabled] = useState(false);
  const [heard, setHeard] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [readerCount, setReaderCount] = useState(0);

  const [wakeSupported, setWakeSupported] = useState(false);

  const readers = useRef<ReaderEntry[]>([]);
  const recognition = useRef<Recognition | null>(null);
  const wantsWake = useRef(false);
  const speakingRef = useRef(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    setWakeSupported(Boolean(recognitionCtor()));
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, []);

  const pickVoice = useCallback(
    (target: Lang, presetId?: string) => {
      const preset = getVoicePreset(presetId || voicePreset);
      return matchBrowserVoice(voices, preset, target);
    },
    [voices, voicePreset],
  );

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    speakingRef.current = false;
    setSpeaking(false);
    setPaused(false);
  }, []);

  const speak = useCallback(
    (text: string, target?: Lang, presetId?: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const body = toSpeakable(text);
      if (!body) return;
      const useLang = target || lang;
      const preset = getVoicePreset(presetId || voicePreset);

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(body);
      utterance.lang = useLang === "bn" ? "bn-BD" : preset.locale;
      utterance.rate = Math.min(2, Math.max(0.5, voiceRate));
      utterance.pitch = preset.pitch;
      const voice = pickVoice(useLang, presetId);
      if (voice) utterance.voice = voice;

      utterance.onstart = () => {
        speakingRef.current = true;
        setSpeaking(true);
        setPaused(false);
      };
      const finish = () => {
        speakingRef.current = false;
        setSpeaking(false);
        setPaused(false);
      };
      utterance.onend = finish;
      utterance.onerror = finish;

      window.speechSynthesis.speak(utterance);
    },
    [lang, pickVoice, voiceRate, voicePreset],
  );

  const pause = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.pause();
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.resume();
    setPaused(false);
  }, []);

  const registerReader = useCallback((entry: ReaderEntry) => {
    readers.current = [...readers.current.filter((r) => r.id !== entry.id), entry];
    setReaderCount(readers.current.length);
    return () => {
      readers.current = readers.current.filter((r) => r.id !== entry.id);
      setReaderCount(readers.current.length);
    };
  }, []);

  const readPrimary = useCallback(() => {
    const entry = readers.current[0];
    if (!entry) {
      speak(
        lang === "bn"
          ? "এই পাতায় পড়ে শোনানোর মতো কিছু নেই।"
          : "There is nothing to read on this page yet.",
      );
      return;
    }
    const text = entry.getText();
    if (!text.trim()) {
      speak(lang === "bn" ? "ব্রিফ এখনো তৈরি হয়নি।" : "The brief has not been generated yet.");
      return;
    }
    speak(`${entry.label}. ${text}`);
  }, [lang, speak]);

  const handleTranscript = useCallback(
    (transcript: string) => {
      setHeard(transcript);
      const said = transcript.toLowerCase();
      if (!said.includes(assistantName.toLowerCase())) return;
      if (STOP_WORDS.test(said)) {
        stop();
        return;
      }
      if (READ_WORDS.test(said)) readPrimary();
    },
    [assistantName, readPrimary, stop],
  );

  // Continuous wake-word listening. Recognition is restarted on end because
  // browsers close the stream after a few seconds of silence.
  useEffect(() => {
    wantsWake.current = wakeEnabled;
    const Ctor = recognitionCtor();
    if (!Ctor) return;

    if (!wakeEnabled) {
      recognition.current?.abort();
      recognition.current = null;
      setHeard("");
      return;
    }

    const instance = new Ctor();
    instance.lang = lang === "bn" ? "bn-BD" : "en-US";
    instance.continuous = true;
    instance.interimResults = false;

    instance.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result?.isFinal) handleTranscript(result[0].transcript.trim());
      }
    };
    instance.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        wantsWake.current = false;
        setWakeEnabled(false);
      }
    };
    instance.onend = () => {
      if (!wantsWake.current) return;
      // Don't reopen the mic while the assistant is talking, or it hears itself.
      const delay = speakingRef.current ? 1200 : 300;
      setTimeout(() => {
        if (!wantsWake.current) return;
        try {
          instance.start();
        } catch {
          /* already started */
        }
      }, delay);
    };

    try {
      instance.start();
      recognition.current = instance;
    } catch {
      /* ignore */
    }

    return () => {
      wantsWake.current = false;
      instance.onend = null;
      instance.abort();
    };
  }, [wakeEnabled, lang, handleTranscript]);

  const value = useMemo<SpeechState>(
    () => ({
      supported,
      speaking,
      paused,
      speak,
      pause,
      resume,
      stop,
      readPrimary,
      registerReader,
      hasReader: readerCount > 0,
      wakeSupported,
      wakeEnabled,
      setWakeEnabled,
      heard,
      assistantName,
    }),
    [
      supported,
      speaking,
      paused,
      speak,
      pause,
      resume,
      stop,
      readPrimary,
      registerReader,
      readerCount,
      wakeSupported,
      wakeEnabled,
      heard,
      assistantName,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSpeech() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSpeech outside SpeechProvider");
  return ctx;
}

/** Registers page text as the target for the read-aloud button and wake word. */
export function useReadable(id: string, label: string, text: string) {
  const { registerReader } = useSpeech();
  const latest = useRef(text);
  latest.current = text;
  useEffect(() => registerReader({ id, label, getText: () => latest.current }), [id, label, registerReader]);
}
