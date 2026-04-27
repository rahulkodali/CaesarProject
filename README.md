# Talk to Julius Caesar

A small Next.js class-project chatbot where users can talk with Julius Caesar through a local rule-based mode or a Gemini-backed server route.

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. For LLM mode, create `.env.local`:

```bash
GEMINI_API_KEY=your_key_here
```

3. Start the dev server:

```bash
npm run dev
```

Open the local URL printed by Next.js. Rule-based mode works without an API key.

## Features

- Three personas: General Caesar, Political Caesar, and Final Days Caesar
- Rule-based keyword responses with persona flavor
- Gemini `gemini-3-flash-preview` wrapper at `app/api/chat/route.ts`
- Preset historical prompts
- Reset chat and self-test controls
# CaesarProject
