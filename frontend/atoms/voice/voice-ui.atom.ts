"use client";

import { atom } from "jotai";

export interface VoiceUIState {
	// Microphone permission
	microphonePermission: "prompt" | "granted" | "denied";

	// Recording state
	recordingDuration: number; // in seconds
	audioLevel: number; // 0-100 for visual feedback

	// Results display
	showTranscript: boolean;
	showResults: boolean;

	// Error handling
	lastError: string | null;
}

/**
 * Default UI state
 */
const DEFAULT_UI_STATE: VoiceUIState = {
	microphonePermission: "prompt",
	recordingDuration: 0,
	audioLevel: 0,
	showTranscript: true,
	showResults: true,
	lastError: null,
};

/**
 * Voice UI state atom.
 * Manages UI-specific state (permissions, visual feedback, etc.)
 */
export const voiceUIAtom = atom<VoiceUIState>(DEFAULT_UI_STATE);

/**
 * Derived atom: Can record?
 */
export const canRecordAtom = atom((get) => get(voiceUIAtom).microphonePermission === "granted");

/**
 * Derived atom: Has microphone error?
 */
export const hasMicrophoneErrorAtom = atom(
	(get) => get(voiceUIAtom).microphonePermission === "denied"
);
