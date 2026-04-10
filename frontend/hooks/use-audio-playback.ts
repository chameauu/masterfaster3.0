"use client";

/**
 * Audio Playback Hook
 *
 * Receives audio from Pipecat backend and plays it in the browser.
 *
 * Following React best practices:
 * - rerender-use-ref-transient-values: Audio context in refs
 * - rerender-functional-setstate: Stable callbacks
 * - client-event-listeners: Cleanup on unmount
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface AudioPlaybackOptions {
	/** Sample rate in Hz (default: 16000 to match backend) */
	sampleRate?: number;
	/** Number of audio channels (default: 1 for mono) */
	channelCount?: number;
	/** Initial volume (0.0 to 1.0) */
	volume?: number;
}

export interface AudioPlaybackResult {
	/** Is currently playing audio? */
	isPlaying: boolean;
	/** Current volume (0.0 to 1.0) */
	volume: number;
	/** Number of audio chunks in queue */
	queueSize: number;
	/** Error message if any */
	error: string | null;
	/** Queue audio data for playback */
	queueAudio: (data: Float32Array) => void;
	/** Start playback from queue */
	startPlayback: () => Promise<void>;
	/** Set volume (0.0 to 1.0) */
	setVolume: (volume: number) => void;
	/** Stop playback and clear queue */
	stop: () => void;
}

export function useAudioPlayback(options: AudioPlaybackOptions = {}): AudioPlaybackResult {
	const { sampleRate = 16000, channelCount = 1, volume: initialVolume = 1.0 } = options;

	// Use refs for transient values (rerender-use-ref-transient-values)
	const audioContextRef = useRef<AudioContext | null>(null);
	const gainNodeRef = useRef<GainNode | null>(null);
	const audioQueueRef = useRef<Float32Array[]>([]);

	// State
	const [isPlaying, setIsPlaying] = useState(false);
	const [volume, setVolumeState] = useState(initialVolume);
	const [queueSize, setQueueSize] = useState(0);
	const [error, setError] = useState<string | null>(null);

	// Queue audio data (functional setState for stable callback)
	const queueAudio = useCallback((data: Float32Array) => {
		audioQueueRef.current.push(data);
		setQueueSize(audioQueueRef.current.length);
	}, []);

	// Start playback
	const startPlayback = useCallback(async () => {
		try {
			// Create audio context if not exists
			if (!audioContextRef.current) {
				audioContextRef.current = new AudioContext({ sampleRate });
			}

			// Create gain node for volume control if not exists
			if (!gainNodeRef.current) {
				gainNodeRef.current = audioContextRef.current.createGain();
				gainNodeRef.current.gain.value = volume;
				gainNodeRef.current.connect(audioContextRef.current.destination);
			}

			setIsPlaying(true);

			// Process audio queue
			while (audioQueueRef.current.length > 0) {
				const audioData = audioQueueRef.current.shift();
				if (!audioData) continue;

				// Create audio buffer
				const audioBuffer = audioContextRef.current.createBuffer(
					channelCount,
					audioData.length,
					sampleRate
				);

				// Copy audio data to buffer
				const channelData = audioBuffer.getChannelData(0);
				channelData.set(audioData);

				// Create buffer source
				const source = audioContextRef.current.createBufferSource();
				source.buffer = audioBuffer;
				source.connect(gainNodeRef.current);

				// Play audio
				source.start();

				// Update queue size
				setQueueSize(audioQueueRef.current.length);
			}
		} catch (err) {
			console.error("[AudioPlayback] Failed to play audio:", err);
			setError(err instanceof Error ? err.message : "Failed to play audio");
			setIsPlaying(false);
		}
	}, [sampleRate, channelCount, volume]);

	// Set volume
	const setVolume = useCallback((newVolume: number) => {
		const clampedVolume = Math.max(0, Math.min(1, newVolume));
		setVolumeState(clampedVolume);

		if (gainNodeRef.current) {
			gainNodeRef.current.gain.value = clampedVolume;
		}
	}, []);

	// Stop playback
	const stop = useCallback(() => {
		audioQueueRef.current = [];
		setQueueSize(0);
		setIsPlaying(false);
	}, []);

	// Cleanup on unmount (client-event-listeners)
	useEffect(() => {
		return () => {
			stop();
			if (audioContextRef.current) {
				audioContextRef.current.close();
			}
		};
	}, [stop]);

	return {
		isPlaying,
		volume,
		queueSize,
		error,
		queueAudio,
		startPlayback,
		setVolume,
		stop,
	};
}
