"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  getRuleBasedReply,
  personas,
  presetPrompts,
  runSelfTests,
  type ChatMessage,
  type PersonaId
} from "@/lib/caesar";

type DisplayMessage = Required<Pick<ChatMessage, "id" | "role" | "content">>;

const welcomeMessages: Record<PersonaId, DisplayMessage[]> = {
  general: [
    {
      id: "welcome-general",
      role: "assistant",
      content:
        "Salve. I am Caesar the commander. Ask me of conquest, discipline, victory, Pompey, or the legions."
    }
  ],
  political: [
    {
      id: "welcome-political",
      role: "assistant",
      content:
        "Salve. I am Caesar the statesman. Ask me of reform, reputation, the Senate, public favor, or the Republic."
    }
  ],
  "final-days": [
    {
      id: "welcome-final-days",
      role: "assistant",
      content:
        "Salve. I am Caesar near the Ides. Ask me of ambition, enemies, honors, betrayal, or how Rome will remember me."
    }
  ]
};

const initialMessagesByPersona: Record<PersonaId, DisplayMessage[]> = {
  general: [...welcomeMessages.general],
  political: [...welcomeMessages.political],
  "final-days": [...welcomeMessages["final-days"]]
};

const personaAccent: Record<PersonaId, string> = {
  general: "border-stone-800 bg-stone-900 text-marble",
  political: "border-clay bg-clay text-white",
  "final-days": "border-laurel bg-laurel text-white"
};

const personaTone: Record<PersonaId, string> = {
  general: "Command, conquest, discipline",
  political: "Reform, reputation, persuasion",
  "final-days": "Ambition, danger, betrayal"
};

export default function CaesarChatbot() {
  const [persona, setPersona] = useState<PersonaId>("general");
  const [input, setInput] = useState("");
  const [messagesByPersona, setMessagesByPersona] =
    useState<Record<PersonaId, DisplayMessage[]>>(initialMessagesByPersona);
  const [loadingPersona, setLoadingPersona] = useState<PersonaId | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const messages = messagesByPersona[persona];
  const loading = loadingPersona === persona;

  const activePersona = useMemo(
    () => personas.find((item) => item.id === persona) ?? personas[0],
    [persona]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loadingPersona) {
      return;
    }

    const targetPersona = persona;
    const personaMessages = messagesByPersona[targetPersona];
    const userMessage: DisplayMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed
    };

    const historyForRequest = [...personaMessages, userMessage].map(({ role, content }) => ({ role, content }));
    setMessagesByPersona((current) => ({
      ...current,
      [targetPersona]: [...current[targetPersona], userMessage]
    }));
    setInput("");

    setLoadingPersona(targetPersona);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: trimmed,
          persona: targetPersona,
          history: historyForRequest.slice(-10)
        })
      });

      const data = await response.json();
      if (!response.ok || !data.reply) {
        throw new Error(data.error ?? "The LLM route did not return a reply.");
      }

      appendAssistant(data.reply, targetPersona);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error.";
      appendAssistant(
        `I could not reach the oracle, so I will answer from my own judgment. (${detail})\n\n${getRuleBasedReply(
          trimmed,
          targetPersona
        )}`,
        targetPersona
      );
    } finally {
      setLoadingPersona(null);
    }
  }

  function appendAssistant(content: string, targetPersona = persona) {
    setMessagesByPersona((current) => ({
      ...current,
      [targetPersona]: [
        ...current[targetPersona],
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content
        }
      ]
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  function resetChat() {
    setMessagesByPersona((current) => ({
      ...current,
      [persona]: [...welcomeMessages[persona]]
    }));
    setInput("");
  }

  function runChecks() {
    const result = runSelfTests();
    const content =
      result.failures.length === 0
        ? `Self-test passed: ${result.passed}/${result.total} checks.`
        : `Self-test failed: ${result.passed}/${result.total} checks passed. Failures: ${result.failures.join("; ")}.`;
    appendAssistant(content);
  }

  return (
    <main className="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 lg:h-[calc(100vh-2.5rem)] lg:flex-row">
        <aside className="rounded-2xl border border-stone-300/70 bg-marble/85 p-5 shadow-soft lg:w-80 lg:overflow-y-auto">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-clay">Class Final Project</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Talk to Julius Caesar</h1>
            <p className="mt-3 text-sm leading-6 text-stone-700">
              Choose a persona, then question Caesar about power, reform, war, and memory.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-stone-600">Voice Windows</h2>
            <div className="space-y-2">
              {personas.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPersona(item.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    persona === item.id
                      ? "border-clay bg-white shadow-sm"
                      : "border-stone-300 bg-white/55 hover:border-stone-500"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`grid h-10 w-10 place-items-center rounded-full border text-xl ${personaAccent[item.id]}`}>
                      {item.icon}
                    </span>
                    <span>
                      <span className="block font-semibold">{item.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-stone-600">{personaTone[item.id]}</span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-xl border border-stone-300 bg-white/60 p-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-stone-600">Response Engine</h2>
            <p className="text-xs leading-5 text-stone-600">
              Caesar uses Gemini through <span className="font-mono">/api/chat</span> when available, with a local
              rule-based answer as an automatic fallback.
            </p>
          </section>

          <section className="mt-6 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-stone-600">Preset Prompts</h2>
            <div className="grid gap-2">
              {presetPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  disabled={Boolean(loadingPersona)}
                  className="rounded-xl border border-stone-300 bg-white/70 px-3 py-2 text-left text-sm text-stone-800 transition hover:border-clay hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={resetChat}
              className="rounded-xl bg-stone-200 px-3 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-300"
            >
              Reset window
            </button>
            <button
              type="button"
              onClick={runChecks}
              className="rounded-xl bg-laurel px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#465137]"
            >
              Run self-test
            </button>
          </section>
        </aside>

        <section className="flex min-h-[70vh] flex-1 flex-col overflow-hidden rounded-2xl border border-stone-300/70 bg-white/82 shadow-soft lg:min-h-0">
          <header className="border-b border-stone-200 bg-white/70 px-5 py-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-clay">Current voice</p>
                  <h2 className="mt-1 text-xl font-bold">{activePersona.label}</h2>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">Gemini + local fallback</span>
                  {loading ? <span className="rounded-full bg-clay px-3 py-1 text-white">Thinking</span> : null}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                {personas.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPersona(item.id)}
                    className={`rounded-xl border px-3 py-2 text-left transition ${
                      persona === item.id
                        ? "border-clay bg-marble shadow-sm"
                        : "border-stone-200 bg-white/70 hover:border-stone-400"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="text-lg">{item.icon}</span>
                        <span className="truncate text-sm font-semibold">{item.label}</span>
                      </span>
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-bold text-stone-600">
                        {messagesByPersona[item.id].length}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[74%] ${
                    message.role === "user"
                      ? "bg-ink text-marble"
                      : "border border-stone-200 bg-marble text-stone-900"
                  }`}
                >
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] opacity-70">
                    {message.role === "user" ? "You" : activePersona.label}
                  </p>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </article>
            ))}
            {loading ? (
              <article className="flex justify-start">
                <div className="rounded-2xl border border-stone-200 bg-marble px-4 py-3 text-sm text-stone-700 shadow-sm">
                  {activePersona.label} considers his reply...
                </div>
              </article>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-stone-200 bg-white/75 p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${activePersona.label} about Rome, power, Pompey, the Senate, or legacy...`}
                rows={2}
                className="min-h-14 flex-1 resize-none rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-stone-400 focus:border-clay focus:ring-4 focus:ring-clay/15"
              />
              <button
                type="submit"
                disabled={!input.trim() || Boolean(loadingPersona)}
                className="rounded-xl bg-clay px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#854f38] disabled:cursor-not-allowed disabled:opacity-55 sm:w-32"
              >
                Send
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
