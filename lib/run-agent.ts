import { GoogleGenAI, type Content, type Part } from "@google/genai";
import { toolDeclarations, runTool } from "./agent";
import { addUsage, type Usage } from "./metrics";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function runAgent(message: string) {
  const contents: Content[] = [{ role: "user", parts: [{ text: message }] }];
  const steps: { tool: string; args: unknown; result: unknown }[] = [];

  let totalUsage: Usage = {};

  for (let round = 0; round < 5; round++) {
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents,
      config: {
        abortSignal: AbortSignal.timeout(30000),
        systemInstruction:
          "You are a networking assistant. Use calculate_subnet for ANY subnet or IP calculation (never calculate by yourself), check_config_security when the user gives a device configuration, and search_docs for theory questions. Answer in simple Arabic using Markdown.",
        tools: [{ functionDeclarations: toolDeclarations }],
      },
    });

    totalUsage = addUsage(totalUsage, response.usageMetadata);

    const calls = response.functionCalls;

    if (!calls || calls.length === 0) {
      return {
        result: response.text,
        steps,
        rounds: round + 1,
        usage: totalUsage,
      };
    }

    const modelContent = response.candidates?.[0]?.content;
    if (modelContent) contents.push(modelContent);

    const responseParts: Part[] = [];
    for (const call of calls) {
      const name = call.name ?? "";
      const args = call.args ?? {};
      const result = await runTool(name, args);
      steps.push({ tool: name, args, result });
      responseParts.push({
        functionResponse: { name, response: { result } },
      });
    }
    contents.push({ role: "user", parts: responseParts });
  }

  return null;
}
