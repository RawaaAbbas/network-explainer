"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

type Step = { tool: string; args: unknown; result: unknown };

export default function AgentPage() {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);
    setAnswer("");
    setSteps([]);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setAnswer(data.result || data.error);
      setSteps(data.steps || []);
    } catch {
      setAnswer("صار خطأ بالاتصال");
    }

    setLoading(false);
  }

  return (
    <main className="max-w-2xl mx-auto p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">مساعد مهندس الشبكات (Agent)</h1>

      <textarea
        className="w-full h-40 p-3 border rounded bg-white text-black"
        placeholder="اكتبي طلبك، أو الصقي config وأسألي عنه..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        onClick={handleSend}
        disabled={loading}
      >
        {loading ? "جاري التنفيذ..." : "نفّذ"}
      </button>

      {answer && (
        <div className="mt-6 p-4 border rounded">
          <ReactMarkdown>{answer}</ReactMarkdown>
        </div>
      )}

      {steps.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold mb-2">الأدوات اللي استخدمها الـ Agent:</h2>
          {steps.map((step, i) => (
            <div key={i} className="mb-3 p-3 border rounded text-sm">
              <p className="font-bold mb-1">
                {i + 1}. {step.tool}
              </p>
              <pre className="whitespace-pre-wrap opacity-70" dir="ltr">
                {JSON.stringify(step.args, null, 2)}
              </pre>
              <pre className="whitespace-pre-wrap" dir="ltr">
                {JSON.stringify(step.result, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
