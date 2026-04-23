'use client';

import { useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Lightbulb } from 'lucide-react';
import { useStore } from '@/lib/store';
import { generateSuggestions } from '@/lib/groq';
import { formatTimestamp } from '@/lib/utils';
import SuggestionCard from './SuggestionCard';

export default function SuggestionsPanel() {
  const {
    chunks,
    settings,
    suggestionBatches,
    addSuggestionBatch,
    isSuggestionsLoading,
    setIsSuggestionsLoading,
    isRecording,
  } = useStore();

  // Use refs so interval callback always sees latest values without re-registering
  const chunksRef = useRef(chunks);
  const settingsRef = useRef(settings);
  const isLoadingRef = useRef(isSuggestionsLoading);
  const isRecordingRef = useRef(isRecording);

  useEffect(() => { chunksRef.current = chunks; }, [chunks]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { isLoadingRef.current = isSuggestionsLoading; }, [isSuggestionsLoading]);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

  const refresh = useCallback(async () => {
    if (!chunksRef.current.length || !settingsRef.current.groqApiKey) return;
    if (isLoadingRef.current) return; // don't double-fire
    setIsSuggestionsLoading(true);
    try {
      const batch = await generateSuggestions(chunksRef.current, settingsRef.current);
      addSuggestionBatch(batch);
    } catch (e) {
      console.error('Suggestions error:', e);
    } finally {
      setIsSuggestionsLoading(false);
    }
  }, [addSuggestionBatch, setIsSuggestionsLoading]);

  // Auto-refresh every N seconds while recording — unconditionally, no chunk-count gate
  useEffect(() => {
    if (!isRecording) return;

    // Fire once immediately when recording starts and there's transcript
    if (chunks.length > 0) refresh();

    const id = setInterval(() => {
      if (isRecordingRef.current && chunksRef.current.length > 0) {
        refresh();
      }
    }, settings.refreshIntervalSeconds * 1000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]); // only re-register when recording state changes

  // Also fire whenever a new transcript chunk arrives (right after transcription)
  const prevChunkCount = useRef(0);
  useEffect(() => {
    if (chunks.length > prevChunkCount.current && isRecording) {
      prevChunkCount.current = chunks.length;
      refresh();
    }
  }, [chunks.length, isRecording, refresh]);

  return (
    <div className="panel suggestions-panel">
      <div className="panel-header">
        <div className="panel-title-row">
          <Lightbulb size={16} className="panel-icon" />
          <h2 className="panel-title">Live Suggestions</h2>
        </div>
        <button
          className={`refresh-btn ${isSuggestionsLoading ? 'spinning' : ''}`}
          onClick={refresh}
          disabled={isSuggestionsLoading || !chunks.length}
          title="Manually refresh suggestions"
        >
          <RefreshCw size={15} />
          <span>{isSuggestionsLoading ? 'Thinking…' : 'Refresh'}</span>
        </button>
      </div>

      <div className="suggestions-scroll">
        {suggestionBatches.length === 0 ? (
          <div className="empty-state">
            <Lightbulb size={28} className="empty-icon" />
            <p>Start recording — suggestions appear automatically.</p>
            <p className="hint">Refreshes every {settings.refreshIntervalSeconds}s and after each transcript chunk.</p>
          </div>
        ) : (
          <div className="batches-list">
            {suggestionBatches.map((batch, batchIdx) => (
              <div key={batch.id} className="batch">
                <div className="batch-header">
                  <span className="batch-label">
                    {batchIdx === 0 ? '🔥 Latest' : formatTimestamp(batch.timestamp)}
                  </span>
                  {batchIdx === 0 && (
                    <span className="batch-time">{formatTimestamp(batch.timestamp)}</span>
                  )}
                </div>
                <div className="batch-cards">
                  {batch.suggestions.map((s) => (
                    <SuggestionCard key={s.id} suggestion={s} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}