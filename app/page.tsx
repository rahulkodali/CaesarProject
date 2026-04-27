"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  getRuleBasedReply,
  personas,
  presetPrompts,
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

const additionalPresetPrompts = [
  "What did your soldiers admire most about you?",
  "How did you use clemency as a political weapon?",
  "Were your reforms meant to save the Republic or replace it?",
  "What did victory in Gaul teach you about Rome?",
  "Why did so many senators fear your popularity?",
  "What would you say to Brutus?",
  "Did you trust anyone near the end?",
  "What is the cost of glory?"
];

export default function CaesarChatbot() {
  const [persona, setPersona] = useState<PersonaId>("general");
  const [input, setInput] = useState("");
  const [messagesByPersona, setMessagesByPersona] =
    useState<Record<PersonaId, DisplayMessage[]>>(initialMessagesByPersona);
  const [loadingPersona, setLoadingPersona] = useState<PersonaId | null>(null);
  const [speakingPersona, setSpeakingPersona] = useState<PersonaId | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const speakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messages = messagesByPersona[persona];
  const loading = loadingPersona === persona;

  const activePersona = useMemo(
    () => personas.find((item) => item.id === persona) ?? personas[0],
    [persona]
  );
  const visiblePrompts = [...presetPrompts, ...additionalPresetPrompts];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (speakingTimerRef.current) {
        clearTimeout(speakingTimerRef.current);
      }
    };
  }, []);

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

    setSpeakingPersona(targetPersona);
    if (speakingTimerRef.current) {
      clearTimeout(speakingTimerRef.current);
    }
    speakingTimerRef.current = setTimeout(() => {
      setSpeakingPersona(null);
    }, 1600);
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

  return (
    <main className="min-h-screen bg-[#ffffff] text-[#3a2a1b] lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen grid-cols-1 lg:h-screen lg:min-h-0 lg:grid-cols-[16rem_minmax(0,1fr)] lg:overflow-hidden">
        <aside className="border-b border-[#d8c9b1] bg-[#f7f3ec] lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="p-3 sm:p-4 lg:p-5">
            <p className="font-sans text-[10px] font-black uppercase tracking-[0.34em] text-[#b94636]">
              Roman Voice Archive
            </p>
            <h1 className="mt-2 max-w-[12ch] text-3xl font-black leading-[0.9] tracking-tight text-[#2a1c12] sm:text-4xl lg:text-5xl">
              Talk to Julius Caesar
            </h1>
            <p className="mt-3 hidden border-l-4 border-[#b94636] pl-3 font-sans text-xs leading-5 text-[#5b422a] sm:block">
              A historically grounded conversation with Caesar as commander, statesman, and man under threat.
            </p>
          </div>

          <section className="border-y border-[#d8c9b1]">
            <h2 className="border-b border-[#d8c9b1] px-3 py-1.5 font-sans text-[10px] font-black uppercase tracking-[0.26em] text-[#765537] sm:px-5 sm:py-2">
              Voice Index
            </h2>
            <div className="grid grid-cols-3 lg:block">
              {personas.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPersona(item.id)}
                  className={`group grid w-full grid-cols-1 items-center gap-1 border-b border-r border-[#ded0bb] px-2 py-2 text-center transition lg:grid-cols-[2.25rem_minmax(0,1fr)_2rem] lg:gap-0 lg:border-r-0 lg:px-4 lg:py-2.5 lg:text-left ${
                    persona === item.id
                      ? "bg-[#3a2a1b] text-[#f4e2be]"
                      : "text-[#3a2a1b] hover:bg-[#f8f4ee]"
                  }`}
                >
                <span
                  className={`mx-auto grid h-7 w-7 place-items-center border font-sans text-sm transition group-hover:-translate-y-0.5 lg:mx-0 ${personaAccent[item.id]}`}
                >
                  {item.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-black leading-4 lg:text-sm">{item.label}</span>
                  <span
                    className={`mt-1 hidden truncate font-sans text-[11px] sm:block ${
                      persona === item.id ? "text-[#ead5af]" : "text-[#684b31]"
                    }`}
                  >
                    {personaTone[item.id]}
                  </span>
                </span>
                <span
                  className={`hidden justify-self-end border px-1.5 py-0.5 font-sans text-[10px] font-black lg:block ${
                    persona === item.id ? "border-[#f4e2be]" : "border-[#d8c9b1] text-[#5b422a]"
                  }`}
                >
                  {messagesByPersona[item.id].length}
                </span>
                </button>
              ))}
            </div>
          </section>

          <section className="border-b border-[#d8c9b1] font-sans text-xs font-black uppercase tracking-[0.12em]">
            <button
              type="button"
              onClick={resetChat}
              className="w-full px-4 py-2 text-[#6f3f25] transition hover:bg-[#eee6d8] lg:py-2.5"
            >
              Reset Current Voice
            </button>
          </section>

          <section className="hidden p-4 lg:block lg:p-5">
            <h2 className="font-sans text-[10px] font-black uppercase tracking-[0.26em] text-[#765537]">
              Voice Method
            </h2>
            <div className="mt-3 grid gap-2 font-sans text-xs leading-5 text-[#5b422a]">
              <p>
                Each voice keeps its own transcript, tone, and historical focus so the answers feel like separate
                interpretations of Caesar.
              </p>
              <p className="text-[#6f3f25]">Use the prompt index for a focused exchange, or write your own question below.</p>
            </div>
          </section>
        </aside>

        <section className="flex min-h-[72vh] flex-col bg-[#ffffff] lg:grid lg:min-h-0 lg:grid-rows-[auto_auto_minmax(0,1fr)_auto] lg:overflow-hidden">
          <header className="border-b border-[#d8c9b1] px-3 py-2.5 sm:px-6 sm:py-3">
            <div className="grid gap-4 lg:grid-cols-[7rem_minmax(0,1fr)_17rem] lg:items-end">
              <PixelCaesar persona={persona} speaking={loading || speakingPersona === persona} />
              <div>
                <p className="font-sans text-[10px] font-black uppercase tracking-[0.34em] text-[#b94636]">
                  Active Transcript
                </p>
                <h2 className="mt-1 text-2xl font-black leading-none text-[#2a1c12] sm:text-4xl">
                  {activePersona.label}
                </h2>
              </div>
              <div className="hidden border-l-4 border-[#b94636] pl-3 font-sans text-xs leading-5 text-[#5b422a] sm:block">
                <p>{activePersona.description}</p>
                {loading ? <p className="mt-1 font-black text-[#3a2a1b]">Caesar is composing a reply.</p> : null}
              </div>
            </div>
          </header>

          <section className="border-b border-[#d8c9b1] bg-[#f3eee5] px-3 py-2 sm:px-6">
            <div className="mb-1 flex items-center justify-between gap-4 font-sans">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#765537] sm:tracking-[0.26em]">Demo Questions</p>
              <p className="shrink-0 text-[11px] font-bold text-[#7a2d23]">Swipe →</p>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-[#f3eee5] to-transparent" />
              <div className="flex gap-2 overflow-x-auto border-y border-[#d8c9b1] py-1.5 pr-14 [scrollbar-color:#b94636_#f8f4ee] [scrollbar-width:thin]">
              {visiblePrompts.map((prompt, index) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  disabled={Boolean(loadingPersona)}
                  className="max-w-[17rem] shrink-0 border border-[#d8c9b1] bg-[#ffffff] px-2.5 py-1.5 font-sans text-[11px] font-bold text-[#6f3f25] transition hover:-translate-y-0.5 hover:border-[#b94636] hover:text-[#2a1c12] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="mr-2 text-[#b94636]">{String(index + 1).padStart(2, "0")}</span>
                  {prompt}
                </button>
              ))}
              </div>
            </div>
          </section>

          <div className="px-3 py-3 sm:px-6 lg:min-h-0 lg:overflow-y-auto">
            <div className="mx-auto max-w-5xl space-y-2.5">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`grid gap-2 border-l-4 py-1.5 pl-3 sm:grid-cols-[7rem_minmax(0,1fr)] ${
                    message.role === "user" ? "border-[#b94636]" : "border-[#6f3f25]"
                  }`}
                >
                  <p className="font-sans text-[10px] font-black uppercase tracking-[0.22em] text-[#765537]">
                    {message.role === "user" ? "You" : activePersona.label}
                  </p>
                  <p
                    className={`whitespace-pre-wrap text-sm leading-6 ${
                      message.role === "user" ? "text-[#7a2d23]" : "text-[#3a2a1b]"
                    }`}
                  >
                    {message.content}
                  </p>
                </article>
              ))}
              {loading ? (
                <article className="grid gap-2 border-l-4 border-[#7b8d66] py-1.5 pl-3 sm:grid-cols-[7rem_minmax(0,1fr)]">
                  <p className="font-sans text-[10px] font-black uppercase tracking-[0.22em] text-[#765537]">Status</p>
                  <p className="font-sans text-sm text-[#52633d]">{activePersona.label} considers the record...</p>
                </article>
              ) : null}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="sticky bottom-0 z-20 border-t border-[#d8c9b1] bg-[#ffffff] px-3 py-3 sm:px-6 lg:static">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_9rem]">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${activePersona.label} about Rome, power, Pompey, the Senate, or legacy...`}
                rows={1}
                className="min-h-12 resize-none border border-[#d8c9b1] bg-[#ffffff] px-4 py-2.5 font-sans text-sm leading-6 text-[#2a1c12] outline-none transition placeholder:text-[#8d6b45] focus:border-[#b94636]"
              />
              <button
                type="submit"
                disabled={!input.trim() || Boolean(loadingPersona)}
                className="border border-[#b94636] bg-[#b94636] px-5 py-2.5 font-sans text-xs font-black uppercase tracking-[0.18em] text-[#fff2d4] transition hover:-translate-y-0.5 hover:bg-[#8f2d25] disabled:translate-y-0 disabled:cursor-not-allowed disabled:border-[#d8c9b1] disabled:bg-[#eee6d8] disabled:text-[#8d6b45]"
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

function PixelCaesar({ persona, speaking }: { persona: PersonaId; speaking: boolean }) {
  const accent = persona === "political" ? "bg-[#b94636]" : persona === "final-days" ? "bg-[#273526]" : "bg-[#6f3f25]";
  const frame = persona === "political" ? "bg-[#fff8e8]" : persona === "final-days" ? "bg-[#eee9df]" : "bg-[#f7f3ec]";
  const brow = persona === "final-days" ? "bg-[#2a1c12]" : "bg-[#7a4f32]";
  const robe = persona === "political" ? "bg-[#f7f1e6]" : persona === "final-days" ? "bg-[#273526]" : "bg-[#f0d8b0]";

  return (
    <div className={`relative hidden h-24 w-24 self-start border border-[#d8c9b1] p-3 shadow-[inset_0_0_0_3px_#ffffff] lg:block ${frame}`}>
      <div className="absolute left-3 top-3 h-2 w-2 bg-[#b94636]" />
      <div className="absolute right-3 top-3 h-2 w-6 bg-[#d8c9b1]" />

      {persona === "general" ? (
        <>
          <div className="absolute left-[43px] top-1 h-6 w-3 bg-[#9b2f27]" />
          <div className="absolute left-[36px] top-2 h-5 w-7 bg-[#b94636]" />
          <div className="absolute left-[31px] top-6 h-3 w-16 bg-[#7f745e]" />
          <div className="absolute left-[28px] top-8 h-7 w-10 bg-[#9d9685]" />
          <div className="absolute left-[23px] top-[31px] h-6 w-3 bg-[#7f745e]" />
          <div className="absolute right-[23px] top-[31px] h-6 w-3 bg-[#7f745e]" />
          <div className="absolute left-[37px] top-[38px] h-2 w-6 bg-[#d8d2b8]" />
        </>
      ) : null}

      {persona === "political" ? (
        <>
          <div className="absolute left-6 top-5 h-2 w-12 bg-[#61764a]" />
          <div className="absolute left-5 top-4 h-3 w-3 bg-[#7b8d66]" />
          <div className="absolute left-[38px] top-3 h-3 w-3 bg-[#7b8d66]" />
          <div className="absolute right-5 top-4 h-3 w-3 bg-[#7b8d66]" />
        </>
      ) : null}

      {persona === "final-days" ? (
        <>
          <div className="absolute left-3 top-6 h-14 w-5 bg-[#273526]" />
          <div className="absolute right-3 top-6 h-14 w-5 bg-[#273526]" />
          <div className="absolute right-6 top-4 h-7 w-2 rotate-45 bg-[#9d9a90]" />
        </>
      ) : null}

      <div className="absolute left-7 top-6 h-3 w-11 bg-[#d8d2b8]" />
      <div className="absolute left-5 top-8 h-7 w-14 bg-[#c8b38c]" />
      <div className="absolute left-7 top-11 h-9 w-11 bg-[#b8875c]" />
      <div className="absolute left-4 top-14 h-6 w-4 bg-[#b8875c]" />
      <div className="absolute right-4 top-14 h-6 w-4 bg-[#b8875c]" />

      <div className={`absolute left-8 top-[48px] h-1 w-3 ${brow}`} />
      <div className={`absolute right-8 top-[48px] h-1 w-3 ${brow}`} />
      <div className="absolute left-8 top-[54px] h-1.5 w-2.5 bg-[#2a1c12]" />
      <div className="absolute right-8 top-[54px] h-1.5 w-2.5 bg-[#2a1c12]" />
      <div className="absolute left-[44px] top-[60px] h-2 w-2 bg-[#7a4f32]" />
      <div className={`pixel-caesar-mouth absolute left-[39px] top-[70px] h-2 w-6 bg-[#5b1f18] ${speaking ? "is-speaking" : ""}`} />

      <div className={`absolute left-6 top-[82px] h-3 w-[60px] ${robe}`} />
      <div className={`absolute left-5 top-[86px] h-4 w-16 ${accent}`} />
      {persona === "general" ? <div className="absolute left-8 top-[86px] h-4 w-10 bg-[#8c8170]" /> : null}
      {persona === "political" ? <div className="absolute left-9 top-[86px] h-4 w-8 bg-[#f7f1e6]" /> : null}
      {persona === "final-days" ? <div className="absolute left-9 top-[86px] h-4 w-8 bg-[#4b2030]" /> : null}
    </div>
  );
}
