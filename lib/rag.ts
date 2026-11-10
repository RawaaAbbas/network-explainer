import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

export function loadChunks(): string[] {
  const filePath = path.join(process.cwd(), "docs", "networking.txt");
  const text = fs.readFileSync(filePath, "utf-8");

  return text
    .split(/\r?\n\r?\n/)
    .map((part) => part.trim())
    .filter((part) => part.length > 30);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: texts,
  });
  return (response.embeddings ?? []).map((e) => e.values ?? []);
}

let cache: { chunks: string[]; vectors: number[][] } | null = null;

export async function getIndex() {
  if (!cache) {
    const chunks = loadChunks();
    const vectors = await embedTexts(chunks);
    cache = { chunks, vectors };
  }
  return cache;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function findRelevant(
  question: string,
  topK = 3,
): Promise<string[]> {
  const { chunks, vectors } = await getIndex();
  const [questionVector] = await embedTexts([question]);

  return chunks
    .map((chunk, i) => ({
      chunk,
      score: cosineSimilarity(questionVector, vectors[i]),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => item.chunk);
}
