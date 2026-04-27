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
  general: "border-[#6f3f25] text-[#4a2b1a]",
  political: "border-[#b94636] text-[#7a2d23]",
  "final-days": "border-[#61764a] text-[#52633d]"
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
    } catch {
      appendAssistant(getRuleBasedReply(trimmed, targetPersona), targetPersona);
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
    <main className="min-h-screen bg-[#ffffff] text-[#3a2a1b]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="border-b border-[#d8c9b1] bg-[#f7f3ec] lg:border-b-0 lg:border-r">
          <div className="p-5 lg:p-6">
            <p className="font-sans text-[10px] font-black uppercase tracking-[0.34em] text-[#b94636]">
              CC302 Final
            </p>
            <h1 className="mt-3 max-w-[12ch] text-5xl font-black leading-[0.86] tracking-tight text-[#2a1c12] lg:text-6xl">
              Talk to Julius Caesar
            </h1>
            <p className="mt-5 border-l-4 border-[#b94636] pl-3 font-sans text-xs leading-5 text-[#5b422a]">
              Three voice windows. One Roman mind under pressure.
            </p>
          </div>

          <section className="border-y border-[#d8c9b1]">
            <h2 className="border-b border-[#d8c9b1] px-5 py-2 font-sans text-[10px] font-black uppercase tracking-[0.26em] text-[#765537]">
              Voice Index
            </h2>
            {personas.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPersona(item.id)}
                className={`group grid w-full grid-cols-[2.5rem_minmax(0,1fr)_2rem] items-center border-b border-[#ded0bb] px-5 py-3 text-left transition ${
                  persona === item.id
                    ? "bg-[#3a2a1b] text-[#f4e2be]"
                    : "text-[#3a2a1b] hover:bg-[#f8f4ee]"
                }`}
              >
                <span
                  className={`grid h-8 w-8 place-items-center border font-sans text-base transition group-hover:-translate-y-0.5 ${personaAccent[item.id]}`}
                >
                  {item.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-black leading-4">{item.label}</span>
                  <span
                    className={`mt-1 block truncate font-sans text-[11px] ${
                      persona === item.id ? "text-[#ead5af]" : "text-[#684b31]"
                    }`}
                  >
                    {personaTone[item.id]}
                  </span>
                </span>
                <span
                  className={`justify-self-end border px-1.5 py-0.5 font-sans text-[10px] font-black ${
                    persona === item.id ? "border-[#f4e2be]" : "border-[#d8c9b1] text-[#5b422a]"
                  }`}
                >
                  {messagesByPersona[item.id].length}
                </span>
              </button>
            ))}
          </section>

          <section className="grid grid-cols-2 border-b border-[#d8c9b1] font-sans text-xs font-black uppercase tracking-[0.12em]">
            <button
              type="button"
              onClick={resetChat}
              className="border-r border-[#d8c9b1] px-4 py-3 text-[#6f3f25] transition hover:bg-[#eee6d8]"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={runChecks}
              className="px-4 py-3 text-[#6f3f25] transition hover:bg-[#eee6d8]"
            >
              Self-test
            </button>
          </section>

          <section className="p-5 lg:p-6">
            <h2 className="font-sans text-[10px] font-black uppercase tracking-[0.26em] text-[#765537]">
              Design Notes
            </h2>
            <div className="mt-4 grid gap-3 font-sans text-xs leading-5 text-[#5b422a]">
              <p>
                Each voice keeps its own transcript, tone, and historical focus so the answers feel like separate
                interpretations of Caesar.
              </p>
              <p className="text-[#6f3f25]">Built for quick classroom demos: dense controls, direct prompts, no clutter.</p>
            </div>
          </section>
        </aside>

        <section className="grid min-h-0 grid-rows-[auto_auto_minmax(0,1fr)_auto] bg-[#ffffff]">
          <header className="border-b border-[#d8c9b1] px-5 py-4 sm:px-7">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
              <div>
                <p className="font-sans text-[10px] font-black uppercase tracking-[0.34em] text-[#b94636]">
                  Active Transcript
                </p>
                <h2 className="mt-1 text-4xl font-black leading-none text-[#2a1c12] sm:text-5xl">
                  {activePersona.label}
                </h2>
              </div>
              <div className="border-l-4 border-[#b94636] pl-3 font-sans text-xs leading-5 text-[#5b422a]">
                <p>{activePersona.description}</p>
                {loading ? <p className="mt-1 font-black text-[#3a2a1b]">Caesar is composing a reply.</p> : null}
              </div>
            </div>
          </header>

          <section className="border-b border-[#d8c9b1] bg-[#f3eee5] px-5 py-3 sm:px-7">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {presetPrompts.map((prompt, index) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  disabled={Boolean(loadingPersona)}
                  className="shrink-0 border border-[#d8c9b1] bg-[#ffffff] px-3 py-2 font-sans text-[11px] font-bold text-[#6f3f25] transition hover:-translate-y-0.5 hover:border-[#b94636] hover:text-[#2a1c12] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="mr-2 text-[#b94636]">{String(index + 1).padStart(2, "0")}</span>
                  {prompt}
                </button>
              ))}
            </div>
          </section>

          <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-7">
            <div className="mx-auto max-w-5xl space-y-3">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`grid gap-3 border-l-4 py-2 pl-3 sm:grid-cols-[8rem_minmax(0,1fr)] ${
                    message.role === "user" ? "border-[#b94636]" : "border-[#6f3f25]"
                  }`}
                >
                  <p className="font-sans text-[10px] font-black uppercase tracking-[0.22em] text-[#765537]">
                    {message.role === "user" ? "You" : activePersona.label}
                  </p>
                  <p
                    className={`whitespace-pre-wrap text-base leading-7 ${
                      message.role === "user" ? "text-[#7a2d23]" : "text-[#3a2a1b]"
                    }`}
                  >
                    {message.content}
                  </p>
                </article>
              ))}
              {loading ? (
                <article className="grid gap-3 border-l-4 border-[#7b8d66] py-2 pl-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
                  <p className="font-sans text-[10px] font-black uppercase tracking-[0.22em] text-[#765537]">Status</p>
                  <p className="font-sans text-sm text-[#52633d]">{activePersona.label} considers the record...</p>
                </article>
              ) : null}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="border-t border-[#d8c9b1] bg-[#ffffff] px-5 py-4 sm:px-7">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_9rem]">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${activePersona.label} about Rome, power, Pompey, the Senate, or legacy...`}
                rows={2}
                className="min-h-16 resize-none border border-[#d8c9b1] bg-[#ffffff] px-4 py-3 font-sans text-sm leading-6 text-[#2a1c12] outline-none transition placeholder:text-[#8d6b45] focus:border-[#b94636]"
              />
              <button
                type="submit"
                disabled={!input.trim() || Boolean(loadingPersona)}
                className="border border-[#b94636] bg-[#b94636] px-5 py-3 font-sans text-xs font-black uppercase tracking-[0.18em] text-[#fff2d4] transition hover:-translate-y-0.5 hover:bg-[#8f2d25] disabled:translate-y-0 disabled:cursor-not-allowed disabled:border-[#d8c9b1] disabled:bg-[#eee6d8] disabled:text-[#8d6b45]"
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
