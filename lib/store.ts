import { create } from 'zustand';
import {
  AppSettings,
  ChatMessage,
  DEFAULT_SETTINGS,
  Suggestion,
  SuggestionBatch,
  TranscriptChunk,
} from './types';
import { nanoid } from './utils';

interface AppState {
  // Settings
  settings: AppSettings;
  setSettings: (s: Partial<AppSettings>) => void;

  // Recording
  isRecording: boolean;
  setIsRecording: (v: boolean) => void;

  // Transcript
  chunks: TranscriptChunk[];
  addChunk: (text: string) => void;
  clearTranscript: () => void;

  // Suggestions
  suggestionBatches: SuggestionBatch[];
  addSuggestionBatch: (batch: SuggestionBatch) => void;
  clearSuggestions: () => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;

  // Loading states
  isSuggestionsLoading: boolean;
  setIsSuggestionsLoading: (v: boolean) => void;
  isChatLoading: boolean;
  setIsChatLoading: (v: boolean) => void;

  // UI
  activeSuggestion: Suggestion | null;
  setActiveSuggestion: (s: Suggestion | null) => void;
}

export const useStore = create<AppState>((set) => ({
  settings: DEFAULT_SETTINGS,
  setSettings: (s) =>
    set((state) => ({ settings: { ...state.settings, ...s } })),

  isRecording: false,
  setIsRecording: (v) => set({ isRecording: v }),

  chunks: [],
  addChunk: (text) =>
    set((state) => ({
      chunks: [
        ...state.chunks,
        { id: nanoid(), text, timestamp: Date.now() },
      ],
    })),
  clearTranscript: () => set({ chunks: [] }),

  suggestionBatches: [],
  addSuggestionBatch: (batch) =>
    set((state) => ({
      suggestionBatches: [batch, ...state.suggestionBatches],
    })),
  clearSuggestions: () => set({ suggestionBatches: [] }),

  chatMessages: [],
  addChatMessage: (msg) =>
    set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  clearChat: () => set({ chatMessages: [] }),

  isSuggestionsLoading: false,
  setIsSuggestionsLoading: (v) => set({ isSuggestionsLoading: v }),
  isChatLoading: false,
  setIsChatLoading: (v) => set({ isChatLoading: v }),

  activeSuggestion: null,
  setActiveSuggestion: (s) => set({ activeSuggestion: s }),
}));