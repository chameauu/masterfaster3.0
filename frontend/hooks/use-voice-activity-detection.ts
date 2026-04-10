"use client";

/**
 * Voice Activity Detection (VAD) Hook
 *
 * Detects when user starts/stops speaking using Web Audio API.
 *
 * Following React best practices:
 * - rerender-use-ref-transient-values: Audio context in refs
 * - rerender-functional-setstate: Stable callbacks
 * - client-event-listeners: Cleanup on unmount
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface VoiceActivityDetectionOptions {
	/** Minimum audio level to detect speech (0-255) */
	threshold?: number;
	/** Silence duration in ms before considering speech ended */
	silenceDuration?: number;
	/** Enable/disable VAD */
	enabled?: boolean;
}

export interface VoiceActivityDetectionResult {
	/** Is microphone permission granted and listening? */
	isListening: boolean;
	/** Is user currently speaking? */
	isSpeaking: boolean;
	/** Current audio level (0-255) */
	audioLevel: number;
	/** Error message if any */
	error: string | null;
	/** Start listening (request mic permission) */
	startListening: () => Promise<void>;
	/** Stop listening */
	stopListening: () => void;
}

export function useVoiceActivityDetection(
	options: VoiceActivityDetectionOptions = {}
): VoiceActivityDetectionResult {
	const {
		threshold = 30, // Adjust based on environment noise
		silenceDuration = 1500, // 1.5 seconds of silence
		enabled = true,
	} = options;

	// Use refs for transient values (rerender-use-ref-transient-values)
	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const animationFrameRef = useRef<number | null>(null);
	const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
	const isSpeakingRef = useRef(false); // Track speaking state in ref for immediate access

	// State
	const [isListening, setIsListening] = useState(false);
	const [isSpeaking, setIsSpeaking] = useState(false);
	const [audioLevel, setAudioLevel] = useState(0);
	const [error, setError] = useState<string | null>(null);

	// Analyze audio levels
	const analyzeAudio = useCallback(() => {
		if (!analyserRef.current) {
			return;
		}

		const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
		analyserRef.current.getByteFrequencyData(dataArray);

		// Calculate average audio level
		const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
		setAudioLevel(Math.round(average));

		// Detect speech
		if (average > threshold) {
			// Speech detected
			if (!isSpeakingRef.current) {
				isSpeakingRef.current = true;
				setIsSpeaking(true);
			}

			// Clear silence timer
			if (silenceTimerRef.current) {
				clearTimeout(silenceTimerRef.current);
				silenceTimerRef.current = null;
			}
		} else {
			// Silence detected
			if (isSpeakingRef.current && !silenceTimerRef.current) {
				// Start silence timer
				silenceTimerRef.current = setTimeout(() => {
					isSpeakingRef.current = false;
					setIsSpeaking(false);
					silenceTimerRef.current = null;
				}, silenceDuration);
			}
		}

		// Continue analyzing
		animationFrameRef.current = requestAnimationFrame(analyzeAudio);
	}, [threshold, silenceDuration]);

	// Start listening (functional setState for stable callback)
	const startListening = useCallback(async () => {
		try {
			// Request microphone permission
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
				},
			});

			streamRef.current = stream;

			// Create audio context
			const audioContext = new AudioContext();
			audioContextRef.current = audioContext;

			// Create analyser
			const analyser = audioContext.createAnalyser();
			analyser.fftSize = 2048;
			analyser.smoothingTimeConstant = 0.8;
			analyserRef.current = analyser;

			// Connect microphone to analyser
			const microphone = audioContext.createMediaStreamSource(stream);
			microphoneRef.current = microphone;
			microphone.connect(analyser);

			setIsListening(true);
			setError(null);

			// Start analyzing
			analyzeAudio();
		} catch (err) {
			console.error("[VAD] Failed to start listening:", err);
			setError(
				err instanceof Error ? err.message : "Failed to access microphone. Please grant permission."
			);
			setIsListening(false);
		}
	}, [analyzeAudio]);

	// Stop listening
	const stopListening = useCallback(() => {
		// Stop animation frame
		if (animationFrameRef.current) {
			cancelAnimationFrame(animationFrameRef.current);
			animationFrameRef.current = null;
		}

		// Clear silence timer
		if (silenceTimerRef.current) {
			clearTimeout(silenceTimerRef.current);
			silenceTimerRef.current = null;
		}

		// Disconnect audio nodes
		if (microphoneRef.current) {
			microphoneRef.current.disconnect();
			microphoneRef.current = null;
		}

		// Close audio context
		if (audioContextRef.current) {
			audioContextRef.current.close();
			audioContextRef.current = null;
		}

		// Stop media stream
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}

		analyserRef.current = null;
		setIsListening(false);
		setIsSpeaking(false);
		setAudioLevel(0);
	}, []);

	// Cleanup on unmount (client-event-listeners)
	useEffect(() => {
		return () => {
			stopListening();
		};
	}, [stopListening]);

	return {
		isListening,
		isSpeaking,
		audioLevel,
		error,
		startListening,
		stopListening,
	};
}
