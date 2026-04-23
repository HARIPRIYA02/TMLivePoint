'use client';

import { Suggestion } from '@/lib/types';
import { SUGGESTION_TYPE_LABELS } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { getDetailedAnswer } from '@/lib/groq';
import { nanoid } from '@/lib/utils';
import { formatTimestamp } from '@/lib/utils';

interface Props {
  suggestion: Suggestion;
}

const TYPE_ICONS: Record<string, string> = {
  question: '❓',
  talking_point: '💡',
  answer: '✅',
  fact_check: '🔍',
  clarification: '📖',
};

export default function SuggestionCard({ suggestion }: Props) {
  const { chunks, settings, addChatMessage, setIsChatLoading } = useStore();

  const handleClick = async () => {
    // Add the suggestion as a user message
    addChatMessage({
      id: nanoid(),
      role: 'user',
      content: `**${SUGGESTION_TYPE_LABELS[suggestion.type]}**: ${suggestion.title}\n\n${suggestion.preview}`,
      timestamp: Date.now(),
      suggestionId: suggestion.id,
    });

    setIsChatLoading(true);
    try {
      const answer = await getDetailedAnswer(suggestion, chunks, settings);
      addChatMessage({
        id: nanoid(),
        role: 'assistant',
        content: answer,
        timestamp: Date.now(),
        suggestionId: suggestion.id,
      });
    } catch (e) {
      addChatMessage({
        id: nanoid(),
        role: 'assistant',
        content: `Error: ${(e as Error).message}`,
        timestamp: Date.now(),
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <button className={`suggestion-card type-${suggestion.type}`} onClick={handleClick}>
      <div className="suggestion-card-header">
        <span className="type-badge">
          {TYPE_ICONS[suggestion.type]} {SUGGESTION_TYPE_LABELS[suggestion.type]}
        </span>
        <span className="suggestion-time">{formatTimestamp(suggestion.timestamp)}</span>
      </div>
      <h4 className="suggestion-title">{suggestion.title}</h4>
      <p className="suggestion-preview">{suggestion.preview}</p>
      <div className="suggestion-cta">Click for full analysis →</div>
    </button>
  );
}