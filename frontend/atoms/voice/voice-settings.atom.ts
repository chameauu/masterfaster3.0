"use client";

import { atom } from "jotai";

export interface VoiceSettings {
	// Audio settings
	sampleRate: number;
	channels: number;
	bitDepth: number;

	// Voice recognition settings
	language: string;
	autoStart: boolean;

	// TTS settings (future)
	ttsEnabled: boolean;
	ttsVoice: string;
	ttsSpeed: number;

	// Accessibility settings
	verboseMode: boolean; // More detailed voice responses
	confirmActions: boolean; // Confirm before executing actions
}

/**
 * Default voice settings optimized for Faster-Whisper
 */
const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
	sampleRate: 16000, // 16kHz for Faster-Whisper
	channels: 1, // Mono
	bitDepth: 16, // 16-bit
	language: "en",
	autoStart: false,
	ttsEnabled: false,
	ttsVoice: "default",
	ttsSpeed: 1.0,
	verboseMode: true, // Verbose by default for accessibility
	confirmActions: false,
};

/**
 * Voice settings atom.
 * Persisted to localStorage (future enhancement).
 */
export const voiceSettingsAtom = atom<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
