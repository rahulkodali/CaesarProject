import { NextResponse } from "next/server";
import { buildGeminiPrompt, type ChatMessage, type PersonaId } from "@/lib/caesar";

const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type ChatRequest = {
  message?: string;
  persona?: PersonaId;
  history?: ChatMessage[];
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY. Add it to .env.local and restart the dev server." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as ChatRequest;
    const message = body.message?.trim();
    const persona = body.persona ?? "general";

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const prompt = buildGeminiPrompt(message, persona, body.history ?? []);
    const geminiResponse = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      })
    });

    if (!geminiResponse.ok) {
      const detail = await geminiResponse.text();
      return NextResponse.json(
        { error: "Gemini request failed.", detail: detail.slice(0, 500) },
        { status: geminiResponse.status }
      );
    }

    const data = await geminiResponse.json();
    const candidate = data?.candidates?.[0];
    const reply =
      candidate?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("")
        .trim() ?? "";

    if (!reply) {
      return NextResponse.json({ error: "Gemini returned an empty response." }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
