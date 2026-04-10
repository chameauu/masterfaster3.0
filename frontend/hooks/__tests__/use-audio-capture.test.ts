/**
 * Tests for useAudioCapture hook
 *
 * Following TDD principles:
 * - RED: Write failing test
 * - GREEN: Minimal implementation
 * - REFACTOR: Improve code quality
 *
 * Day 13-14: Audio Capture
 * Goal: Capture microphone audio and send to WebRTC client
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAudioCapture } from "../use-audio-capture";

describe("useAudioCapture", () => {
	// Mock MediaStream and related APIs
	let mockMediaStream: any;
	let mockAudioContext: any;
	let mockAnalyser: any;
	let mockScriptProcessor: any;
	let mockMediaStreamSource: any;
	let originalGetUserMedia: any;
	let originalAudioContext: any;

	beforeEach(() => {
		// Save originals
		originalGetUserMedia = navigator.mediaDevices?.getUserMedia;
		originalAudioContext = global.AudioContext;

		// Create mock MediaStream with fresh mocks for each test
		const mockTrack = {
			stop: vi.fn(),
			kind: "audio",
		};

		mockMediaStream = {
			getTracks: vi.fn(() => [mockTrack]),
			getAudioTracks: vi.fn(() => [mockTrack]),
		};

		// Create mock AudioContext
		mockScriptProcessor = {
			connect: vi.fn(),
			disconnect: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		};

		mockMediaStreamSource = {
			connect: vi.fn(),
			disconnect: vi.fn(),
		};

		mockAnalyser = {
			connect: vi.fn(),
			disconnect: vi.fn(),
			fftSize: 2048,
			frequencyBinCount: 1024,
			getByteFrequencyData: vi.fn(),
		};

		mockAudioContext = {
			createMediaStreamSource: vi.fn(() => mockMediaStreamSource),
			createAnalyser: vi.fn(() => mockAnalyser),
			createScriptProcessor: vi.fn(() => mockScriptProcessor),
			close: vi.fn(),
			sampleRate: 16000,
			state: "running",
		};

		// Mock getUserMedia
		if (!navigator.mediaDevices) {
			(navigator as any).mediaDevices = {};
		}
		navigator.mediaDevices.getUserMedia = vi.fn(async () => mockMediaStream);

		// Mock AudioContext
		global.AudioContext = vi.fn(() => mockAudioContext) as any;
	});

	afterEach(() => {
		// Restore originals
		if (originalGetUserMedia) {
			navigator.mediaDevices.getUserMedia = originalGetUserMedia;
		}
		if (originalAudioContext) {
			global.AudioContext = originalAudioContext;
		}
		vi.clearAllMocks();
	});

	// TRACER BULLET: Test 1 - Request microphone permission and capture stream
	it("requests microphone permission and captures audio stream", async () => {
		// Arrange
		const { result } = renderHook(() => useAudioCapture());

		// Initially not capturing
		expect(result.current.isCapturing).toBe(false);
		expect(result.current.error).toBeNull();

		// Act - Start capturing
		await act(async () => {
			await result.current.startCapture();
		});

		// Assert
		expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
			audio: {
				echoCancellation: true,
				noiseSuppression: true,
				autoGainControl: true,
				sampleRate: 16000,
				channelCount: 1,
			},
		});
		expect(result.current.isCapturing).toBe(true);
		expect(result.current.error).toBeNull();
	});

	// Test 2: Receive audio data via callback
	it("receives audio data via callback", async () => {
		const { result } = renderHook(() => useAudioCapture());
		const audioCallback = vi.fn();

		// Register callback
		act(() => {
			result.current.onAudioData(audioCallback);
		});

		// Start capturing
		await act(async () => {
			await result.current.startCapture();
		});

		// Simulate audio processing event
		const mockAudioData = new Float32Array(4096);
		for (let i = 0; i < mockAudioData.length; i++) {
			mockAudioData[i] = Math.sin(i * 0.01); // Sine wave
		}

		act(() => {
			// Trigger audioprocess event
			const handler = mockScriptProcessor.addEventListener.mock.calls.find(
				(call: any) => call[0] === "audioprocess"
			)?.[1];

			if (handler) {
				handler({
					inputBuffer: {
						getChannelData: vi.fn(() => mockAudioData),
					},
				});
			}
		});

		// Assert callback was called with audio data
		expect(audioCallback).toHaveBeenCalledWith(mockAudioData);
	});

	// Test 3: Handle permission denied error
	it("handles permission denied gracefully", async () => {
		// Mock getUserMedia to reject
		const permissionError = new Error("Permission denied");
		permissionError.name = "NotAllowedError";
		navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(permissionError);

		const { result } = renderHook(() => useAudioCapture());

		// Try to start capturing
		await act(async () => {
			await result.current.startCapture();
		});

		// Assert error state
		expect(result.current.isCapturing).toBe(false);
		expect(result.current.error).toBeTruthy();
		expect(result.current.error).toContain("Permission denied");
	});

	// Test 4: Stop capturing and cleanup resources
	it("stops capturing and cleans up resources", async () => {
		const { result } = renderHook(() => useAudioCapture());

		// Start capturing
		await act(async () => {
			await result.current.startCapture();
		});

		expect(result.current.isCapturing).toBe(true);

		// Stop capturing
		act(() => {
			result.current.stopCapture();
		});

		// Assert cleanup
		expect(result.current.isCapturing).toBe(false);
		expect(result.current.audioLevel).toBe(0);
		expect(mockMediaStream.getTracks()[0].stop).toHaveBeenCalled();
		expect(mockAudioContext.close).toHaveBeenCalled();
	});

	// Test 5: Track audio levels for visualization
	it("tracks audio levels for visualization", async () => {
		const { result } = renderHook(() => useAudioCapture());

		// Mock analyser data
		const mockFrequencyData = new Uint8Array(1024);
		mockFrequencyData.fill(100); // Average level of 100
		mockAnalyser.getByteFrequencyData = vi.fn((array) => {
			for (let i = 0; i < array.length; i++) {
				array[i] = mockFrequencyData[i];
			}
		});

		// Start capturing
		await act(async () => {
			await result.current.startCapture();
		});

		// Wait for audio analysis to run
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 100));
		});

		// Assert audio level is tracked
		expect(result.current.audioLevel).toBeGreaterThan(0);
	});

	// Test 6: Integration test - send audio to WebRTC client
	it("integrates with WebRTC client to send audio data", async () => {
		const { result } = renderHook(() => useAudioCapture());
		const sentAudioChunks: Float32Array[] = [];

		// Register callback to collect audio data
		act(() => {
			result.current.onAudioData((data) => {
				sentAudioChunks.push(new Float32Array(data));
			});
		});

		// Start capturing
		await act(async () => {
			await result.current.startCapture();
		});

		// Simulate multiple audio processing events
		const mockAudioData1 = new Float32Array(4096);
		mockAudioData1.fill(0.5);

		const mockAudioData2 = new Float32Array(4096);
		mockAudioData2.fill(0.7);

		act(() => {
			// Trigger first audioprocess event
			const handler = mockScriptProcessor.addEventListener.mock.calls.find(
				(call: any) => call[0] === "audioprocess"
			)?.[1];

			if (handler) {
				handler({
					inputBuffer: {
						getChannelData: vi.fn(() => mockAudioData1),
					},
				});

				handler({
					inputBuffer: {
						getChannelData: vi.fn(() => mockAudioData2),
					},
				});
			}
		});

		// Assert audio chunks were sent
		expect(sentAudioChunks.length).toBe(2);
		expect(sentAudioChunks[0][0]).toBeCloseTo(0.5);
		expect(sentAudioChunks[1][0]).toBeCloseTo(0.7);
	});
});
