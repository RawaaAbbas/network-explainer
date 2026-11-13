import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getIp, rateLimit, validateText } from "../../../lib/guard";
import { logRequest } from "../../../lib/metrics";
import { checkConfigSecurity } from "../../../lib/tools";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const cache = new Map<string, string>();
export async function POST(req: Request) {
  const startedAt = Date.now();
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

    const key = config.trim().replace(/\r\n/g, "\n");
    const cached = cache.get(key);
    if (cached) {
      return NextResponse.json({ result: cached });
    }

    const findings = checkConfigSecurity(config);

    let response;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-flash-lite-latest",
          contents: config,

          config: {
            maxOutputTokens: 800,
            systemInstruction:
              "You are a network engineer. Explain this device configuration in simple Arabic as a short bullet list (one line per feature, max 8 lines, no paragraphs). Do not mention security problems or recommendations; they are added separately.",
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

    const securitySection =
      findings.issuesCount > 0
        ? findings.issues.map((issue) => `• ${issue}`).join("\n\n")
        : "لم يتم اكتشاف مشاكل أمنية.";

    logRequest("explain", startedAt, response.usageMetadata);

    const result = `${response.text ?? ""}\n\n**المشاكل الأمنية:**\n\n${securitySection}`;

    if (cache.size >= 100) {
      cache.clear();
    }
    cache.set(key, result);

    return NextResponse.json({ result });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "صار خطأ، حاولي مرة ثانية" },
      { status: 500 },
    );
  }
}
