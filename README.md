# Talk to Julius Caesar

A polished Next.js chatbot where users can talk with Julius Caesar through three historically flavored voices. The app uses Gemini through a server route when an API key is available and falls back to local rule-based responses if the API call fails.

## Features

- Three separate Caesar voice windows:
  - General Caesar: command, conquest, discipline, victory
  - Political Caesar: reform, reputation, persuasion, the Senate
  - Final Days Caesar: ambition, danger, enemies, betrayal
- Separate chat history for each voice
- Preset historical prompt buttons
- Gemini API wrapper at `app/api/chat/route.ts`
- Rule-based fallback responses for common topics
- Reset-window control
- No client-side API key exposure

## How The Voices Work

Gemini mode uses a different system prompt for each Caesar voice. The rule-based fallback uses the same historical topic answer, then adds persona-specific flavor for Political Caesar and Final Days Caesar.

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

The app still works without a valid Gemini key because it automatically falls back to the rule-based Caesar responses.
