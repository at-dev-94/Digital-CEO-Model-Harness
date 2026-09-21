export type TaskKind =
  | "general"
  | "writing"
  | "research"
  | "fast"
  | "vision"
  | "social"
  | "email"
  | "brief"
  | "pricing"
  | "plan"
  | "brainstorm";

export type HarnessMessage = { role: "system" | "user" | "assistant"; content: string };

const MODEL_MAP: Record<TaskKind, string> = {
  general: process.env.OPENROUTER_MODEL_GENERAL || "openai/gpt-4o-mini",
  writing: process.env.OPENROUTER_MODEL_WRITING || "anthropic/claude-3.5-sonnet",
  research: process.env.OPENROUTER_MODEL_RESEARCH || "x-ai/grok-beta",
  fast: process.env.OPENROUTER_MODEL_FAST || "deepseek/deepseek-chat",
  vision: process.env.OPENROUTER_MODEL_VISION || "google/gemini-flash-1.5",
  social: process.env.OPENROUTER_MODEL_WRITING || "anthropic/claude-3.5-sonnet",
  email: process.env.OPENROUTER_MODEL_GENERAL || "openai/gpt-4o-mini",
  brief: process.env.OPENROUTER_MODEL_FAST || "deepseek/deepseek-chat",
  pricing: process.env.OPENROUTER_MODEL_RESEARCH || "x-ai/grok-beta",
  plan: process.env.OPENROUTER_MODEL_WRITING || "anthropic/claude-3.5-sonnet",
  brainstorm: process.env.OPENROUTER_MODEL_WRITING || "anthropic/claude-3.5-sonnet",
};

export function detectTask(text: string): TaskKind {
  const q = text.toLowerCase();
  if (/(price|competitor|airalo|saily|nomad|বাজার|দাম)/i.test(q)) return "pricing";
  if (/(post|instagram|tiktok|facebook|seo|geo|সোশ্যাল|পোস্ট)/i.test(q)) return "social";
  if (/(email|inbox|reply|ইমেইল)/i.test(q)) return "email";
  if (/(brief|report|today|ব্রিফ|রিপোর্ট)/i.test(q)) return "brief";
  if (/(business plan|proposal|পরিকল্পনা|প্রস্তাব)/i.test(q)) return "plan";
  if (/(brainstorm|idea|চিন্তা)/i.test(q)) return "brainstorm";
  if (/(research|scrape|monitor)/i.test(q)) return "research";
  return "general";
}

export function detectLanguage(text: string): "en" | "bn" {
  return /[\u0980-\u09FF]/.test(text) ? "bn" : "en";
}

function companyName() {
  return process.env.COMPANY_NAME || "Eshmum eSIM";
}

export function systemPrompt(lang: "en" | "bn") {
  const bilingual =
    lang === "bn"
      ? "Reply in natural Bengali (বাংলা), with English only for brand names, prices and URLs."
      : "Reply in clear executive English. If the user writes Bengali, reply in Bengali.";
  return `You are Digital CEO, the approval-first chief of staff for ${companyName()}, a travel eSIM business competing with Airalo, Saily and Nomad.

Rules:
- You draft. You never send email, post socially, change prices or book meetings unless the dashboard execution mode is Auto and the action is low-risk.
- High-stakes actions become pending approvals.
- Be concise, structured, and useful to a busy owner.
- Use current competitor context when discussing pricing.
- Daily social target: 3–4 posts across Facebook, Instagram and TikTok with SEO/GEO keywords.
- ${bilingual}
- Never invent that an action already happened.`;
}

function mockReply(kind: TaskKind, userText: string, lang: "en" | "bn") {
  const bn = lang === "bn";
  if (kind === "pricing") {
    return bn
      ? "বাজার স্ক্যান: যুক্তরাষ্ট্র ১০GB-এ Airalo প্রায় $২২.৫০, Saily $২২.৯৯, Nomad $২০–২৫। প্রস্তাব: ১০GB/৩০ দিন $১৮.৯০ — সবচেয়ে সস্তার নিচে ~৫–৮%, মার্জিন রেখে। অনুমোদন কিউতে পাঠানো হয়েছে।"
      : "Market scan: USA 10GB sits near Airalo $22.50, Saily $22.99, Nomad $20–25. Recommend 10GB/30d at $18.90 — about 5–8% under the cheapest while keeping margin. Queued as a pricing approval.";
  }
  if (kind === "social") {
    return bn
      ? "৪টি খসড়া তৈরি করেছি (IG/FB/TikTok)। SEO: turkey esim, istanbul internet, travel esim. অনুমোদন ছাড়া পোস্ট হবে না — Approvals পাতায় এক ক্লিকে পাঠাতে পারবেন।"
      : "Drafted 4 posts (IG/FB/TikTok) with SEO/GEO keywords (turkey esim, istanbul internet, travel esim). Nothing publishes until you approve — one-click from Approvals.";
  }
  if (kind === "email") {
    return bn
      ? "জরুরি ইনবক্স সাজিয়ে খসড়া উত্তর তৈরি করেছি। ক্লায়েন্ট মেইল পাঠানোর আগে আপনার অনুমোদন লাগবে।"
      : "Triaged the urgent inbox and drafted replies. Client-facing mail still needs your approval.";
  }
  if (kind === "plan") {
    return bn
      ? "৩ মাসের গো-টু-মার্কেট খসড়া: যুক্তরাজ্য/বাংলাদেশ ডায়াস্পোরা, তুরস্ক ও GCC করিডোর। Workspace-এ পূর্ণ নথি সেভ হয়েছে।"
      : "Drafted a 90-day go-to-market: UK/Bangladesh diaspora, Turkey and GCC corridors. Full note saved in Workspace.";
  }
  return bn
    ? `বুঝেছি: “${userText.slice(0, 180)}”। আমি খসড়া ও অগ্রাধিকার তৈরি করতে পারি — পাঠানোর আগে অনুমোদন লাগবে। OPENAI_API_KEY বা OPENROUTER_API_KEY যোগ করলে লাইভ মডেল চালু হবে।`
    : `Understood: “${userText.slice(0, 180)}”. I can draft, prioritise and queue work — sending still needs approval. Add OPENAI_API_KEY or OPENROUTER_API_KEY for live models.`;
}

function openaiModel() {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

async function completeChat(opts: {
  model: string;
  messages: HarnessMessage[];
  temperature: number;
}): Promise<{ text: string; model: string } | { error: string; model: string }> {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const openrouterKey = process.env.OPENROUTER_API_KEY?.trim();

  if (openaiKey) {
    const candidates = [opts.model, process.env.OPENAI_FALLBACK_MODEL || "gpt-4o-mini"].filter(
      (name, i, arr) => name && arr.indexOf(name) === i,
    );
    let lastError = "";
    for (const model of candidates) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: opts.messages,
          temperature: opts.temperature,
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const text = json.choices?.[0]?.message?.content?.trim() || "";
        return { text, model: `openai/${model}` };
      }
      lastError = await res.text();
    }
    return { error: lastError.slice(0, 220), model: `openai/${opts.model}` };
  }

  if (openrouterKey) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Digital CEO",
      },
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        temperature: opts.temperature,
      }),
    });
    if (!res.ok) {
      return { error: (await res.text()).slice(0, 220), model: opts.model };
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return { text: json.choices?.[0]?.message?.content?.trim() || "", model: opts.model };
  }

  return { error: "no-key", model: "harness-mock" };
}

export async function runHarness(opts: {
  kind?: TaskKind;
  messages: HarnessMessage[];
  language?: "en" | "bn";
}) {
  const lastUser = [...opts.messages].reverse().find((m) => m.role === "user")?.content || "";
  const kind = opts.kind || detectTask(lastUser);
  const language = opts.language || detectLanguage(lastUser);
  const usingOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim());
  const model = usingOpenAI ? openaiModel() : MODEL_MAP[kind];
  const payload = [
    { role: "system" as const, content: systemPrompt(language) },
    ...opts.messages,
  ];

  const result = await completeChat({
    model,
    messages: payload,
    temperature: kind === "pricing" ? 0.2 : 0.5,
  });

  if ("error" in result) {
    if (result.error === "no-key") {
      return { text: mockReply(kind, lastUser, language), model: "harness-mock", kind, language };
    }
    return {
      text: mockReply(kind, lastUser, language) + `\n\n(Live model unavailable: ${result.error})`,
      model: "harness-mock",
      kind,
      language,
    };
  }

  return {
    text: result.text || mockReply(kind, lastUser, language),
    model: result.model,
    kind,
    language,
  };
}
