"use client";

import { useState } from 'react';
import { Settings, Download, Zap } from 'lucide-react';
import TranscriptPanel from '@/components/TranscriptPanel';
import SuggestionsPanel from '@/components/SuggestionsPanel';
import ChatPanel from '@/components/ChatPanel';
import SettingsModal from '@/components/SettingsModal';
import { useStore } from '@/lib/store';
import { exportSession } from '@/lib/export';
 
export default function Home() {
  const [showSettings, setShowSettings] = useState(false);
  const { settings, chunks, suggestionBatches, chatMessages } = useStore();
  const hasKey = !!settings.groqApiKey;
 
  return (
    <div className="app-root">
      <header className="topbar">
        <div className="topbar-brand">
          <Zap size={20} className="brand-icon" />
          <span className="brand-name">MeetingMind</span>
          <span className="brand-tag">Live AI Assistant</span>
        </div>
        <div className="topbar-actions">
          {!hasKey && (
            <div className="no-key-warning">⚠ Add your Groq API key to start</div>
          )}
          <button
            className="icon-btn-labeled"
            onClick={() => exportSession(chunks, suggestionBatches, chatMessages)}
          >
            <Download size={15} />
            <span>Export</span>
          </button>
          <button
            className={`icon-btn-labeled ${!hasKey ? 'highlight' : ''}`}
            onClick={() => setShowSettings(true)}
          >
            <Settings size={15} />
            <span>Settings</span>
          </button>
        </div>
      </header>
 
      <main className="columns">
        <TranscriptPanel />
        <SuggestionsPanel />
        <ChatPanel />
      </main>
 
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
 