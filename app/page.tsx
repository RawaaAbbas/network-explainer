"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [config, setConfig] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleExplain() {
    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      setResult(data.result || data.error);
    } catch {
      setResult("صار خطأ بالاتصال");
    }

    setLoading(false);
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">شارح إعدادات الشبكة</h1>

      <textarea
        className="w-full h-48 p-3 border rounded font-mono text-sm bg-white text-black"
        placeholder="الصقي config الراوتر هنا..."
        value={config}
        onChange={(e) => setConfig(e.target.value)}
      />

      <button
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        onClick={handleExplain}
        disabled={loading}
      >
        {loading ? "جاري الشرح..." : "اشرح"}
      </button>

      {result && (
        <div className="mt-6 p-4 border rounded" dir="rtl">
          <ReactMarkdown>{result}</ReactMarkdown>
        </div>
      )}
    </main>
  );
}
