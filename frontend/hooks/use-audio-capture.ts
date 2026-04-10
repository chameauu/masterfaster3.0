"use client";

/**
 * Audio Capture Hook
 *
 * Captures audio from microphone and converts to PCM format for Pipecat backend.
 *
 * Following React best practices:
 * - rerender-use-ref-transient-values: Audio context in refs
 * - rerender-functional-setstate: Stable callbacks
 * - client-event-listeners: Cleanup on unmount
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface AudioCaptureOptions {
	/** Sample rate in Hz (default: 16000 to match backend) */
	sampleRate?: number;
	/** Number of audio channels (default: 1 for mono) */
	channelCount?: number;
	/** Enable echo cancellation */
	echoCancellation?: boolean;
	/** Enable noise suppression */
	noiseSuppression?: boolean;
	/** Enable auto gain control */
	autoGainControl?: boolean;
}

export interface AudioCaptureResult {
	/** Is currently capturing audio? */
	isCapturing: boolean;
	/** Current audio level (0-255) */
	audioLevel: number;
	/** Error message if any */
	error: string | null;
	/** Start capturing audio */
	startCapture: () => Promise<void>;
	/** Stop capturing audio */
	stopCapture: () => void;
	/** Register callback for audio data */
	onAudioData: (callback: (data: Float32Array) => void) => void;
}

export function useAudioCapture(options: AudioCaptureOptions = {}): AudioCaptureResult {
	const {
		sampleRate = 16000,
		channelCount = 1,
		echoCancellation = true,
		noiseSuppression = true,
		autoGainControl = true,
	} = options;

	// Use refs for transient values (rerender-use-ref-transient-values)
	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const processorRef = useRef<ScriptProcessorNode | null>(null);
	const audioCallbackRef = useRef<((data: Float32Array) => void) | null>(null);
	const animationFrameRef = useRef<number | null>(null);

	// State
	const [isCapturing, setIsCapturing] = useState(false);
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

		// Continue analyzing
		animationFrameRef.current = requestAnimationFrame(analyzeAudio);
	}, []);

	// Start capturing (functional setState for stable callback)
	const startCapture = useCallback(async () => {
		try {
			// Request microphone permission
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation,
					noiseSuppression,
					autoGainControl,
					sampleRate,
					channelCount,
				},
			});

			streamRef.current = stream;

			// Create audio context
			const audioContext = new AudioContext({ sampleRate });
			audioContextRef.current = audioContext;

			// Create analyser for audio level visualization
			const analyser = audioContext.createAnalyser();
			analyser.fftSize = 2048;
			analyser.smoothingTimeConstant = 0.8;
			analyserRef.current = analyser;

			// Create source from microphone
			const source = audioContext.createMediaStreamSource(stream);
			sourceRef.current = source;

			// Connect source to analyser
			source.connect(analyser);

			// Create script processor for audio data extraction
			// Note: ScriptProcessorNode is deprecated but still widely supported
			// TODO: Migrate to AudioWorklet in future
			const processor = audioContext.createScriptProcessor(4096, channelCount, channelCount);
			processorRef.current = processor;

			processor.addEventListener("audioprocess", (event) => {
				// Get audio data from input buffer
				const inputData = event.inputBuffer.getChannelData(0);

				// Call registered callback with audio data
				if (audioCallbackRef.current) {
					audioCallbackRef.current(inputData);
				}
			});

			// Connect source to processor
			source.connect(processor);
			processor.connect(audioContext.destination);

			setIsCapturing(true);
			setError(null);

			// Start analyzing audio levels
			analyzeAudio();

			console.log("[AudioCapture] Started capturing audio");
		} catch (err) {
			console.error("[AudioCapture] Failed to start capture:", err);
			setError(
				err instanceof Error ? err.message : "Failed to access microphone. Please grant permission."
			);
			setIsCapturing(false);
		}
	}, [sampleRate, channelCount, echoCancellation, noiseSuppression, autoGainControl, analyzeAudio]);

	// Stop capturing
	const stopCapture = useCallback(() => {
		// Stop animation frame
		if (animationFrameRef.current) {
			cancelAnimationFrame(animationFrameRef.current);
			animationFrameRef.current = null;
		}

		// Disconnect and cleanup audio nodes
		if (processorRef.current) {
			processorRef.current.disconnect();
			processorRef.current = null;
		}

		if (sourceRef.current) {
			sourceRef.current.disconnect();
			sourceRef.current = null;
		}

		if (analyserRef.current) {
			analyserRef.current.disconnect();
			analyserRef.current = null;
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

		setIsCapturing(false);
		setAudioLevel(0);

		console.log("[AudioCapture] Stopped capturing audio");
	}, []);

	// Register audio data callback
	const onAudioData = useCallback((callback: (data: Float32Array) => void) => {
		audioCallbackRef.current = callback;
	}, []);

	// Cleanup on unmount (client-event-listeners)
	useEffect(() => {
		return () => {
			stopCapture();
		};
	}, [stopCapture]);

	return {
		isCapturing,
		audioLevel,
		error,
		startCapture,
		stopCapture,
		onAudioData,
	};
}
