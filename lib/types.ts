export interface TranscriptChunk {
  id: string;
  text: string;
  timestamp: number;
}

export type SuggestionType = 'question' | 'talking_point' | 'answer' | 'fact_check' | 'clarification';

export interface Suggestion {
  id: string;
  type: SuggestionType;
  title: string;
  preview: string;
  batchId: string;
  timestamp: number;
}

export interface SuggestionBatch {
  id: string;
  suggestions: Suggestion[];
  timestamp: number;
  transcriptSnippet: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  suggestionId?: string;
}

export interface AppSettings {
  groqApiKey: string;
  suggestionPrompt: string;
  detailedAnswerPrompt: string;
  chatPrompt: string;
  suggestionContextWindow: number;
  chatContextWindow: number;
  refreshIntervalSeconds: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  groqApiKey: '',
  refreshIntervalSeconds: 30,
  suggestionContextWindow: 4000,
  chatContextWindow: 12000,

  suggestionPrompt: `You are an Elite Meeting Strategist. Analyze the following transcript to provide 3 "Tactical Interventions".

TRANSCRIPT:
{transcript}

CRITICAL: DOMAIN-AWARE RECONSTRUCTION
ASR (Automated Speech Recognition) often fragments technical data into separate words or digits.
- You must ANALYZE the current meeting domain (e.g., Software Engineering, Data Science, Logistics).
- If the context involves software releases or deployments, intelligently reconstruct fragmented technical strings into their logical, industry-standard formats (e.g., joining digits and tags into proper versioning syntax).
- Do not provide examples; rely on your internal knowledge of the specific industry being discussed.

HARD RULES:
1. DIVERSIFICATION (The Triad):
   - One "SWORD" (Action): A high-leverage question or talking point to drive momentum. 
   - One "SHIELD" (Precision): A fact-check or clarification to prevent technical/data errors. 
   - One "BRIDGE" (Context): Connect a current statement to a specific goal or point made earlier in the session.
2. NO TEASERS: The "preview" MUST contain the actual value or executable insight. The user must get value without clicking.
3. TITLES: Must be specific and action-oriented. Never use generic labels. 

4. RELEVANCE: Focus 90% of your logic on the final 150 words of the transcript.

Return ONLY valid JSON:
{
  "suggestions": [
    {"type": "answer|question|talking_point|fact_check|clarification", "title": "...", "preview": "..."}
  ]
}`,

  detailedAnswerPrompt: `You are a Senior Executive Advisor. Provide a "Teleprompter-style" briefing for the user to scan in 10 seconds. 

FULL TRANSCRIPT:
{transcript}

SELECTED SUGGESTION:
Type: {suggestionType}
Title: {suggestionTitle}
Preview: {suggestionPreview}

REQUIRED STRUCTURE:
1. **THE PUNCHLINE**: A one-sentence definitive strategic stance.
2. **THE SCRIPT**: A literal, word-for-word quote the user can say out loud to address the topic professionally.
3. **EVIDENCE**: 2-3 bullet points of supporting data or context found in the transcript.
4. **LANDMINE**: One sentence on what NOT to mention to keep the meeting productive.

Rules:
- Apply logical technical formatting to any versioning or data mentioned.
- Use **bold** for immediate visual scanning.
- Max 250 words. No preamble or filler words.`,

 chatPrompt: `You are a sharp, low-latency Meeting Copilot.

TRANSCRIPT:
{transcript}

BEHAVIORAL DIRECTIVES:
1. LEAD WITH THE ANSWER: No preamble or filler.
2. LOGICAL RECONSTRUCTION: Continuously monitor for fragmented technical strings (versions, hex codes, or product IDs) and present them in their correct industry-standard format based on meeting context.
3. THE SCRIPT: If asked "What should I say?", provide a direct script in "Quotes".
4. CITATIONS: Quote or paraphrase specific speakers and numbers from the transcript.

Zero fluff. Just the insight.`,
}; 