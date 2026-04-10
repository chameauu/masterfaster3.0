"use client";

/**
 * Text-to-Speech Hook
 *
 * Uses Web Speech API to read text aloud.
 * Critical for visually impaired users who can't read the screen.
 *
 * Following React best practices:
 * - rerender-use-ref-transient-values: SpeechSynthesis in ref
 * - rerender-functional-setstate: Stable callbacks
 * - rerender-memo: Memoized for performance
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface TextToSpeechOptions {
	/** Voice to use (default: first available) */
	voice?: SpeechSynthesisVoice;
	/** Speech rate (0.1 to 10, default: 1) */
	rate?: number;
	/** Speech pitch (0 to 2, default: 1) */
	pitch?: number;
	/** Speech volume (0 to 1, default: 1) */
	volume?: number;
	/** Called when speech starts */
	onStart?: () => void;
	/** Called when speech ends */
	onEnd?: () => void;
	/** Called on error */
	onError?: (error: Error) => void;
}

export interface TextToSpeechResult {
	/** Is TTS supported in this browser? */
	isSupported: boolean;
	/** Is currently speaking? */
	isSpeaking: boolean;
	/** Is currently paused? */
	isPaused: boolean;
	/** Available voices */
	voices: SpeechSynthesisVoice[];
	/** Speak text */
	speak: (text: string) => void;
	/** Pause speech */
	pause: () => void;
	/** Resume speech */
	resume: () => void;
	/** Stop speech */
	stop: () => void;
	/** Error message if any */
	error: string | null;
}

export function useTextToSpeech(options: TextToSpeechOptions = {}): TextToSpeechResult {
	const { voice, rate = 1, pitch = 1, volume = 1, onStart, onEnd, onError } = options;

	// Check if Web Speech API is supported
	const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

	// State
	const [isSpeaking, setIsSpeaking] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
	const [error, setError] = useState<string | null>(null);

	// Refs for transient values (rerender-use-ref-transient-values)
	const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

	// Load available voices
	useEffect(() => {
		if (!isSupported) return;

		const loadVoices = () => {
			const availableVoices = window.speechSynthesis.getVoices();
			setVoices(availableVoices);
		};

		// Load voices immediately
		loadVoices();

		// Some browsers load voices asynchronously
		if (window.speechSynthesis.onvoiceschanged !== undefined) {
			window.speechSynthesis.onvoiceschanged = loadVoices;
		}

		return () => {
			if (window.speechSynthesis.onvoiceschanged !== undefined) {
				window.speechSynthesis.onvoiceschanged = null;
			}
		};
	}, [isSupported]);

	// Speak text (functional setState)
	const speak = useCallback(
		(text: string) => {
			if (!isSupported) {
				const err = new Error("Text-to-speech is not supported in this browser");
				setError(err.message);
				if (onError) onError(err);
				return;
			}

			try {
				// Stop any ongoing speech
				window.speechSynthesis.cancel();

				// Create utterance
				const utterance = new SpeechSynthesisUtterance(text);
				utterance.voice = voice || voices[0] || null;
				utterance.rate = rate;
				utterance.pitch = pitch;
				utterance.volume = volume;

				// Event handlers
				utterance.onstart = () => {
					setIsSpeaking(true);
					setIsPaused(false);
					setError(null);
					if (onStart) onStart();
				};

				utterance.onend = () => {
					setIsSpeaking(false);
					setIsPaused(false);
					if (onEnd) onEnd();
				};

				utterance.onerror = (event) => {
					const err = new Error(`Speech synthesis error: ${event.error}`);
					setError(err.message);
					setIsSpeaking(false);
					setIsPaused(false);
					if (onError) onError(err);
				};

				utterance.onpause = () => {
					setIsPaused(true);
				};

				utterance.onresume = () => {
					setIsPaused(false);
				};

				// Store reference
				utteranceRef.current = utterance;

				// Speak
				window.speechSynthesis.speak(utterance);
			} catch (err) {
				const error = err instanceof Error ? err : new Error("Failed to speak");
				setError(error.message);
				if (onError) onError(error);
			}
		},
		[isSupported, voice, voices, rate, pitch, volume, onStart, onEnd, onError]
	);

	// Pause speech
	const pause = useCallback(() => {
		if (!isSupported) return;
		window.speechSynthesis.pause();
	}, [isSupported]);

	// Resume speech
	const resume = useCallback(() => {
		if (!isSupported) return;
		window.speechSynthesis.resume();
	}, [isSupported]);

	// Stop speech
	const stop = useCallback(() => {
		if (!isSupported) return;
		window.speechSynthesis.cancel();
		setIsSpeaking(false);
		setIsPaused(false);
	}, [isSupported]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (isSupported) {
				window.speechSynthesis.cancel();
			}
		};
	}, [isSupported]);

	return {
		isSupported,
		isSpeaking,
		isPaused,
		voices,
		speak,
		pause,
		resume,
		stop,
		error,
	};
}
