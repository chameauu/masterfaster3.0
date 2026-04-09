# Voice Assistant Frontend Components Specification

> **Complete component inventory for the voice-first interface**  
> **Framework:** Next.js 16 + React 19 + TypeScript  
> **Last Updated:** 2026-04-09

---

## 📁 Directory Structure

```
frontend/
├── app/
│   └── dashboard/
│       └── voice/
│           ├── page.tsx                    # Main voice page
│           ├── layout.tsx                  # Voice layout wrapper
│           └── loading.tsx                 # Loading state
│
├── components/
│   └── voice/
│       ├── VoiceInterface.tsx              # Main container
│       ├── VoiceRecorder.tsx               # Audio recording
│       ├── AudioPlayer.tsx                 # Audio playback
│       ├── ConversationHistory.tsx         # Chat history
│       ├── VoiceSettings.tsx               # Settings panel
│       ├── VoiceVisualizer.tsx             # Audio waveform
│       ├── QuizInterface.tsx               # Quiz mode UI
│       ├── VoiceOnboarding.tsx             # First-time setup
│       ├── VoiceStatus.tsx                 # Connection status
│       ├── VoiceControls.tsx               # Action buttons
│       ├── VoiceError.tsx                  # Error display
│       ├── ConversationTurn.tsx            # Single turn item
│       ├── CitationDisplay.tsx             # Source citations
│       ├── QuizQuestion.tsx                # Question display
│       ├── QuizScore.tsx                   # Score display
│       └── VoiceHelp.tsx                   # Help overlay
│
├── atoms/
│   └── voice/
│       ├── voiceSessionAtom.ts             # Session state
│       ├── voiceConversationAtom.ts        # Conversation state
│       ├── voiceSettingsAtom.ts            # User preferences
│       ├── voiceUIAtom.ts                  # UI state
│       └── voiceQuizAtom.ts                # Quiz state
│
├── hooks/
│   └── voice/
│       ├── use-voice-recording.ts          # Recording logic
│       ├── use-audio-playback.ts           # Playback logic
│       ├── use-voice-conversation.ts       # Conversation management
│       ├── use-voice-activity-detection.ts # VAD logic
│       ├── use-quiz-state.ts               # Quiz management
│       ├── use-webrtc.ts                   # WebRTC connection
│       └── use-voice-session.ts            # Session management
│
├── lib/
│   ├── apis/
│   │   └── voice/
│   │       ├── voice-api.ts                # API client
│   │       ├── voice-types.ts              # Type definitions
│   │       └── voice-errors.ts             # Error classes
│   │
│   └── voice/
│       ├── webrtc-manager.ts               # WebRTC logic
│       ├── audio-utils.ts                  # Audio processing
│       ├── audio-recorder.ts               # Recording utilities
│       └── audio-player-utils.ts           # Playback utilities
│
└── types/
    └── voice.d.ts                          # Global voice types
```

---

## 🎯 Core Components

### 1. VoiceInterface (Main Container)

**File:** `components/voice/VoiceInterface.tsx`

**Purpose:** Main orchestrator component that manages the entire voice interaction flow

**Props:**
```typescript
interface VoiceInterfaceProps {
  userId: string;
  initialMode?: 'search' | 'quiz' | 'summarize';
  onSessionEnd?: () => void;
}
```

**State Management:**
- Uses all voice atoms
- Manages WebRTC connection
- Coordinates child components

**Children:**
- VoiceRecorder
- AudioPlayer
- ConversationHistory
- VoiceStatus
- VoiceControls
- VoiceError (conditional)

**Responsibilities:**
- Initialize voice session
- Handle recording → transcription → response flow
- Manage connection state
- Handle errors globally
- Coordinate UI updates

**Accessibility:**
- ARIA live regions for status updates
- Keyboard navigation support
- Screen reader announcements
- Focus management

---

### 2. VoiceRecorder

**File:** `components/voice/VoiceRecorder.tsx`

**Purpose:** Handles audio recording from user's microphone

**Props:**
```typescript
interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onError: (error: Error) => void;
  maxDuration?: number; // seconds, default 30
  autoStop?: boolean;
}
```

**State:**
- isRecording: boolean
- recordingTime: number
- permissionGranted: boolean
- error: Error | null

**Features:**
- Request microphone permission
- Start/stop recording
- Visual recording indicator
- Timer display
- Auto-stop after max duration
- Audio level visualization

**Accessibility:**
- Large touch target (≥44x44px)
- Clear visual feedback
- Audio cues for start/stop
- Keyboard shortcuts (Space to record)

---

### 3. AudioPlayer

**File:** `components/voice/AudioPlayer.tsx`

**Purpose:** Plays audio responses from the assistant

**Props:**
```typescript
interface AudioPlayerProps {
  audioUrl?: string;
  audioBlob?: Blob;
  autoPlay?: boolean;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  onError: (error: Error) => void;
  showControls?: boolean;
}
```

**State:**
- isPlaying: boolean
- isPaused: boolean
- currentTime: number
- duration: number
- volume: number
- playbackRate: number

**Features:**
- Play/pause/stop controls
- Volume control
- Playback speed control (0.5x - 2x)
- Progress bar
- Time display
- Queue management (multiple responses)

**Accessibility:**
- Keyboard controls (Space, Arrow keys)
- Screen reader announcements
- Visual playback indicator

---

### 4. ConversationHistory

**File:** `components/voice/ConversationHistory.tsx`

**Purpose:** Displays the conversation between user and assistant

**Props:**
```typescript
interface ConversationHistoryProps {
  turns: ConversationTurn[];
  onTurnClick?: (turn: ConversationTurn) => void;
  maxHeight?: string;
  showTimestamps?: boolean;
  showCitations?: boolean;
}

interface ConversationTurn {
  id: string;
  userInput: string;
  assistantResponse: string;
  timestamp: Date;
  citations?: Citation[];
  intentType: 'search' | 'summarize' | 'quiz' | 'follow_up';
}
```

**Features:**
- Scrollable list of turns
- User input display
- Assistant response display
- Timestamps
- Citations (expandable)
- Auto-scroll to latest
- Virtualization for performance

**Accessibility:**
- Semantic HTML (list structure)
- ARIA labels
- Keyboard navigation
- Screen reader friendly

---

### 5. VoiceSettings

**File:** `components/voice/VoiceSettings.tsx`

**Purpose:** User preferences and configuration

**Props:**
```typescript
interface VoiceSettingsProps {
  onSave: (settings: VoiceSettings) => void;
  onCancel: () => void;
  initialSettings?: VoiceSettings;
}

interface VoiceSettings {
  selectedVoice: string;
  speechRate: number; // 0.5 - 2.0
  volume: number; // 0 - 1
  language: string;
  microphoneDevice: string;
  speakerDevice: string;
  autoStartListening: boolean;
  confirmationSounds: boolean;
  citationVerbosity: 'brief' | 'standard' | 'detailed';
}
```

**Features:**
- Voice selection dropdown
- Speech rate slider
- Volume slider
- Language selector
- Device selection (mic/speaker)
- Toggle switches for preferences
- Preview button (test settings)
- Save/cancel buttons

**Accessibility:**
- Form labels
- Keyboard navigation
- Focus indicators
- Help text for each setting

---

### 6. VoiceVisualizer

**File:** `components/voice/VoiceVisualizer.tsx`

**Purpose:** Visual feedback for audio activity

**Props:**
```typescript
interface VoiceVisualizerProps {
  audioStream?: MediaStream;
  mode: 'listening' | 'speaking' | 'processing' | 'idle';
  size?: 'small' | 'medium' | 'large';
  color?: string;
}
```

**Features:**
- Waveform visualization (Canvas API)
- Animated listening indicator
- Animated speaking indicator
- Processing spinner
- Idle state
- Smooth transitions

**Accessibility:**
- ARIA live region for state changes
- Text alternative for visual state
- High contrast mode support

---

### 7. QuizInterface

**File:** `components/voice/QuizInterface.tsx`

**Purpose:** Interactive quiz mode UI

**Props:**
```typescript
interface QuizInterfaceProps {
  quiz: Quiz;
  onAnswerSubmit: (answer: string) => void;
  onQuizEnd: () => void;
  onQuizSkip: () => void;
}

interface Quiz {
  id: string;
  topic: string;
  questions: Question[];
  currentQuestionIndex: number;
  score: number;
  totalQuestions: number;
}

interface Question {
  id: string;
  text: string;
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
  feedback?: string;
}
```

**Features:**
- Question display
- Question number indicator (e.g., "2 of 5")
- Progress bar
- Score display
- Answer feedback (correct/incorrect)
- Skip button
- End quiz button
- Quiz completion screen

**Accessibility:**
- Clear question structure
- Feedback announcements
- Keyboard navigation
- Focus management

---

### 8. VoiceOnboarding

**File:** `components/voice/VoiceOnboarding.tsx`

**Purpose:** First-time user setup and tutorial

**Props:**
```typescript
interface VoiceOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}
```

**Steps:**
1. Welcome screen
2. Microphone permission request
3. Voice selection
4. Quick tutorial (example commands)
5. First interaction guide

**Features:**
- Step indicator (1 of 5)
- Next/back buttons
- Skip option
- Progress bar
- Interactive examples

**Accessibility:**
- Voice-guided instructions
- Keyboard navigation
- Clear step indicators

---

### 9. VoiceStatus

**File:** `components/voice/VoiceStatus.tsx`

**Purpose:** Display connection and processing status

**Props:**
```typescript
interface VoiceStatusProps {
  connectionState: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
  processingState: 'idle' | 'recording' | 'transcribing' | 'processing' | 'responding';
  message?: string;
}
```

**Features:**
- Connection indicator
- Processing state display
- Status messages
- Error indicators
- Animated icons

**Accessibility:**
- ARIA live region
- Screen reader announcements
- Visual + text indicators

---

### 10. VoiceControls

**File:** `components/voice/VoiceControls.tsx`

**Purpose:** Action buttons for voice interface

**Props:**
```typescript
interface VoiceControlsProps {
  onSettingsClick: () => void;
  onHelpClick: () => void;
  onEndSession: () => void;
  disabled?: boolean;
}
```

**Features:**
- Settings button
- Help button
- End session button
- Clear conversation button
- Keyboard shortcuts display

**Accessibility:**
- Large touch targets
- Keyboard shortcuts
- Tooltips
- ARIA labels

---

## 🧩 Supporting Components

### 11. VoiceError

**File:** `components/voice/VoiceError.tsx`

**Purpose:** Display and handle errors

**Props:**
```typescript
interface VoiceErrorProps {
  error: VoiceError;
  onRetry?: () => void;
  onDismiss: () => void;
}

interface VoiceError {
  type: 'permission' | 'network' | 'api' | 'audio' | 'unknown';
  message: string;
  details?: string;
  recoverable: boolean;
}
```

**Features:**
- Error message display
- Error details (expandable)
- Retry button (if recoverable)
- Dismiss button
- Help link

---

### 12. ConversationTurn

**File:** `components/voice/ConversationTurn.tsx`

**Purpose:** Single turn in conversation history

**Props:**
```typescript
interface ConversationTurnProps {
  turn: ConversationTurn;
  showTimestamp?: boolean;
  showCitations?: boolean;
  onCitationClick?: (citation: Citation) => void;
}
```

**Features:**
- User input display
- Assistant response display
- Timestamp
- Citations (if any)
- Intent type indicator

---

### 13. CitationDisplay

**File:** `components/voice/CitationDisplay.tsx`

**Purpose:** Display source citations

**Props:**
```typescript
interface CitationDisplayProps {
  citations: Citation[];
  onCitationClick?: (citation: Citation) => void;
  compact?: boolean;
}

interface Citation {
  id: string;
  source: string;
  title?: string;
  page?: number;
  section?: string;
  url?: string;
}
```

**Features:**
- Citation list
- Clickable citations (open document)
- Compact/expanded view
- Source icons

---

### 14. QuizQuestion

**File:** `components/voice/QuizQuestion.tsx`

**Purpose:** Display single quiz question

**Props:**
```typescript
interface QuizQuestionProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswerSubmit: (answer: string) => void;
}
```

**Features:**
- Question text
- Question number
- Answer input (voice or text)
- Submit button

---

### 15. QuizScore

**File:** `components/voice/QuizScore.tsx`

**Purpose:** Display quiz score and results

**Props:**
```typescript
interface QuizScoreProps {
  score: number;
  totalQuestions: number;
  questions: Question[];
  onReviewClick?: () => void;
  onNewQuizClick?: () => void;
}
```

**Features:**
- Score display (X out of Y)
- Percentage
- Correct/incorrect breakdown
- Review answers button
- Start new quiz button

---

### 16. VoiceHelp

**File:** `components/voice/VoiceHelp.tsx`

**Purpose:** Help overlay with commands and tips

**Props:**
```typescript
interface VoiceHelpProps {
  onClose: () => void;
}
```

**Features:**
- Example commands
- Feature explanations
- Keyboard shortcuts
- Tips and tricks
- FAQ
- Close button

---

## 🎨 UI Components (Reusable)

### 17. VoiceButton

**File:** `components/voice/ui/VoiceButton.tsx`

**Purpose:** Accessible button for voice interface

**Props:**
```typescript
interface VoiceButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
}
```

---

### 18. VoiceCard

**File:** `components/voice/ui/VoiceCard.tsx`

**Purpose:** Card container for voice UI sections

**Props:**
```typescript
interface VoiceCardProps {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}
```

---

### 19. VoiceSlider

**File:** `components/voice/ui/VoiceSlider.tsx`

**Purpose:** Accessible slider for settings

**Props:**
```typescript
interface VoiceSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}
```

---

### 20. VoiceToggle

**File:** `components/voice/ui/VoiceToggle.tsx`

**Purpose:** Accessible toggle switch

**Props:**
```typescript
interface VoiceToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}
```

---

## 🪝 Custom Hooks

### 21. use-voice-recording

**File:** `hooks/voice/use-voice-recording.ts`

**Purpose:** Manage audio recording

**Returns:**
```typescript
interface UseVoiceRecordingReturn {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob>;
  isRecording: boolean;
  recordingTime: number;
  error: Error | null;
  permissionGranted: boolean;
}
```

---

### 22. use-audio-playback

**File:** `hooks/voice/use-audio-playback.ts`

**Purpose:** Manage audio playback

**Returns:**
```typescript
interface UseAudioPlaybackReturn {
  playAudio: (url: string | Blob) => Promise<void>;
  pauseAudio: () => void;
  resumeAudio: () => void;
  stopAudio: () => void;
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  setVolume: (volume: number) => void;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
}
```

---

### 23. use-voice-conversation

**File:** `hooks/voice/use-voice-conversation.ts`

**Purpose:** Manage conversation state

**Returns:**
```typescript
interface UseVoiceConversationReturn {
  turns: ConversationTurn[];
  addTurn: (userInput: string, response: string, citations?: Citation[]) => void;
  clearConversation: () => void;
  getContext: () => Record<string, any>;
  updateContext: (key: string, value: any) => void;
}
```

---

### 24. use-voice-activity-detection

**File:** `hooks/voice/use-voice-activity-detection.ts`

**Purpose:** Detect speech in audio stream

**Returns:**
```typescript
interface UseVoiceActivityDetectionReturn {
  isSpeaking: boolean;
  audioLevel: number;
  startDetection: (stream: MediaStream) => void;
  stopDetection: () => void;
  sensitivity: number;
  setSensitivity: (value: number) => void;
}
```

---

### 25. use-quiz-state

**File:** `hooks/voice/use-quiz-state.ts`

**Purpose:** Manage quiz state

**Returns:**
```typescript
interface UseQuizStateReturn {
  quiz: Quiz | null;
  startQuiz: (topic: string, numQuestions: number) => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  skipQuestion: () => void;
  endQuiz: () => void;
  currentQuestion: Question | null;
  isLoading: boolean;
  error: Error | null;
}
```

---

### 26. use-webrtc

**File:** `hooks/voice/use-webrtc.ts`

**Purpose:** Manage WebRTC connection

**Returns:**
```typescript
interface UseWebRTCReturn {
  connect: (sessionId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  sendAudio: (audio: ArrayBuffer) => void;
  onAudioReceived: (callback: (audio: ArrayBuffer) => void) => void;
  connectionState: RTCPeerConnectionState;
  isConnected: boolean;
  error: Error | null;
}
```

---

### 27. use-voice-session

**File:** `hooks/voice/use-voice-session.ts`

**Purpose:** Manage voice session lifecycle

**Returns:**
```typescript
interface UseVoiceSessionReturn {
  sessionId: string | null;
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  isActive: boolean;
  error: Error | null;
}
```

---

## 🔧 Utility Modules

### 28. webrtc-manager

**File:** `lib/voice/webrtc-manager.ts`

**Purpose:** WebRTC connection management

**Exports:**
```typescript
export class WebRTCManager {
  async connect(sessionId: string): Promise<void>;
  async disconnect(): Promise<void>;
  sendAudio(audio: ArrayBuffer): void;
  onAudioReceived(callback: (audio: ArrayBuffer) => void): void;
  getConnectionState(): RTCPeerConnectionState;
}
```

---

### 29. audio-utils

**File:** `lib/voice/audio-utils.ts`

**Purpose:** Audio processing utilities

**Exports:**
```typescript
export function convertAudioFormat(blob: Blob, format: string): Promise<Blob>;
export function normalizeVolume(audioData: Float32Array): Float32Array;
export function detectSilence(audioData: Float32Array, threshold: number): boolean;
export function calculateWaveform(audioData: Float32Array): number[];
export function getAudioDevices(): Promise<MediaDeviceInfo[]>;
export function resampleAudio(audioData: Float32Array, fromRate: number, toRate: number): Float32Array;
```

---

### 30. voice-api

**File:** `lib/apis/voice/voice-api.ts`

**Purpose:** Backend API client

**Exports:**
```typescript
export class VoiceAPI {
  async initializeSession(userId: string): Promise<Session>;
  async closeSession(sessionId: string): Promise<void>;
  async sendAudio(sessionId: string, audioBlob: Blob): Promise<VoiceResponse>;
  async getConversationHistory(sessionId: string): Promise<ConversationTurn[]>;
  async clearConversation(sessionId: string): Promise<void>;
  async startQuiz(sessionId: string, topic: string, numQuestions: number): Promise<Quiz>;
  async submitQuizAnswer(quizId: string, answer: string): Promise<Evaluation>;
}
```

---

## 🎭 State Atoms (Jotai)

### 31. voiceSessionAtom

**File:** `atoms/voice/voiceSessionAtom.ts`

**State:**
```typescript
interface VoiceSession {
  sessionId: string | null;
  userId: string;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
  startTime: Date | null;
  lastActivity: Date | null;
}
```

---

### 32. voiceConversationAtom

**File:** `atoms/voice/voiceConversationAtom.ts`

**State:**
```typescript
interface VoiceConversation {
  turns: ConversationTurn[];
  currentTurn: ConversationTurn | null;
  contextData: Record<string, any>;
  activeDocument: string | null;
}
```

---

### 33. voiceSettingsAtom

**File:** `atoms/voice/voiceSettingsAtom.ts`

**State:**
```typescript
interface VoiceSettings {
  selectedVoice: string;
  speechRate: number;
  volume: number;
  language: string;
  microphoneDevice: string;
  speakerDevice: string;
  autoStartListening: boolean;
  confirmationSounds: boolean;
  citationVerbosity: 'brief' | 'standard' | 'detailed';
}
```

---

### 34. voiceUIAtom

**File:** `atoms/voice/voiceUIAtom.ts`

**State:**
```typescript
interface VoiceUI {
  recordingState: 'idle' | 'recording' | 'processing';
  playingState: 'idle' | 'playing' | 'paused';
  processingState: 'idle' | 'transcribing' | 'understanding' | 'searching' | 'responding';
  errorMessage: string | null;
  uiMode: 'search' | 'quiz' | 'summarize';
  showSettings: boolean;
  showHelp: boolean;
  showOnboarding: boolean;
}
```

---

### 35. voiceQuizAtom

**File:** `atoms/voice/voiceQuizAtom.ts`

**State:**
```typescript
interface VoiceQuiz {
  quizId: string | null;
  topic: string | null;
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: Answer[];
  score: number;
  totalQuestions: number;
  quizState: 'idle' | 'active' | 'completed';
  startTime: Date | null;
  endTime: Date | null;
}
```

---

## 📊 Summary

### Component Count
- **Core Components:** 10
- **Supporting Components:** 6
- **UI Components:** 4
- **Custom Hooks:** 7
- **Utility Modules:** 3
- **State Atoms:** 5

**Total:** 35 components/modules

### Complexity Distribution
- **High Complexity:** VoiceInterface, WebRTCManager, use-webrtc
- **Medium Complexity:** VoiceRecorder, AudioPlayer, QuizInterface, ConversationHistory
- **Low Complexity:** UI components, display components, atoms

### Dependencies
- React 19 (hooks, context)
- Next.js 16 (routing, SSR)
- Jotai (state management)
- Radix UI (accessible primitives)
- Tailwind CSS (styling)
- TypeScript (type safety)

---

## 🚀 Implementation Order

### Phase 1: Foundation (Week 1)
1. State atoms (all 5)
2. Type definitions
3. Utility modules (audio-utils, voice-api)

### Phase 2: Core Components (Week 2)
4. VoiceRecorder
5. AudioPlayer
6. use-voice-recording
7. use-audio-playback

### Phase 3: Integration (Week 3)
8. VoiceInterface
9. ConversationHistory
10. VoiceStatus
11. VoiceControls
12. use-voice-conversation

### Phase 4: Advanced (Week 4)
13. QuizInterface
14. VoiceSettings
15. VoiceOnboarding
16. use-quiz-state

### Phase 5: WebRTC (Week 5-6)
17. WebRTCManager
18. use-webrtc
19. VoiceVisualizer

### Phase 6: Polish (Week 7-8)
20. All supporting components
21. UI components
22. Error handling
23. Accessibility improvements

---

**This specification provides a complete blueprint for building the voice assistant frontend.** 🎯
