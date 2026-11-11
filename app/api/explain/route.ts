import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getIp, rateLimit, validateText } from "../../../lib/guard";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    if (!rateLimit(getIp(req))) {
      return NextResponse.json(
        { error: "طلبات كثيرة، انتظري دقيقة وحاولي مرة ثانية" },
        { status: 429 },
      );
    }

    const { config } = await req.json();

    const problem = validateText(config, 8000);
    if (problem) {
      return NextResponse.json({ error: problem }, { status: 400 });
    }

    let response;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-flash-lite-latest",
          contents: config,
          config: {
            systemInstruction:
              "You are a senior network engineer explaining a device configuration to a student. Explain what each part does in simple Arabic, then list any mistakes or security problems you notice.",
          },
        });
        break;
      } catch (err) {
        if (attempt === 3) throw err;
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    if (!response) {
      throw new Error("no response");
    }

    return NextResponse.json({ result: response.text });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "صار خطأ، حاولي مرة ثانية" },
      { status: 500 },
    );
  }
}
