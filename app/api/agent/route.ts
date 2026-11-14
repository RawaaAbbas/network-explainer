import { NextResponse } from "next/server";
import { runAgent } from "../../../lib/run-agent";
import { getIp, rateLimit, validateText } from "../../../lib/guard";
import { logRequest } from "../../../lib/metrics";

export async function POST(req: Request) {
  const startedAt = Date.now();
  try {
    if (!rateLimit(getIp(req))) {
      return NextResponse.json(
        { error: "طلبات كثيرة، انتظري دقيقة وحاولي مرة ثانية" },
        { status: 429 },
      );
    }

    const { message } = await req.json();

    const problem = validateText(message, 4000);
    if (problem) {
      return NextResponse.json({ error: problem }, { status: 400 });
    }

    const outcome = await runAgent(message);

    if (!outcome) {
      return NextResponse.json(
        { error: "الطلب احتاج خطوات كثيرة، جربي طلب أبسط" },
        { status: 500 },
      );
    }

    logRequest("agent", startedAt, outcome.usage, {
      rounds: outcome.rounds,
      tools: outcome.steps.map((s) => s.tool),
    });

    return NextResponse.json({ result: outcome.result, steps: outcome.steps });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "صار خطأ، حاولي مرة ثانية" },
      { status: 500 },
    );
  }
}
