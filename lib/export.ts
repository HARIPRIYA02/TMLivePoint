import { ChatMessage, SuggestionBatch, TranscriptChunk } from './types';
import { formatTimestamp } from './utils';

export function exportSession(
  chunks: TranscriptChunk[],
  batches: SuggestionBatch[],
  chatMessages: ChatMessage[]
): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    transcript: chunks.map((c) => ({
      timestamp: formatTimestamp(c.timestamp),
      text: c.text,
    })),
    suggestionBatches: batches.map((b) => ({
      timestamp: formatTimestamp(b.timestamp),
      transcriptSnippet: b.transcriptSnippet,
      suggestions: b.suggestions.map((s) => ({
        type: s.type,
        title: s.title,
        preview: s.preview,
      })),
    })),
    chatHistory: chatMessages.map((m) => ({
      timestamp: formatTimestamp(m.timestamp),
      role: m.role,
      content: m.content,
    })),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `session-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}