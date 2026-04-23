'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { transcribeAudio } from '@/lib/groq';
import { formatTimestamp } from '@/lib/utils';

const CHUNK_INTERVAL_MS = 30_000;

export default function TranscriptPanel() {
  const { chunks, addChunk, clearTranscript, isRecording, setIsRecording, settings } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRecordingRef = useRef(false); // stable ref for interval callback
  const scrollRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chunks]);

  /** Record for exactly durationMs, then transcribe the resulting blob */
  const recordAndTranscribe = useCallback((stream: MediaStream, durationMs: number): Promise<void> => {
    return new Promise((resolve) => {
      const mimeType = mimeTypeRef.current;
      const recorder = new MediaRecorder(stream, { mimeType });
      const blobs: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) blobs.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(blobs, { type: mimeType });
        if (blob.size < 2000) { resolve(); return; } // skip silence

        setIsTranscribing(true);
        try {
          const text = await transcribeAudio(blob, settingsRef.current.groqApiKey);
          if (text.trim()) addChunk(text);
        } catch (e) {
          console.error('Transcription error:', e);
          setError((e as Error).message);
        } finally {
          setIsTranscribing(false);
          resolve();
        }
      };

      recorder.start();
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, durationMs);
    });
  }, [addChunk]);

  const startRecording = useCallback(async () => {
    if (!settings.groqApiKey) {
      setError('Please add your Groq API key in Settings first.');
      return;
    }
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Pick best supported mime type
      mimeTypeRef.current = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
        .find((t) => MediaRecorder.isTypeSupported(t)) ?? 'audio/webm';

      isRecordingRef.current = true;
      setIsRecording(true);

      // Immediately start the first chunk
      const runCycle = () => {
        if (!isRecordingRef.current || !streamRef.current) return;
        recordAndTranscribe(streamRef.current, CHUNK_INTERVAL_MS).then(() => {
          if (isRecordingRef.current) runCycle(); // chain next chunk
        });
      };
      runCycle();

    } catch (e) {
      setError('Microphone access denied. Please allow mic permissions.');
      console.error(e);
    }
  }, [recordAndTranscribe, setIsRecording, settings.groqApiKey]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsRecording(false);
  }, [setIsRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="panel transcript-panel">
      <div className="panel-header">
        <h2 className="panel-title">Transcript</h2>
        <div className="panel-actions">
          {isTranscribing && <span className="badge-transcribing">Transcribing…</span>}
          <button
            className="icon-btn danger"
            onClick={clearTranscript}
            title="Clear transcript"
            disabled={isRecording}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="transcript-scroll" ref={scrollRef}>
        {chunks.length === 0 ? (
          <div className="empty-state">
            <p>Press the mic to start recording.</p>
            <p className="hint">Transcript appears in ~30s chunks.</p>
          </div>
        ) : (
          <div className="chunks-list">
            {chunks.map((chunk) => (
              <div key={chunk.id} className="chunk">
                <span className="chunk-time">{formatTimestamp(chunk.timestamp)}</span>
                <p className="chunk-text">{chunk.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="error-bar">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="mic-footer">
        <button
          className={`mic-btn ${isRecording ? 'mic-active' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
          title={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording ? (
            <>
              <MicOff size={20} />
              <span>Stop</span>
              <span className="rec-dot" />
            </>
          ) : (
            <>
              <Mic size={20} />
              <span>Record</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}