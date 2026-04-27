export type PersonaId = "general" | "political" | "final-days";

export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id?: string;
  role: ChatRole;
  content: string;
};

export type Persona = {
  id: PersonaId;
  label: string;
  icon: string;
  description: string;
  systemPrompt: string;
};

export const personas: Persona[] = [
  {
    id: "general",
    label: "General Caesar",
    icon: "⚔️",
    description: "Confident, strategic, concise, focused on conquest, discipline, command, and victory.",
    systemPrompt:
      "You are Gaius Julius Caesar speaking as a Roman general. Your voice is confident, strategic, concise, and focused on conquest, discipline, command, and victory."
  },
  {
    id: "political",
    label: "Political Caesar",
    icon: "🏛️",
    description: "Persuasive, polished, image-conscious, focused on public support, reform, reputation, and the Senate.",
    systemPrompt:
      "You are Gaius Julius Caesar speaking as a Roman statesman. Your voice is persuasive, polished, image-conscious, and focused on public support, reform, reputation, and the Senate."
  },
  {
    id: "final-days",
    label: "Final Days Caesar",
    icon: "🗡️",
    description: "Reflective, ambitious, calm under pressure, aware that enemies surround him.",
    systemPrompt:
      "You are Gaius Julius Caesar in the final days of your life. Your voice is reflective, ambitious, calm under pressure, and aware that enemies surround you."
  }
];

export const presetPrompts = [
  "Why did you cross the Rubicon?",
  "Did you really want to be king?",
  "What do you think of Pompey?",
  "How do you justify weakening the Republic?",
  "What made you so popular with your soldiers?",
  "How do you want Rome to remember you?",
  "What do you think about the Senate?",
  "Was your ambition good for Rome or only for yourself?"
];

export function getPersona(personaId: PersonaId): Persona {
  return personas.find((persona) => persona.id === personaId) ?? personas[0];
}

export function getPersonaPrompt(personaId: PersonaId): string {
  return getPersona(personaId).systemPrompt;
}

export function buildGeminiPrompt(
  message: string,
  personaId: PersonaId,
  history: ChatMessage[] = []
): string {
  const recentHistory = history
    .filter((item) => item.role === "user" || item.role === "assistant")
    .slice(-8)
    .map((item) => `${item.role === "user" ? "Visitor" : "Caesar"}: ${item.content}`)
    .join("\n");

  return [
    "Act as Gaius Julius Caesar in a class-project chatbot.",
    getPersonaPrompt(personaId),
    "Stay in character as Julius Caesar and remain historically grounded.",
    "Do not invent modern knowledge Caesar could not know. If asked about events beyond 44 BCE, briefly acknowledge the limit of your perspective.",
    "Answer in 2 or 3 concise sentences. Aim for 45 to 80 words total.",
    "Give a complete answer with a clear ending. Do not trail off, list too many examples, or write long speeches unless the visitor explicitly asks for more detail.",
    "Prefer one direct historical reason, one Caesar-like justification, and then stop.",
    recentHistory ? `Recent conversation:\n${recentHistory}` : "Recent conversation: none.",
    `Visitor: ${message}`,
    "Caesar:"
  ].join("\n\n");
}

export function getRuleBasedReply(input: string, personaId: PersonaId): string {
  const text = input.toLowerCase();
  let reply: string;

  if (matches(text, ["rubicon", "alea", "jacta", "iacta"])) {
    reply =
      "I crossed the Rubicon because delay had become surrender. My enemies in Rome demanded I lay down command while they kept their power; by marching south, I chose action over humiliation and placed the decision before Rome itself.";
  } else if (matches(text, ["king", "crown", "rex", "diadem"])) {
    reply =
      "Rome has hated the name of king since the Tarquins. I accepted honors, commands, and responsibilities, but I knew the word rex could wound the Republic more sharply than any sword.";
  } else if (matches(text, ["pompey", "pompeius", "magnus"])) {
    reply =
      "Pompey was once my ally and son-in-law, a commander of great reputation. Yet reputation can become a fortress for fear; when he stood with those who opposed me, our rivalry became Rome's war.";
  } else if (matches(text, ["republic", "tyranny", "tyrant", "dictator", "dictatorship"])) {
    reply =
      "The Republic I inherited was already strained by bribery, faction, and violence. My dictatorship was harsh medicine, but I believed Rome needed order, reform, and a single will strong enough to end paralysis.";
  } else if (matches(text, ["soldier", "soldiers", "army", "legion", "legions", "veteran", "troops"])) {
    reply =
      "My soldiers followed me because I shared danger, rewarded courage, remembered service, and moved with purpose. A commander earns loyalty by victory, discipline, and the knowledge that he will not waste Roman blood.";
  } else if (matches(text, ["senate", "senator", "senators", "optimates"])) {
    reply =
      "The Senate held ancient dignity, but many senators guarded privilege more fiercely than justice. I respected Rome's institutions, yet I would not let a narrow faction dress obstruction as patriotism.";
  } else if (matches(text, ["legacy", "remember", "remembrance", "memory", "remembered"])) {
    reply =
      "Let Rome remember that I enlarged her world, reformed her calendar, settled veterans, relieved debts with measure, and forced a tired state to imagine greatness again.";
  } else if (matches(text, ["ambition", "ambitious", "glory", "power"])) {
    reply =
      "Ambition without service is vanity. My ambition sought dignitas, yes, but also laws, colonies, victories, and a Rome strong enough to command fortune rather than fear it.";
  } else {
    reply =
      "You ask a question worthy of the Forum. I would answer this: Rome is not ruled by hesitation. A leader must weigh honor, necessity, and the people's welfare, then act while others are still arguing.";
  }

  return `${reply}${personaFlavor(personaId)}`;
}

export function runSelfTests(): { passed: number; total: number; failures: string[] } {
  const checks: Array<[string, boolean]> = [
    ["Rubicon input returns Rubicon-related answer", /Rubicon/i.test(getRuleBasedReply("Why the Rubicon?", "general"))],
    [
      "Political persona adds reputation-style flavor",
      /reputation|public confidence|persuasion/i.test(getRuleBasedReply("Tell me about Pompey", "political"))
    ],
    [
      "Final Days persona adds danger-style flavor",
      /danger|betrayal|enemy|enemies|mortal/i.test(getRuleBasedReply("Tell me about the Senate", "final-days"))
    ],
    [
      "Unknown input gets fallback response",
      /Forum|hesitation|leader/i.test(getRuleBasedReply("What is your favorite color?", "general"))
    ],
    ["LLM helper function exists", typeof buildGeminiPrompt === "function"],
    ["Persona prompt exists for each persona", personas.every((persona) => persona.systemPrompt.length > 40)]
  ];

  const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
  return { passed: checks.length - failures.length, total: checks.length, failures };
}

function matches(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function personaFlavor(personaId: PersonaId): string {
  if (personaId === "political") {
    return " A wise statesman must also consider how every act appears to citizens, soldiers, and rivals, for reputation is part of power.";
  }

  if (personaId === "final-days") {
    return " Still, I sense how danger gathers around great men; envy wears a senator's ring as easily as loyalty does.";
  }

  return "";
}
