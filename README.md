TMLivePoint - Your AI Intervener

A real-time meeting assistant that transcribes your microphone, surfaces 3 live tactical suggestions every 30 seconds, and lets you deep-dive via chat — all powered by Groq.

**Live URL:** https://tmlivepoint2.vercel.app/

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Zero-config deploy on Vercel, RSC-ready |
| State | Zustand | Minimal, no boilerplate, works perfectly with refs for interval callbacks |
| Transcription | Groq Whisper Large V3 | Fastest Whisper inference available |
| Suggestions + Chat | Groq `openai/gpt-oss-120b` | Required by spec; fast enough for live use |
| Styling | Pure CSS custom properties | No Tailwind overhead, full design control |
| Markdown | react-markdown | Renders structured chat responses cleanly |

---

## How to run locally

```bash
git clone https://github.com/HARIPRIYA02/TMLivePoint
cd tmlivepoint
npm install
npm run dev
```

Open `http://localhost:3000`, click **Settings**, paste your Groq API key from [console.groq.com](https://console.groq.com).

No `.env` file needed — the key is entered at runtime and never stored.

---

## Prompt Strategy

### Live Suggestions — The Triad Model

Every refresh produces exactly one **SWORD**, one **SHIELD**, and one **BRIDGE**:

- **SWORD** (Action) — A high-leverage question or talking point to drive momentum forward
- **SHIELD** (Precision) — A fact-check or clarification to catch errors before they compound  
- **BRIDGE** (Context) — Connects the current moment to a goal or commitment made earlier

**Why this works better than free-form type selection:**

Most assistants surface 3 suggestions of the same type (3 questions, or 3 talking points). The Triad forces diversity so every batch covers action, accuracy, and continuity simultaneously — matching how real meeting advisors think.

**Mandatory triggers:**
- Question asked in last 60 words → SHIELD must be an `answer`
- Verifiable claim with a number → SHIELD must be a `fact_check`
- Jargon or ambiguous term → SHIELD must be a `clarification`

**Context window:** 4,000 chars (~600 words), weighted 90% toward the final 150 words. Earlier content provides background; recent exchanges drive the suggestion.

**Temperature cycling:** Each refresh uses a slightly different temperature `[0.7, 0.8, 0.75, 0.72, 0.78, 0.82]` so repeated refreshes on the same transcript produce meaningfully different suggestions rather than paraphrases of each other.

### Detailed Answers — Teleprompter Format

Structured for someone with 10 seconds to scan before speaking:

1. **THE PUNCHLINE** — one-sentence stance
2. **THE SCRIPT** — literal words they can say out loud
3. **EVIDENCE** — 2-3 bullets from the transcript
4. **LANDMINE** — what not to mention

This format came from testing: generic "here's more context" answers don't help in live meetings. People need a script, not an essay.

### Chat — Low-latency Copilot

Full transcript injected as context on every message. Streaming enabled so first token appears in ~300ms. Behavioral directives: lead with the answer, cite transcript specifics, give "quoted scripts" when asked what to say.

---

## Audio Architecture

stop and restart - fresh `MediaRecorder` every 30 seconds. Each recording gets its own valid WebM header. The mic stream stays open continuously — only the recorder restarts.

```
mic stream (continuous)
  └── MediaRecorder #1 → 30s → stop → transcribe → new batch
  └── MediaRecorder #2 → 30s → stop → transcribe → new batch
  └── ...
```

Suggestions fire: (1) immediately when a new transcript chunk arrives, (2) on the 30s interval timer, (3) on manual refresh click.

---

## Tradeoffs

| Decision | Tradeoff |
|---|---|
| 30s transcript chunks | Latency vs. cost — 10s chunks would feel more live but 3x the Whisper API calls |
| Client-side state only | No backend = no auth, no persistence, but instant deploy and zero infra cost |
| No `response_format: json_object` | `gpt-oss-120b` throws `json_validate_failed` with this flag — manual JSON extraction is more robust |
| Full transcript in every chat message | Higher token cost per message but ensures the model never loses context mid-conversation |
| Temperature cycling | Slightly unpredictable quality variance, but prevents suggestion staleness on repeated refreshes |

---

## What I'd improve with more time

1. **Speaker diarization** — knowing who said what changes suggestion direction entirely (your claim vs. their claim)
2. **Sub-5s latency** — replace 30s Whisper chunks with Deepgram streaming for near-realtime transcription
3. **Session memory** — persist transcripts and link meetings so the assistant knows "last time you talked to this person..."
4. **Predictive suggestions** — if someone says "let me walk you through pricing", surface objection cards *before* the objection lands
5. **Action item tracker** — live panel that extracts commitments ("I'll send that by Friday") as they're made
