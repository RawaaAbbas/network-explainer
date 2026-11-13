import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { findRelevant } from "../../../lib/rag";
import { getIp, rateLimit, validateText } from "../../../lib/guard";
import { logRequest } from "../../../lib/metrics";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  const startedAt = Date.now()
  try {
    if (!rateLimit(getIp(req))) {
      return NextResponse.json(
        { error: "طلبات كثيرة، انتظري دقيقة وحاولي مرة ثانية" },
        { status: 429 },
      );
    }

    const { question } = await req.json();

    const problem = validateText(question, 1000);
    if (problem) {
      return NextResponse.json({ error: problem }, { status: 400 });
    }

    const relevant = await findRelevant(question);
    const context = relevant.join("\n\n—\n\n");

    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: `Context:\n${context}\n\nQuestion: ${question}`,
      config: {
        abortSignal: AbortSignal.timeout(20000),
        maxOutputTokens: 800,
        systemInstruction:
          "Answer the question using ONLY the context provided. Answer in simple Arabic. If the answer is not in the context, say that it is not in the document.",
      },
    });

    logRequest("ask", startedAt, response.usageMetadata, {
      chunks: relevant.length,
    });

    return NextResponse.json({
      result: response.text,
      sources: relevant,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "صار خطأ، حاولي مرة ثانية" },
      { status: 500 },
    );
  }
}
