# Web Speech API - Quality Improvements & Language Configuration

**Date:** 2026-04-10  
**Purpose:** Improve voice quality and add language support to existing Web Speech API system  
**Status:** Implementation Guide

---

## 🎯 Overview

This guide shows how to improve the existing Web Speech API voice system in the dashboard with:
1. **Better speech recognition quality** (contextual biasing, hints)
2. **Language selection** (multi-language support)
3. **Voice selection** (choose specific TTS voices)
4. **Quality settings** (rate, pitch, volume)

---

## 📊 Current Implementation

**Location:** Dashboard composer (`/dashboard/.../new-chat`)

**Components:**
- `VoiceToggle.tsx` - Speech recognition (STT)
- `TTSToggle.tsx` - Text-to-speech (TTS)
- `use-auto-transcription.ts` - Auto-transcription hook
- `use-text-to-speech.ts` - TTS hook

---

## 🎤 Part 1: Improve Speech Recognition (STT)

### 1.1 Set Language

**Current:**
```typescript
const recognition = new SpeechRecognition();
recognition.lang = 'en-US';  // Fixed to English
```

**Improved (Dynamic Language):**
```typescript
// Add language selection
const [language, setLanguage] = useState('en-US');

const recognition = new SpeechRecognition();
recognition.lang = language;  // User-selected language

// Supported languages (examples):
const languages = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'fr-FR', name: 'French (France)' },
  { code: 'de-DE', name: 'German (Germany)' },
  { code: 'it-IT', name: 'Italian (Italy)' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'ja-JP', name: 'Japanese (Japan)' },
  { code: 'ko-KR', name: 'Korean (Korea)' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)' },
  { code: 'hi-IN', name: 'Hindi (India)' },
];
```

### 1.2 Enable On-Device Processing (Better Privacy & Speed)

```typescript
const recognition = new SpeechRecognition();
recognition.options = {
  langs: ['en-US'],
  processLocally: true  // Process on device (faster, more private)
};
recognition.start();
```

### 1.3 Contextual Biasing (Improve Accuracy)

**Use Case:** Improve recognition of domain-specific terms

```typescript
const recognition = new SpeechRecognition();
recognition.processLocally = true;

// Define domain-specific phrases with boost values
const domainPhrases = [
  // Technical terms
  new SpeechRecognitionPhrase('photosynthesis', 3.0),
  new SpeechRecognitionPhrase('mitochondria', 3.0),
  new SpeechRecognitionPhrase('quantum mechanics', 2.5),
  
  // Commands
  new SpeechRecognitionPhrase('search my notes', 2.0),
  new SpeechRecognitionPhrase('summarize document', 2.0),
  new SpeechRecognitionPhrase('create quiz', 2.0),
  
  // Common terms in your domain
  new SpeechRecognitionPhrase('SurfSense', 3.0),
  new SpeechRecognitionPhrase('knowledge base', 2.0),
];

recognition.phrases = domainPhrases;

// Handle unsupported browsers
recognition.onerror = (event) => {
  if (event.error === 'phrases-not-supported') {
    console.warn('Contextual biasing not supported, continuing without hints');
    recognition.phrases = [];
  }
};
```

### 1.4 Quality Settings

```typescript
const recognition = new SpeechRecognition();
recognition.lang = 'en-US';
recognition.continuous = true;        // Keep listening
recognition.interimResults = true;    // Show partial results
recognition.maxAlternatives = 3;      // Get top 3 alternatives
```

---

## 🔊 Part 2: Improve Text-to-Speech (TTS)

### 2.1 Voice Selection

**Get Available Voices:**
```typescript
function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    let voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
    } else {
      speechSynthesis.onvoiceschanged = () => {
        voices = speechSynthesis.getVoices();
        resolve(voices);
      };
    }
  });
}

// Usage
getVoices().then((voices) => {
  console.log('Available voices:');
  voices.forEach((voice) => {
    console.log(`- ${voice.name} (${voice.lang}) ${voice.localService ? '[local]' : '[remote]'} ${voice.default ? '[default]' : ''}`);
  });
});
```

**Select Specific Voice:**
```typescript
const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

// Find voice by language
getVoices().then((voices) => {
  // Prefer local voices for better quality
  const englishVoice = voices.find(v => 
    v.lang === 'en-US' && v.localService
  );
  setSelectedVoice(englishVoice || voices[0]);
});

// Use selected voice
const utterance = new SpeechSynthesisUtterance(text);
utterance.voice = selectedVoice;
speechSynthesis.speak(utterance);
```

### 2.2 Quality Settings

```typescript
const utterance = new SpeechSynthesisUtterance();
utterance.text = 'Your text here';
utterance.lang = 'en-US';
utterance.rate = 1.0;    // Speed: 0.1 to 10 (1.0 = normal)
utterance.pitch = 1.0;   // Pitch: 0 to 2 (1.0 = normal)
utterance.volume = 1.0;  // Volume: 0 to 1 (1.0 = max)

// Event handlers
utterance.onstart = () => console.log('Speech started');
utterance.onend = () => console.log('Speech finished');
utterance.onerror = (event) => console.error('Speech error:', event.error);

speechSynthesis.speak(utterance);
```

### 2.3 Language-Specific Voice Selection

```typescript
function selectVoiceForLanguage(language: string): Promise<SpeechSynthesisVoice | null> {
  return getVoices().then((voices) => {
    // Try to find local voice for language
    let voice = voices.find(v => v.lang === language && v.localService);
    
    // Fallback to any voice for language
    if (!voice) {
      voice = voices.find(v => v.lang === language);
    }
    
    // Fallback to language prefix (e.g., 'en' for 'en-US')
    if (!voice) {
      const langPrefix = language.split('-')[0];
      voice = voices.find(v => v.lang.startsWith(langPrefix));
    }
    
    return voice || null;
  });
}

// Usage
selectVoiceForLanguage('es-ES').then((voice) => {
  if (voice) {
    const utterance = new SpeechSynthesisUtterance('Hola mundo');
    utterance.voice = voice;
    speechSynthesis.speak(utterance);
  }
});
```

---

## 🛠️ Part 3: Implementation in Existing Components

### 3.1 Update `use-auto-transcription.ts`

**Add language support:**
```typescript
export interface AutoTranscriptionOptions {
  onTranscript: (text: string) => void;
  threshold?: number;
  silenceDuration?: number;
  language?: string;  // NEW
  phrases?: string[];  // NEW: Domain-specific terms
}

export function useAutoTranscription({
  onTranscript,
  threshold = 30,
  silenceDuration = 1500,
  language = 'en-US',  // NEW
  phrases = [],  // NEW
}: AutoTranscriptionOptions) {
  // ... existing code ...
  
  // Configure recognition
  const recognition = new SpeechRecognition();
  recognition.lang = language;
  recognition.continuous = true;
  recognition.interimResults = true;
  
  // Add contextual biasing if supported
  if (phrases.length > 0) {
    try {
      recognition.phrases = phrases.map(phrase => 
        new SpeechRecognitionPhrase(phrase, 2.0)
      );
    } catch (e) {
      console.warn('Contextual biasing not supported');
    }
  }
  
  // ... rest of code ...
}
```

### 3.2 Update `use-text-to-speech.ts`

**Add voice and quality settings:**
```typescript
export interface TTSOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceName?: string;  // NEW: Specific voice name
}

export function useTextToSpeech({
  language = 'en-US',
  rate = 1.0,
  pitch = 1.0,
  volume = 1.0,
  voiceName,
}: TTSOptions = {}) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  
  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Select voice
      let voice = null;
      if (voiceName) {
        voice = availableVoices.find(v => v.name === voiceName);
      }
      if (!voice) {
        voice = availableVoices.find(v => v.lang === language && v.localService);
      }
      if (!voice) {
        voice = availableVoices.find(v => v.lang === language);
      }
      setSelectedVoice(voice || availableVoices[0]);
    };
    
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }, [language, voiceName]);
  
  const speak = useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    speechSynthesis.speak(utterance);
  }, [language, rate, pitch, volume, selectedVoice]);
  
  return {
    speak,
    voices,
    selectedVoice,
    setSelectedVoice,
  };
}
```

### 3.3 Add Settings UI Component

**Create `VoiceSettings.tsx`:**
```typescript
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

export function VoiceSettings() {
  const [language, setLanguage] = useState('en-US');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  
  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
    };
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }, []);
  
  // Filter voices by language
  const filteredVoices = voices.filter(v => v.lang === language);
  
  return (
    <div className="space-y-4 p-4">
      <div>
        <Label>Language</Label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en-US">English (US)</SelectItem>
            <SelectItem value="en-GB">English (UK)</SelectItem>
            <SelectItem value="es-ES">Spanish</SelectItem>
            <SelectItem value="fr-FR">French</SelectItem>
            <SelectItem value="de-DE">German</SelectItem>
            <SelectItem value="it-IT">Italian</SelectItem>
            <SelectItem value="pt-BR">Portuguese</SelectItem>
            <SelectItem value="ja-JP">Japanese</SelectItem>
            <SelectItem value="zh-CN">Chinese</SelectItem>
            <SelectItem value="ar-SA">Arabic</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Voice</Label>
        <Select value={selectedVoice} onValueChange={setSelectedVoice}>
          <SelectTrigger>
            <SelectValue placeholder="Select voice" />
          </SelectTrigger>
          <SelectContent>
            {filteredVoices.map((voice) => (
              <SelectItem key={voice.name} value={voice.name}>
                {voice.name} {voice.localService ? '(Local)' : '(Remote)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Speed: {rate.toFixed(1)}x</Label>
        <Slider
          value={[rate]}
          onValueChange={([v]) => setRate(v)}
          min={0.5}
          max={2.0}
          step={0.1}
        />
      </div>
      
      <div>
        <Label>Pitch: {pitch.toFixed(1)}</Label>
        <Slider
          value={[pitch]}
          onValueChange={([v]) => setPitch(v)}
          min={0.5}
          max={2.0}
          step={0.1}
        />
      </div>
      
      <div>
        <Label>Volume: {Math.round(volume * 100)}%</Label>
        <Slider
          value={[volume]}
          onValueChange={([v]) => setVolume(v)}
          min={0}
          max={1}
          step={0.1}
        />
      </div>
      
      <Button onClick={() => {
        const utterance = new SpeechSynthesisUtterance('This is a test');
        utterance.lang = language;
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) utterance.voice = voice;
        speechSynthesis.speak(utterance);
      }}>
        Test Voice
      </Button>
    </div>
  );
}
```

---

## 📋 Supported Languages

### Common Languages (BCP-47 codes)

| Language | Code | Example Voice |
|----------|------|---------------|
| English (US) | en-US | Google US English |
| English (UK) | en-GB | Google UK English |
| Spanish (Spain) | es-ES | Google español |
| Spanish (Mexico) | es-MX | Google español de Estados Unidos |
| French (France) | fr-FR | Google français |
| German (Germany) | de-DE | Google Deutsch |
| Italian (Italy) | it-IT | Google italiano |
| Portuguese (Brazil) | pt-BR | Google português do Brasil |
| Japanese (Japan) | ja-JP | Google 日本語 |
| Korean (Korea) | ko-KR | Google 한국의 |
| Chinese (Simplified) | zh-CN | Google 普通话（中国大陆）|
| Chinese (Traditional) | zh-TW | Google 國語（臺灣）|
| Arabic (Saudi Arabia) | ar-SA | Google العربية |
| Hindi (India) | hi-IN | Google हिन्दी |
| Russian (Russia) | ru-RU | Google русский |
| Dutch (Netherlands) | nl-NL | Google Nederlands |
| Polish (Poland) | pl-PL | Google polski |
| Turkish (Turkey) | tr-TR | Google Türkçe |

---

## 🎯 Implementation Priority

### Phase 1: Basic Improvements (Quick Wins)
1. ✅ Add language selection dropdown
2. ✅ Add voice selection dropdown
3. ✅ Add speed/rate control
4. ✅ Save user preferences

### Phase 2: Quality Improvements
1. ⏳ Add contextual biasing for domain terms
2. ⏳ Enable on-device processing
3. ⏳ Add interim results display
4. ⏳ Add confidence scores

### Phase 3: Advanced Features
1. ⏳ Multi-language auto-detection
2. ⏳ Custom voice training
3. ⏳ Pronunciation dictionary
4. ⏳ Accent adaptation

---

## 📊 Quality Comparison

| Feature | Before | After |
|---------|--------|-------|
| **Languages** | 1 (en-US) | 20+ |
| **Voice Selection** | Default only | All available |
| **Speed Control** | Fixed | 0.5x - 2.0x |
| **Pitch Control** | Fixed | 0.5 - 2.0 |
| **Contextual Hints** | None | Domain-specific |
| **On-Device** | No | Optional |
| **Accuracy** | Good | Better (with hints) |

---

## 🔗 References

- [Web Speech API Specification](https://github.com/webaudio/web-speech-api)
- [MDN Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [BCP-47 Language Tags](https://www.iana.org/assignments/language-subtag-registry)
- [Context7 Web Speech API Docs](/webaudio/web-speech-api)

---

**Status:** Implementation Guide Ready  
**Next:** Implement Phase 1 improvements  
**Last Updated:** 2026-04-10
