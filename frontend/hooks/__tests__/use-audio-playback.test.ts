/**
 * Tests for useAudioPlayback hook
 *
 * Following TDD principles:
 * - RED: Write failing test
 * - GREEN: Minimal implementation
 * - REFACTOR: Improve code quality
 *
 * Day 15-16: Audio Playback
 * Goal: Receive audio from backend and play it in browser
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAudioPlayback } from "../use-audio-playback";

describe("useAudioPlayback", () => {
	// Mock Web Audio API
	let mockAudioContext: any;
	let mockGainNode: any;
	let mockAudioBufferSource: any;
	let originalAudioContext: any;

	beforeEach(() => {
		// Save original
		originalAudioContext = global.AudioContext;

		// Create mock GainNode
		mockGainNode = {
			connect: vi.fn(),
			disconnect: vi.fn(),
			gain: {
				value: 1.0,
			},
		};

		// Create mock AudioBufferSourceNode
		mockAudioBufferSource = {
			connect: vi.fn(),
			start: vi.fn(),
			stop: vi.fn(),
			buffer: null,
		};

		// Create mock AudioContext
		mockAudioContext = {
			createGain: vi.fn(() => mockGainNode),
			createBufferSource: vi.fn(() => mockAudioBufferSource),
			createBuffer: vi.fn((channels, length, sampleRate) => ({
				numberOfChannels: channels,
				length,
				sampleRate,
				getChannelData: vi.fn(() => new Float32Array(length)),
			})),
			close: vi.fn(),
			sampleRate: 16000,
			state: "running",
			destination: {},
		};

		// Mock AudioContext constructor
		global.AudioContext = vi.fn(() => mockAudioContext) as any;
	});

	afterEach(() => {
		// Restore original
		if (originalAudioContext) {
			global.AudioContext = originalAudioContext;
		}
		vi.clearAllMocks();
	});

	// TRACER BULLET: Test 1 - Queue audio data for playback
	it("queues audio data for playback", () => {
		// Arrange
		const { result } = renderHook(() => useAudioPlayback());

		// Initially not playing
		expect(result.current.isPlaying).toBe(false);
		expect(result.current.queueSize).toBe(0);

		// Act - Queue audio data
		const audioData = new Float32Array(4096);
		audioData.fill(0.5);

		act(() => {
			result.current.queueAudio(audioData);
		});

		// Assert - Audio queued
		expect(result.current.queueSize).toBe(1);
	});

	// Test 2: Play audio from queue
	it("plays audio from queue", async () => {
		// Arrange
		const { result } = renderHook(() => useAudioPlayback());

		// Queue audio data
		const audioData = new Float32Array(4096);
		audioData.fill(0.5);

		act(() => {
			result.current.queueAudio(audioData);
		});

		expect(result.current.queueSize).toBe(1);

		// Act - Start playback
		await act(async () => {
			await result.current.startPlayback();
		});

		// Assert - Audio context created and playing
		expect(global.AudioContext).toHaveBeenCalled();
		expect(mockAudioContext.createGain).toHaveBeenCalled();
		expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
		expect(mockAudioBufferSource.start).toHaveBeenCalled();
		expect(result.current.isPlaying).toBe(true);
	});

	// Test 3: Control volume
	it("controls volume level", async () => {
		// Arrange
		const { result } = renderHook(() => useAudioPlayback({ volume: 0.5 }));

		// Initial volume
		expect(result.current.volume).toBe(0.5);

		// Queue and start playback to create gain node
		const audioData = new Float32Array(4096);
		act(() => {
			result.current.queueAudio(audioData);
		});

		await act(async () => {
			await result.current.startPlayback();
		});

		// Act - Change volume
		act(() => {
			result.current.setVolume(0.8);
		});

		// Assert
		expect(result.current.volume).toBe(0.8);
		expect(mockGainNode.gain.value).toBe(0.8);

		// Test clamping
		act(() => {
			result.current.setVolume(1.5); // Should clamp to 1.0
		});
		expect(result.current.volume).toBe(1.0);

		act(() => {
			result.current.setVolume(-0.5); // Should clamp to 0.0
		});
		expect(result.current.volume).toBe(0.0);
	});

	// Test 4: Stop playback and clear queue
	it("stops playback and clears queue", async () => {
		// Arrange
		const { result } = renderHook(() => useAudioPlayback());

		// Queue audio
		const audioData = new Float32Array(4096);
		act(() => {
			result.current.queueAudio(audioData);
			result.current.queueAudio(audioData);
		});

		expect(result.current.queueSize).toBe(2);

		// Start playback
		await act(async () => {
			await result.current.startPlayback();
		});

		expect(result.current.isPlaying).toBe(true);

		// Act - Stop
		act(() => {
			result.current.stop();
		});

		// Assert
		expect(result.current.isPlaying).toBe(false);
		expect(result.current.queueSize).toBe(0);
	});

	// Test 5: Handle playback errors
	it("handles playback errors gracefully", async () => {
		// Arrange
		const { result } = renderHook(() => useAudioPlayback());

		// Mock createBuffer to throw error
		mockAudioContext.createBuffer = vi.fn(() => {
			throw new Error("Failed to create buffer");
		});

		// Queue audio
		const audioData = new Float32Array(4096);
		act(() => {
			result.current.queueAudio(audioData);
		});

		// Act - Try to play
		await act(async () => {
			await result.current.startPlayback();
		});

		// Assert
		expect(result.current.error).toBeTruthy();
		expect(result.current.error).toContain("Failed to create buffer");
		expect(result.current.isPlaying).toBe(false);
	});

	// Test 6: Integration with WebRTC client
	it("integrates with WebRTC client to receive and play audio", async () => {
		// Arrange
		const { result } = renderHook(() => useAudioPlayback());

		// Simulate receiving audio chunks from WebRTC
		const chunk1 = new Float32Array(4096);
		chunk1.fill(0.3);

		const chunk2 = new Float32Array(4096);
		chunk2.fill(0.6);

		const chunk3 = new Float32Array(4096);
		chunk3.fill(0.9);

		// Act - Queue multiple chunks (as WebRTC would)
		act(() => {
			result.current.queueAudio(chunk1);
			result.current.queueAudio(chunk2);
			result.current.queueAudio(chunk3);
		});

		expect(result.current.queueSize).toBe(3);

		// Start playback
		await act(async () => {
			await result.current.startPlayback();
		});

		// Assert - All chunks processed
		expect(result.current.queueSize).toBe(0);
		expect(mockAudioContext.createBufferSource).toHaveBeenCalledTimes(3);
		expect(mockAudioBufferSource.start).toHaveBeenCalledTimes(3);
	});
});
