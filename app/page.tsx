"use client";

import { FormEvent, KeyboardEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  getRuleBasedReply,
  personas,
  type ChatMessage,
  type PersonaId
} from "@/lib/odysseus";

type DisplayMessage = Required<Pick<ChatMessage, "id" | "role" | "content">>;

const welcomeMessages: Record<PersonaId, DisplayMessage[]> = {
  general: [
    {
      id: "welcome-general",
      role: "assistant",
      content:
        "Well met. I am Odysseus the hero. Ask me of Troy, survival, glory, homecoming, or how I want to be remembered."
    }
  ],
  political: [
    {
      id: "welcome-political",
      role: "assistant",
      content:
        "Well met. I am Odysseus the trickster. Ask me of disguise, storytelling, Polyphemus, Nobody, or the art of deception."
    }
  ],
  "final-days": [
    {
      id: "welcome-final-days",
      role: "assistant",
      content:
        "Well met. I am Odysseus returned home. Ask me of Ithaca, Penelope, the suitors, revenge, or what it means to come home."
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
  general: "Bravery, survival, glory",
  political: "Cunning, disguise, storytelling",
  "final-days": "Suspicion, revenge, identity"
};

const promptGroups = [
  {
    title: "Heroism & Reputation",
    prompts: [
      "Are you actually a hero?",
      "Why do you care so much about being remembered?",
      "Was your pride your biggest weakness?"
    ]
  },
  {
    title: "Tricks & Storytelling",
    prompts: [
      "Why did you lie so often?",
      "Why did you call yourself Nobody?",
      "Do you think deception can be heroic?"
    ]
  },
  {
    title: "Homecoming & Family",
    prompts: [
      "Why was getting home so important?",
      "What did Penelope mean to you?",
      "Why did you test people when you returned to Ithaca?"
    ]
  },
  {
    title: "Gods & Monsters",
    prompts: [
      "What role did Athena play in your journey?",
      "Were the gods fair to you?",
      "What did Polyphemus teach you?"
    ]
  },
  {
    title: "Revenge & Justice",
    prompts: [
      "Was killing the suitors justified?",
      "Did you go too far after returning home?",
      "What kind of justice did Ithaca need?"
    ]
  }
];

const odysseyTimeline = [
  ["Troy ends", "Odysseus begins trying to return home."],
  ["Calypso's isle", "Odysseus is trapped away from home."],
  ["Cyclops episode", "Odysseus tricks Polyphemus with the name \"Nobody,\" then reveals his real name."],
  ["Phaeacians", "Odysseus tells the story of his wanderings."],
  ["Return to Ithaca", "Odysseus comes home disguised as a beggar."],
  ["Revenge on suitors", "Odysseus reveals himself and retakes his household."],
  ["Reunion", "Odysseus proves his identity to Penelope and completes his homecoming."]
];

export default function OdysseusChatbot() {
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
      appendAssistant(await requestOdysseusReply(trimmed, targetPersona, historyForRequest), targetPersona);
    } catch {
      appendAssistant(getRuleBasedReply(trimmed, targetPersona), targetPersona);
    } finally {
      setLoadingPersona(null);
    }
  }

  async function requestOdysseusReply(
    message: string,
    targetPersona: PersonaId,
    history: Pick<ChatMessage, "role" | "content">[]
  ): Promise<string> {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        persona: targetPersona,
        history: history.slice(-10)
      })
    });

    const data = await response.json();
    if (!response.ok || !data.reply) {
      throw new Error(data.error ?? "The LLM route did not return a reply.");
    }

    return data.reply;
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

  async function comparePersonas(text = input) {
    if (loadingPersona) {
      return;
    }

    const typedPrompt = text.trim();
    const lastUserPrompt = [...messagesByPersona[persona]]
      .reverse()
      .find((message) => message.role === "user")?.content;
    const prompt = typedPrompt || lastUserPrompt || "Was killing the suitors justified?";

    if (typedPrompt) {
      const userMessage: DisplayMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: prompt
      };

      setMessagesByPersona((current) => ({
        ...current,
        [persona]: [...current[persona], userMessage]
      }));
    }

    setInput("");
    setLoadingPersona(persona);

    try {
      const comparePersonaIds: PersonaId[] = ["general", "political", "final-days"];
      const replies = await Promise.all(
        comparePersonaIds.map(async (targetPersona) => {
          const personaHistory = messagesByPersona[targetPersona].map(({ role, content }) => ({ role, content }));

          try {
            return await requestOdysseusReply(prompt, targetPersona, [
              ...personaHistory,
              { role: "user", content: prompt }
            ]);
          } catch {
            return getRuleBasedReply(prompt, targetPersona);
          }
        })
      );

      appendAssistant(
        [
          `Comparing Odysseus's voices for: "${prompt}"`,
          "",
          "Odysseus the Hero 🛡️",
          replies[0],
          "",
          "Odysseus the Trickster 🌀",
          replies[1],
          "",
          "Odysseus Returned Home 🏠",
          replies[2]
        ].join("\n")
      );
    } finally {
      setLoadingPersona(null);
    }
  }

  return (
    <main className="min-h-screen max-w-[100vw] overflow-x-hidden bg-[#ffffff] text-[#3a2a1b] lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen max-w-[100vw] grid-cols-1 overflow-x-hidden lg:h-screen lg:min-h-0 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)] lg:overflow-hidden">
        <aside className="border-b border-[#d8c9b1] bg-[#f7f3ec] lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="p-3 sm:p-4 lg:p-4 xl:p-5">
            <p className="font-sans text-[10px] font-black uppercase tracking-[0.34em] text-[#b94636]">
              Mythic Voice Archive
            </p>
            <h1 className="mt-2 max-w-[12ch] text-3xl font-black leading-[0.9] tracking-tight text-[#2a1c12] sm:text-4xl lg:text-4xl xl:text-5xl">
              Ask Odysseus
            </h1>
            <p className="mt-3 hidden border-l-4 border-[#b94636] pl-3 font-sans text-xs leading-5 text-[#5b422a] sm:block">
              A myth-grounded conversation with Odysseus as hero, trickster, and returned king.
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
                  className={`group grid w-full grid-cols-1 items-center gap-1 border-b border-r border-[#ded0bb] px-2 py-2 text-center transition lg:grid-cols-[2rem_minmax(0,1fr)_1.75rem] xl:grid-cols-[2.25rem_minmax(0,1fr)_2rem] lg:gap-0 lg:border-r-0 lg:px-3 lg:px-3 xl:px-4 lg:py-2 xl:py-2.5 lg:text-left ${
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
              className="w-full px-4 py-2 text-[#6f3f25] transition hover:bg-[#eee6d8] lg:py-2 xl:py-2.5"
            >
              Reset Current Voice
            </button>
          </section>

          <details className="border-b border-[#d8c9b1] bg-[#ffffff] p-3 font-sans text-xs text-[#5b422a] lg:hidden">
            <summary className="cursor-pointer font-black uppercase tracking-[0.18em] text-[#765537]">
              Mythological Grounding
            </summary>
            <div className="mt-3 space-y-3 leading-5">
              <p>
                This chatbot focuses on Odysseus in Homer&apos;s Odyssey: heroism, lying, reputation, Penelope,
                Athena, Poseidon, xenia, revenge, and homecoming. The answers are interpretive, not real ancient
                speech.
              </p>
              <ol className="space-y-1">
                {odysseyTimeline.map(([date, event]) => (
                  <li key={date}>
                    <span className="font-black text-[#7a2d23]">{date}</span> — {event}
                  </li>
                ))}
              </ol>
              <p>
                Research basis includes Homer&apos;s <em>Odyssey</em>, especially episodes involving Polyphemus,
                Calypso, Odysseus&apos; return to Ithaca, Penelope, Athena, and the suitors.
              </p>
              <p>
                This is an interpretive reconstruction, not a real ancient source. Use it to compare how Odysseus
                might justify himself as hero, trickster, or returned king.
              </p>
            </div>
          </details>

          <section className="hidden space-y-4 p-5 lg:block">
            <InfoBlock title="How to Use This" mark="↳">
              Ask Odysseus about heroism, lying, reputation, Penelope, Athena, Poseidon, xenia, revenge, or
              homecoming. Switch personas to see how his answer changes when he is framed as hero, trickster, or
              returned king.
            </InfoBlock>

            <InfoBlock title="Mythological Grounding" mark="🏛️">
              This chatbot focuses on Odysseus in Homer&apos;s Odyssey, especially his identity as a complicated
              hero, storyteller, husband, king, survivor, and trickster. The answers are an interpretation of
              Odysseus&apos; voice, not real ancient speech.
            </InfoBlock>

            <section className="border border-[#d8c9b1] bg-[#ffffff] p-3">
              <h2 className="font-sans text-[10px] font-black uppercase tracking-[0.26em] text-[#765537]">
                Odyssey Timeline
              </h2>
              <ol className="mt-3 space-y-2">
                {odysseyTimeline.map(([date, event]) => (
                  <li key={date} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2 font-sans text-[11px] leading-4 xl:grid-cols-[7.5rem_minmax(0,1fr)]">
                    <span className="font-black text-[#7a2d23]">{date}</span>
                    <span className="text-[#5b422a]">{event}</span>
                  </li>
                ))}
              </ol>
            </section>

            <InfoBlock title="Why This Matters" mark="!">
              Odysseus still matters because he challenges simple ideas of heroism. He is brave and intelligent,
              but also deceptive, prideful, and violent. The chatbot format lets users explore how a mythological
              hero might justify his choices.
            </InfoBlock>

            <InfoBlock title="Research Basis" mark="📜">
              This project is based on Homer&apos;s <em>Odyssey</em>, especially episodes involving Polyphemus,
              Calypso, Odysseus&apos; return to Ithaca, Penelope, Athena, and the suitors. It connects to course
              themes about heroism, xenia, storytelling, monsters, identity, and reputation.
            </InfoBlock>

            <InfoBlock title="Interpretation Note" mark="§">
              This chatbot is an interpretive reconstruction, not a primary source. It is meant to model how
              Odysseus might explain himself based on the Odyssey and course themes.
            </InfoBlock>
          </section>
        </aside>

        <section className="flex min-w-0 max-w-full flex-col overflow-hidden bg-[#ffffff] lg:grid lg:min-h-0 lg:grid-rows-[auto_auto_minmax(0,1fr)_auto]">
          <header className="border-b border-[#d8c9b1] px-3 py-2.5 sm:px-5 sm:py-3 lg:px-5 xl:px-6">
            <div className="grid min-w-0 gap-3 lg:grid-cols-[6rem_minmax(0,1fr)_minmax(13rem,18rem)] xl:grid-cols-[7rem_minmax(0,1fr)_minmax(15rem,20rem)] lg:items-end lg:gap-3 xl:gap-4">
              <PixelOdysseus persona={persona} speaking={loading || speakingPersona === persona} />
              <div className="min-w-0">
                <p className="font-sans text-[10px] font-black uppercase tracking-[0.34em] text-[#b94636]">
                  Active Transcript
                </p>
                <h2 className="mt-1 text-2xl font-black leading-none text-[#2a1c12] sm:text-4xl">
                  {activePersona.label}
                </h2>
              </div>
              <div className="hidden min-w-0 border-l-4 border-[#b94636] pl-3 font-sans text-xs leading-5 text-[#5b422a] lg:block">
                <p>{activePersona.description}</p>
                {loading ? <p className="mt-1 font-black text-[#3a2a1b]">Odysseus is composing a reply.</p> : null}
              </div>
            </div>
          </header>

          <section className="border-b border-[#d8c9b1] bg-[#f8f4ee] px-3 py-2 font-sans text-[11px] leading-4 text-[#5b422a] lg:hidden">
            <p>
              <span className="font-black uppercase tracking-[0.18em] text-[#765537]">Mythological Grounding</span>{" "}
              Odysseus in Homer&apos;s Odyssey: heroism, lying, reputation, Penelope, Athena, xenia, revenge, and
              homecoming.
            </p>
          </section>

          <section className="min-w-0 border-b border-[#d8c9b1] bg-[#f3eee5] px-3 py-2 sm:px-5 lg:px-5 xl:px-6">
            <div className="mb-1 flex items-center justify-between gap-4 font-sans">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#765537] sm:tracking-[0.26em]">Demo Questions</p>
              <p className="shrink-0 text-[11px] font-bold text-[#7a2d23]">Swipe →</p>
            </div>
            <div className="relative min-w-0 max-w-full overflow-hidden">
              <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-[#f3eee5] to-transparent" />
              <div className="flex min-w-0 max-w-full gap-3 overflow-x-auto border-y border-[#d8c9b1] py-1.5 pr-14 [scrollbar-color:#b94636_#f8f4ee] [scrollbar-width:thin]">
                {promptGroups.map((group) => (
                  <div key={group.title} className="shrink-0">
                    <p className="mb-1 font-sans text-[10px] font-black uppercase tracking-[0.18em] text-[#765537]">
                      {group.title}
                    </p>
                    <div className="flex gap-2">
                      {group.prompts.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => void sendMessage(prompt)}
                          disabled={Boolean(loadingPersona)}
                          className="max-w-[16rem] shrink-0 border border-[#d8c9b1] bg-[#ffffff] px-2.5 py-1.5 font-sans text-[11px] font-bold text-[#6f3f25] transition hover:-translate-y-0.5 hover:border-[#b94636] hover:text-[#2a1c12] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="min-w-0 px-3 py-3 sm:px-5 lg:min-h-0 lg:overflow-y-auto lg:px-5 xl:px-6">
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
                  <p className="font-sans text-sm text-[#52633d]">{activePersona.label} considers the wine-dark sea...</p>
                </article>
              ) : null}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="sticky bottom-0 z-20 min-w-0 border-t border-[#d8c9b1] bg-[#ffffff] px-3 py-3 sm:px-5 lg:static lg:px-5 xl:px-6">
            <div className="flex min-w-0 flex-wrap gap-2 lg:grid lg:grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_8rem_11rem] lg:gap-2 xl:gap-3">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${activePersona.label} about heroism, homecoming, Penelope, Athena, or revenge...`}
                rows={1}
                className="min-h-12 min-w-[16rem] flex-1 resize-none border border-[#d8c9b1] bg-[#ffffff] px-4 py-2.5 font-sans text-sm leading-6 text-[#2a1c12] outline-none transition placeholder:text-[#8d6b45] focus:border-[#b94636]"
              />
              <button
                type="submit"
                disabled={!input.trim() || Boolean(loadingPersona)}
                className="min-w-24 flex-1 border border-[#b94636] bg-[#b94636] px-3 py-2.5 font-sans text-xs font-black uppercase tracking-[0.12em] text-[#fff2d4] transition hover:-translate-y-0.5 hover:bg-[#8f2d25] disabled:translate-y-0 disabled:cursor-not-allowed disabled:border-[#d8c9b1] disabled:bg-[#eee6d8] disabled:text-[#8d6b45] sm:flex-none lg:px-3 xl:px-5 lg:tracking-[0.12em] xl:tracking-[0.18em]"
              >
                Send
              </button>
              <button
                type="button"
                onClick={() => void comparePersonas()}
                disabled={Boolean(loadingPersona)}
                className="min-w-32 flex-1 border border-[#6f3f25] bg-[#ffffff] px-3 py-2.5 font-sans text-[11px] font-black uppercase tracking-[0.08em] text-[#6f3f25] transition hover:-translate-y-0.5 hover:border-[#b94636] hover:text-[#b94636] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none lg:px-3 lg:text-[11px] lg:tracking-[0.08em] xl:px-4 xl:text-xs xl:tracking-[0.12em]"
              >
                Compare
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function PixelOdysseus({ persona, speaking }: { persona: PersonaId; speaking: boolean }) {
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
      <div className={`pixel-odysseus-mouth absolute left-[39px] top-[70px] h-2 w-6 bg-[#5b1f18] ${speaking ? "is-speaking" : ""}`} />

      <div className={`absolute left-6 top-[82px] h-3 w-[60px] ${robe}`} />
      <div className={`absolute left-5 top-[86px] h-4 w-16 ${accent}`} />
      {persona === "general" ? <div className="absolute left-8 top-[86px] h-4 w-10 bg-[#8c8170]" /> : null}
      {persona === "political" ? <div className="absolute left-9 top-[86px] h-4 w-8 bg-[#f7f1e6]" /> : null}
      {persona === "final-days" ? <div className="absolute left-9 top-[86px] h-4 w-8 bg-[#4b2030]" /> : null}
    </div>
  );
}

function InfoBlock({ title, mark, children }: { title: string; mark: string; children: ReactNode }) {
  return (
    <section className="border border-[#d8c9b1] bg-[#ffffff] p-3">
      <h2 className="flex items-center gap-2 font-sans text-[10px] font-black uppercase tracking-[0.26em] text-[#765537]">
        <span aria-hidden="true">{mark}</span>
        {title}
      </h2>
      <p className="mt-3 font-sans text-[11px] leading-5 text-[#5b422a]">{children}</p>
    </section>
  );
}
