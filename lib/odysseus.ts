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
    label: "Odysseus the Hero",
    icon: "🛡️",
    description: "Brave, enduring, focused on survival, glory, homecoming, and reputation.",
    systemPrompt:
      "You are Odysseus speaking as the hero of Troy and the long voyage home. Your voice is brave, enduring, and focused on survival, glory, homecoming, and reputation."
  },
  {
    id: "political",
    label: "Odysseus the Trickster",
    icon: "🌀",
    description: "Clever, deceptive, strategic, proud of storytelling, disguise, and cunning.",
    systemPrompt:
      "You are Odysseus speaking as the trickster favored by Athena. Your voice is clever, deceptive, strategic, and proud of storytelling, disguise, and cunning."
  },
  {
    id: "final-days",
    label: "Odysseus Returned Home",
    icon: "🏠",
    description: "Reflective, suspicious, strategic, focused on Ithaca, Penelope, revenge, justice, and identity.",
    systemPrompt:
      "You are Odysseus after returning home to Ithaca. Your voice is reflective, suspicious, strategic, and focused on Ithaca, Penelope, revenge, justice, and identity."
  }
];

export const promptGroups = [
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

export const presetPrompts = promptGroups.flatMap((group) => group.prompts);

export function getPersona(personaId: PersonaId): Persona {
  return personas.find((persona) => persona.id === personaId) ?? personas[0];
}

export function getPersonaPrompt(personaId: PersonaId): string {
  return getPersona(personaId).systemPrompt;
}

export function buildGeminiPrompt(
  message: string,
  personaId: PersonaId,
  history: ChatMessage[] = [],
  referenceAnswer?: string
): string {
  const recentHistory = history
    .filter((item) => item.role === "user" || item.role === "assistant")
    .slice(-8)
    .map((item) => `${item.role === "user" ? "Visitor" : "Odysseus"}: ${item.content}`)
    .join("\n");

  return [
    "Act as Odysseus from Homer's Odyssey in a myth-grounded conversation interface.",
    getPersonaPrompt(personaId),
    "Stay in character as Odysseus and remain grounded in Homeric myth. Do not sound too modern.",
    "If the visitor only greets you, greet them back briefly and invite a question; do not pretend they asked about the suitors or the sea.",
    "If asked about something outside the Odyssey, you may answer as interpretation, but do not pretend to be a real historical source.",
    "Answer in 2 or 3 concise sentences. Aim for 45 to 80 words total.",
    "Give a complete answer with a clear ending. Do not trail off, list too many examples, or write long speeches unless the visitor explicitly asks for more detail.",
    "Prefer one direct mythic reason, one Odysseus-like justification, and then stop.",
    referenceAnswer
      ? `Mythological grounding note:\n${referenceAnswer}\nUse this as factual and tonal guidance when it fits the visitor's message. Do not copy it word-for-word, and ignore it if the visitor is only greeting you or changing topics.`
      : "Mythological grounding note: none.",
    recentHistory ? `Recent conversation:\n${recentHistory}` : "Recent conversation: none.",
    `Visitor: ${message}`,
    "Odysseus:"
  ].join("\n\n");
}

export function getRuleBasedReply(input: string, personaId: PersonaId): string {
  const text = input.toLowerCase();
  let reply: string;

  if (isGreeting(text)) {
    reply =
      "Well met, stranger. You stand before Odysseus of Ithaca; speak plainly, and I will answer as a man who has known war, wandering, and the long road home.";
  } else if (matches(text, ["what are you doing", "what're you doing", "what you doing", "what is this", "what are we doing"])) {
    reply =
      "I am receiving your questions and answering as Odysseus would: with an eye toward survival, cunning, and the honor of my name. Ask me of Polyphemus, Penelope, Athena, the suitors, or the long journey home.";
  } else if (matches(text, ["who are you", "what are you", "introduce yourself"])) {
    reply =
      "I am Odysseus, sacker of cities, king of Ithaca, and a man of twists and turns. In this voice I answer from the world I knew: the war at Troy, the wrath of Poseidon, and the long nostos home.";
  } else if (matches(text, ["how are you", "how do you feel", "are you okay"])) {
    reply =
      "I endure, as a man must who has survived ten years of war and ten more upon the sea. Suffering has taught me patience, and patience has kept me alive when pride alone would have drowned me.";
  } else if (matches(text, ["hero", "heroic", "antihero"])) {
    reply =
      "I am a hero, but not a simple one. I have shown courage in battle and endurance at sea, yet I have also lied, schemed, and let pride cost my men dearly; call me a hero who is also flawed.";
  } else if (matches(text, ["lie", "lying", "deception", "trick", "disguise", "storytelling"])) {
    reply =
      "I lie because the truth is not always safe, and a well-told story can win what strength cannot. Disguise kept me alive among the Cyclops and the suitors alike, and I take some pride in the craft of it.";
  } else if (matches(text, ["polyphemus", "cyclops", "nobody"])) {
    reply =
      "I told the Cyclops my name was Nobody, so that when I blinded him and he cried for help, his kinsmen thought no one had harmed him. It saved my crew, though my pride later undid the trick when I boasted my true name to the wind.";
  } else if (matches(text, ["penelope"])) {
    reply =
      "Penelope is the reason I endured Calypso's island and the wrath of the sea rather than accept an easy immortality. She matched my cunning with her own, holding the suitors at bay for twenty years while I found my way home.";
  } else if (matches(text, ["athena", "gods", "poseidon"])) {
    reply =
      "Athena favored my cunning and guided me home, while Poseidon cursed me for blinding his son and made my voyage a long punishment. The gods were never impartial; they rewarded and tormented me by turns, as gods do.";
  } else if (matches(text, ["home", "ithaca", "homecoming", "nostos"])) {
    reply =
      "Getting home was everything, my nostos, the thread that held my whole journey together. Without Ithaca I was only a wanderer; with it, I had a name, a wife, a son, and a throne worth suffering for.";
  } else if (matches(text, ["suitors", "revenge", "justice"])) {
    reply =
      "The suitors devoured my house, courted my wife, and plotted against my son, so I answered them with the bow and the blade. It was justice as Ithaca understood it, though I know the blood I spilled was heavy even by that measure.";
  } else if (matches(text, ["reputation", "name", "glory", "kleos"])) {
    reply =
      "My name is my immortality; kleos is what a mortal man leaves behind when the gods deny him eternal life. I sought glory at Troy and guarded my name fiercely afterward, sometimes at greater cost than the glory was worth.";
  } else if (matches(text, ["xenia", "hospitality"])) {
    reply =
      "Xenia is the sacred bond between host and guest, and I have been both a grateful guest and a wronged host. The suitors broke that bond in my own hall, and their punishment was, in part, a punishment for violating xenia itself.";
  } else if (matches(text, ["calypso"])) {
    reply =
      "Calypso offered me immortality and an island paradise, and still I wept upon her shore for Ithaca. Even eternal ease could not outweigh my name, my wife, and the mortal home I longed to reclaim.";
  } else if (matches(text, ["monster", "monsters"])) {
    reply =
      "I faced Polyphemus, Scylla, Charybdis, and the Sirens, and each one tested a different part of me: strength, sacrifice, patience, and restraint. The monsters of my journey were as much trials of character as they were dangers of the sea.";
  } else {
    reply =
      "You ask a question worthy of the wandering years. I would answer this: a man of twists and turns survives by wit as much as by strength, and he weighs honor, cunning, and the cost to those he loves before he acts.";
  }

  return `${reply}${personaFlavor(personaId)}`;
}

function matches(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function isGreeting(text: string): boolean {
  return /^(hi|hello|hey|salve|hail|yo|sup|good morning|good afternoon|good evening)[.!?\s]*$/.test(text.trim());
}

function personaFlavor(personaId: PersonaId): string {
  if (personaId === "political") {
    return " A trickster must also consider how every disguise and every story will be received, for cunning is only as good as the tale that carries it.";
  }

  if (personaId === "final-days") {
    return " Still, I remain watchful even at home; a king who has been gone twenty years trusts slowly, and tests those around him before he reveals himself.";
  }

  return "";
}
