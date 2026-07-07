import { NextResponse } from "next/server";
import { buildGeminiPrompt, getRuleBasedReply, type ChatMessage, type PersonaId } from "@/lib/odysseus";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type ChatRequest = {
  message?: string;
  persona?: PersonaId;
  history?: ChatMessage[];
};

export async function POST(request: Request) {
  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error(`[chat:${requestId}] Missing GEMINI_API_KEY`);
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY. Add it to .env.local and restart the dev server." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as ChatRequest;
    const message = body.message?.trim();
    const persona = body.persona ?? "general";

    if (!message) {
      console.warn(`[chat:${requestId}] Empty message rejected`);
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    console.info(
      `[chat:${requestId}] Request received persona=${persona} model=${GEMINI_MODEL} messageLength=${message.length} historyItems=${
        body.history?.length ?? 0
      } keyPresent=${Boolean(apiKey)}`
    );

    const referenceAnswer = getRuleBasedReply(message, persona);
    const prompt = buildGeminiPrompt(message, persona, body.history ?? [], referenceAnswer);
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
          maxOutputTokens: 1600
        }
      })
    });

    if (!geminiResponse.ok) {
      const detail = await geminiResponse.text();
      console.error(
        `[chat:${requestId}] Gemini request failed status=${geminiResponse.status} detail=${detail.slice(0, 300)}`
      );
      return NextResponse.json(
        { error: "Gemini request failed.", detail: detail.slice(0, 500) },
        { status: geminiResponse.status }
      );
    }

    const data = await geminiResponse.json();
    const candidate = data?.candidates?.[0];
    const finishReason = candidate?.finishReason;
    console.info(
      `[chat:${requestId}] Gemini response ok finishReason=${finishReason ?? "unknown"} candidates=${
        data?.candidates?.length ?? 0
      }`
    );

    const reply =
      candidate?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("")
        .trim() ?? "";

    if (!reply) {
      console.error(`[chat:${requestId}] Gemini returned an empty response`);
      return NextResponse.json({ error: "Gemini returned an empty response." }, { status: 502 });
    }

    if (finishReason === "MAX_TOKENS" || !/[.!?]"?$/.test(reply)) {
      console.warn(
        `[chat:${requestId}] Falling back to reference answer reason=${
          finishReason === "MAX_TOKENS" ? "MAX_TOKENS" : "incomplete_sentence"
        } replyLength=${reply.length}`
      );
      return NextResponse.json({ reply: referenceAnswer });
    }

    console.info(`[chat:${requestId}] Returning Gemini reply replyLength=${reply.length}`);
    return NextResponse.json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    console.error(`[chat:${requestId}] Route error: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
