 export type Usage = {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  thoughtsTokenCount?: number;
  totalTokenCount?: number;
};

export function addUsage(total: Usage, usage: Usage | undefined): Usage {
  return {
    promptTokenCount:
      (total.promptTokenCount ?? 0) + (usage?.promptTokenCount ?? 0),
    candidatesTokenCount:
      (total.candidatesTokenCount ?? 0) + (usage?.candidatesTokenCount ?? 0),
    thoughtsTokenCount:
      (total.thoughtsTokenCount ?? 0) + (usage?.thoughtsTokenCount ?? 0),
    totalTokenCount:
      (total.totalTokenCount ?? 0) + (usage?.totalTokenCount ?? 0),
  };
}

export function logRequest(
  route: string,
  startedAt: number,
  usage: Usage | undefined,
  extra: Record<string, unknown> = {}
) {
  console.log(
    "[metrics]",
    JSON.stringify({
      route,
      ms: Date.now() - startedAt,
      promptTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
      thinkingTokens: usage?.thoughtsTokenCount ?? 0,
      totalTokens: usage?.totalTokenCount ?? 0,
      ...extra,
    })
  );
}