'use client';

import { useState } from 'react';
import { X, Settings, Eye, EyeOff } from 'lucide-react';
import { useStore } from '@/lib/store';
import { DEFAULT_SETTINGS } from '@/lib/types';

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const { settings, setSettings } = useStore();
  const [local, setLocal] = useState(settings);
  const [showKey, setShowKey] = useState(false);

  const set = (k: keyof typeof local, v: string | number) =>
    setLocal((p) => ({ ...p, [k]: v }));

  const save = () => {
    setSettings(local);
    onClose();
  };

  const reset = () => setLocal(DEFAULT_SETTINGS);

  return (
    <div className="settings-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="settings-modal">
        <div className="settings-header">
          <div className="settings-title">
            <Settings size={18} />
            <span>Settings</span>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="settings-body">
          {/* API Key */}
          <section className="settings-section">
            <h3 className="section-label">Groq API Key</h3>
            <div className="key-field">
              <input
                type={showKey ? 'text' : 'password'}
                value={local.groqApiKey}
                onChange={(e) => set('groqApiKey', e.target.value)}
                placeholder="gsk_..."
                className="settings-input"
                spellCheck={false}
              />
              <button className="icon-btn" onClick={() => setShowKey((v) => !v)}>
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="hint">Get your key at <a href="https://console.groq.com" target="_blank" rel="noreferrer">console.groq.com</a></p>
          </section>

          {/* Context Windows */}
          <section className="settings-section">
            <h3 className="section-label">Context Windows</h3>
            <div className="settings-row">
              <label>Suggestion context (chars)</label>
              <input
                type="number"
                value={local.suggestionContextWindow}
                onChange={(e) => set('suggestionContextWindow', Number(e.target.value))}
                className="settings-input-sm"
                min={500}
                max={32000}
              />
            </div>
            <div className="settings-row">
              <label>Chat context (chars)</label>
              <input
                type="number"
                value={local.chatContextWindow}
                onChange={(e) => set('chatContextWindow', Number(e.target.value))}
                className="settings-input-sm"
                min={500}
                max={32000}
              />
            </div>
            <div className="settings-row">
              <label>Auto-refresh interval (seconds)</label>
              <input
                type="number"
                value={local.refreshIntervalSeconds}
                onChange={(e) => set('refreshIntervalSeconds', Number(e.target.value))}
                className="settings-input-sm"
                min={10}
                max={120}
              />
            </div>
          </section>

          {/* Prompts */}
          <section className="settings-section">
            <h3 className="section-label">Live Suggestions Prompt</h3>
            <textarea
              value={local.suggestionPrompt}
              onChange={(e) => set('suggestionPrompt', e.target.value)}
              className="settings-textarea"
              rows={10}
            />
          </section>

          <section className="settings-section">
            <h3 className="section-label">Detailed Answer Prompt (on click)</h3>
            <textarea
              value={local.detailedAnswerPrompt}
              onChange={(e) => set('detailedAnswerPrompt', e.target.value)}
              className="settings-textarea"
              rows={8}
            />
          </section>

          <section className="settings-section">
            <h3 className="section-label">Chat System Prompt</h3>
            <textarea
              value={local.chatPrompt}
              onChange={(e) => set('chatPrompt', e.target.value)}
              className="settings-textarea"
              rows={6}
            />
          </section>
        </div>

        <div className="settings-footer">
          <button className="btn-ghost" onClick={reset}>Reset to defaults</button>
          <div className="footer-right">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={save}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}