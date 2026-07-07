# Ask Odysseus

A Classical Mythology final project: a Next.js chatbot based on Homer's *Odyssey* where users can talk with Odysseus through three mythologically flavored voices. The app uses Gemini through a server route when an API key is available and falls back to local rule-based responses if the API call fails.

Odysseus is presented as a complicated hero — brave and clever, but also prideful, deceptive, and morally questionable. Users can ask him about heroism, lying and storytelling, reputation, homecoming, Penelope, Athena and the gods, monsters, xenia, the Cyclops episode, and his revenge against the suitors.

## Features

- Three separate Odysseus voice windows:
  - Odysseus the Hero 🛡️: bravery, endurance, survival, glory, homecoming, reputation
  - Odysseus the Trickster 🌀: cunning, deception, disguise, storytelling
  - Odysseus Returned Home 🏠: reflection, suspicion, Ithaca, Penelope, revenge, justice, identity
- Separate chat history for each voice
- Preset mythological prompt buttons grouped by theme (Heroism & Reputation, Tricks & Storytelling, Homecoming & Family, Gods & Monsters, Revenge & Justice)
- Gemini API wrapper at `app/api/chat/route.ts`
- Rule-based fallback responses for common Odyssey topics (heroism, lying/deception, Polyphemus/Cyclops/Nobody, Penelope, Athena/gods/Poseidon, homecoming/Ithaca/nostos, suitors/revenge/justice, reputation/kleos, xenia, Calypso, monsters)
- Reset-window control
- Compare-personas button that answers the same question in all three voices at once
- No client-side API key exposure

## How The Voices Work

Gemini mode uses a different system prompt for each Odysseus voice, instructing the model to stay in character, answer in 2-3 concise sentences, stay grounded in Homeric myth, and avoid sounding too modern. The rule-based fallback uses the same mythological topic answer, then adds persona-specific flavor for Odysseus the Trickster and Odysseus Returned Home.

## Run Locally

Install dependencies:

```bash
npm install
```

Create `.env.local` from the example file:

```bash
cp .env.example .env.local
```

Then put your Gemini key in `.env.local`:

```bash
GEMINI_API_KEY=your_key_here
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed by Next.js, usually:

```text
http://localhost:3000
```

## Verify

Run a production build:

```bash
npm run build
```

Optional TypeScript check:

```bash
npm run typecheck
```

## Submission Notes

Submit the source files, `package.json`, `package-lock.json`, and this README. Do not submit:

- `node_modules`
- `.next`
- `.env.local`
- any real API key

The app still works without a valid Gemini key because it automatically falls back to the rule-based Odysseus responses.
