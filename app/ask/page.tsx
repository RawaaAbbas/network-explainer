"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleAsk() {
    setLoading(true);
    setAnswer("");
    setSources([]);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setAnswer(data.result || data.error);
      setSources(data.sources || []);
    } catch {
      setAnswer("صار خطأ بالاتصال");
    }

    setLoading(false);
  }

  return (
    <main className="max-w-2xl mx-auto p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">اسألي المستند</h1>

      <input
        className="w-full p-3 border rounded bg-white text-black"
        placeholder="اكتبي سؤالك عن الشبكات..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <button
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        onClick={handleAsk}
        disabled={loading}
      >
        {loading ? "جاري البحث..." : "اسأل"}
      </button>

      {answer && (
        <div className="mt-6 p-4 border rounded">
          <ReactMarkdown>{answer}</ReactMarkdown>
        </div>
      )}

      {sources.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold mb-2">المصادر من المستند:</h2>
          {sources.map((source, i) => (
            <p
              key={i}
              className="mb-2 p-3 border rounded text-sm opacity-70 whitespace-pre-wrap"
            >
              {source}
            </p>
          ))}
        </div>
      )}
    </main>
  );
}
