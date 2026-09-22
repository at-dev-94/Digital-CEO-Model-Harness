export type VoicePresetId = "en-GB-female" | "en-GB-male" | "en-US-female" | "en-US-male";

export type VoicePreset = {
  id: VoicePresetId;
  label: string;
  locale: "en-GB" | "en-US";
  gender: "female" | "male";
  pitch: number;
};

export const VOICE_PRESETS: VoicePreset[] = [
  { id: "en-GB-female", label: "British 🇬🇧 Female — warm", locale: "en-GB", gender: "female", pitch: 1.08 },
  { id: "en-GB-male", label: "British 🇬🇧 Male — formal", locale: "en-GB", gender: "male", pitch: 0.88 },
  { id: "en-US-female", label: "American 🇺🇸 Female — bright", locale: "en-US", gender: "female", pitch: 1.06 },
  { id: "en-US-male", label: "American 🇺🇸 Male — confident", locale: "en-US", gender: "male", pitch: 0.86 },
];

export function getVoicePreset(id?: string | null): VoicePreset {
  return VOICE_PRESETS.find((p) => p.id === id) || VOICE_PRESETS[1];
}

function genderOf(name: string): "female" | "male" | "unknown" {
  const n = name.toLowerCase();
  if (/(female|woman|girl|hazel|susan|zira|samantha|karen|moira|tessa|victoria|aria|jenny|sara|sonia|libby|serena)/.test(n)) {
    return "female";
  }
  if (/(male|man|boy|david|mark|george|daniel|ravi|guy|ryan|andrew|brian|thomas|ryan|steffan|christopher)/.test(n)) {
    return "male";
  }
  return "unknown";
}

export function matchBrowserVoice(
  voices: SpeechSynthesisVoice[],
  preset: VoicePreset,
  fallbackLang?: "en" | "bn",
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  if (fallbackLang === "bn") {
    return voices.find((v) => v.lang.toLowerCase().startsWith("bn")) || voices.find((v) => v.lang.toLowerCase().startsWith("en")) || voices[0];
  }

  const locale = preset.locale.toLowerCase();
  const localeHit = voices.filter((v) => v.lang.toLowerCase().startsWith(locale) || v.lang.toLowerCase().replace("_", "-").startsWith(locale));
  const pool = localeHit.length ? localeHit : voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const gendered = pool.find((v) => genderOf(v.name) === preset.gender);
  return gendered || pool[0] || voices[0];
}
