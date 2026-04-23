export function nanoid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Trim transcript to the last `maxChars` characters, preserving word boundaries */
export function trimContext(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const trimmed = text.slice(-maxChars);
  const firstSpace = trimmed.indexOf(' ');
  return firstSpace > 0 ? trimmed.slice(firstSpace + 1) : trimmed;
}

export function buildTranscriptText(
  chunks: { text: string; timestamp: number }[]
): string {
  return chunks
    .map((c) => c.text.trim())
    .filter(Boolean)
    .join('\n\n');
}

export const SUGGESTION_TYPE_LABELS: Record<string, string> = {
  question: 'Question to Ask',
  talking_point: 'Talking Point',
  answer: 'Answer',
  fact_check: 'Fact Check',
  clarification: 'Clarification',
};

export const SUGGESTION_TYPE_COLORS: Record<string, string> = {
  question: 'badge-question',
  talking_point: 'badge-talking',
  answer: 'badge-answer',
  fact_check: 'badge-fact',
  clarification: 'badge-clarify',
};