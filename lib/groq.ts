import { AppSettings, Suggestion, SuggestionBatch, SuggestionType } from './types';
import { buildTranscriptText, nanoid, trimContext } from './utils';
import { TranscriptChunk } from './types';

// ─── Transcription ───────────────────────────────────────────────────────────

function mimeToExtension(mimeType: string): string {
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('mpeg')) return 'mp3';
  return 'webm';
}

export async function transcribeAudio(
  audioBlob: Blob,
  apiKey: string
): Promise<string> {
  const ext = mimeToExtension(audioBlob.type);
  const formData = new FormData();
  formData.append('file', audioBlob, `audio.${ext}`);
  formData.append('model', 'whisper-large-v3');
  formData.append('response_format', 'text');
  formData.append('language', 'en');

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Transcription failed: ${err}`);
  }

  return (await res.text()).trim();
}

// ─── Suggestions ─────────────────────────────────────────────────────────────

export async function generateSuggestions(
  chunks: TranscriptChunk[],
  settings: AppSettings
): Promise<SuggestionBatch> {
  const fullText = buildTranscriptText(chunks);
  if (!fullText.trim()) {
    throw new Error('No transcript to generate suggestions from');
  }

  const context = trimContext(fullText, settings.suggestionContextWindow);
  const prompt = settings.suggestionPrompt.replace('{transcript}', context);

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      temperature: 0.7,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Suggestions failed: ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content);

  const batchId = nanoid();
  const suggestions: Suggestion[] = (parsed.suggestions ?? [])
    .slice(0, 3)
    .map((s: { type: string; title: string; preview: string }) => ({
      id: nanoid(),
      batchId,
      type: (s.type ?? 'question') as SuggestionType,
      title: s.title ?? 'Suggestion',
      preview: s.preview ?? '',
      timestamp: Date.now(),
    }));

  const lastChunks = chunks.slice(-2);
  const snippetText = buildTranscriptText(lastChunks);

  return {
    id: batchId,
    suggestions,
    timestamp: Date.now(),
    transcriptSnippet: snippetText.slice(-200),
  };
}

// ─── Detailed answer ─────────────────────────────────────────────────────────

export async function getDetailedAnswer(
  suggestion: Suggestion,
  chunks: TranscriptChunk[],
  settings: AppSettings
): Promise<string> {
  const fullText = buildTranscriptText(chunks);
  const context = trimContext(fullText, settings.chatContextWindow);

  const prompt = settings.detailedAnswerPrompt
    .replace('{transcript}', context)
    .replace('{suggestionType}', suggestion.type)
    .replace('{suggestionTitle}', suggestion.title)
    .replace('{suggestionPreview}', suggestion.preview);

  return streamChat([{ role: 'user', content: prompt }], settings);
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface SimpleChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function streamChat(
  messages: SimpleChatMessage[],
  settings: AppSettings,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      temperature: 0.5,
      max_tokens: 2048,
      stream: !!onChunk,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Chat failed: ${err}`);
  }

  if (!onChunk) {
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No readable stream');

  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    for (const line of text.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') break;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content ?? '';
        if (delta) { full += delta; onChunk(delta); }
      } catch { /* skip malformed chunks */ }
    }
  }

  return full;
}

export async function sendChatMessage(
  userMessage: string,
  chatHistory: SimpleChatMessage[],
  chunks: TranscriptChunk[],
  settings: AppSettings,
  onChunk: (chunk: string) => void
): Promise<string> {
  const fullText = buildTranscriptText(chunks);
  const context = trimContext(fullText, settings.chatContextWindow);

  const fullMessages: SimpleChatMessage[] = [
    {
      role: 'user',
      content: settings.chatPrompt.replace('{transcript}', context),
    },
    {
      role: 'assistant',
      content: "I have full context of the conversation. I'm ready to help.",
    },
    ...chatHistory,
    { role: 'user', content: userMessage },
  ];

  return streamChat(fullMessages, settings, onChunk);
}