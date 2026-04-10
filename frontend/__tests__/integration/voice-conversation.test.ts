/**
 * Voice Conversation Integration Tests
 *
 * Tests the complete voice conversation flow:
 * - WebRTC connection
 * - Audio capture
 * - Audio transmission
 * - Audio reception
 * - Audio playback
 *
 * These tests require a running backend server.
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAudioCapture } from "@/hooks/use-audio-capture";
import { useAudioPlayback } from "@/hooks/use-audio-playback";
import { useWebRTCClient } from "@/hooks/use-webrtc-client";

describe("Voice Conversation Integration", () => {
	// Mock WebSocket and Audio APIs
	let mockWebSocket: any;
	let mockAudioContext: any;
	let mockMediaStream: any;

	beforeEach(() => {
		// Mock WebSocket
		mockWebSocket = {
			readyState: WebSocket.CONNECTING,
			close: vi.fn(),
			send: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		};

		global.WebSocket = vi.fn(() => mockWebSocket) as any;
		global.WebSocket.CONNECTING = 0;
		global.WebSocket.OPEN = 1;
		global.WebSocket.CLOSING = 2;
		global.WebSocket.CLOSED = 3;

		// Mock AudioContext
		mockAudioContext = {
			createGain: vi.fn(() => ({
				connect: vi.fn(),
				disconnect: vi.fn(),
				gain: { value: 1.0 },
			})),
			createBufferSource: vi.fn(() => ({
				connect: vi.fn(),
				start: vi.fn(),
				stop: vi.fn(),
				buffer: null,
			})),
			createBuffer: vi.fn((channels, length, sampleRate) => ({
				numberOfChannels: channels,
				length,
				sampleRate,
				getChannelData: vi.fn(() => new Float32Array(length)),
			})),
			createMediaStreamSource: vi.fn(() => ({
				connect: vi.fn(),
				disconnect: vi.fn(),
			})),
			createAnalyser: vi.fn(() => ({
				connect: vi.fn(),
				disconnect: vi.fn(),
				fftSize: 2048,
				frequencyBinCount: 1024,
				getByteFrequencyData: vi.fn(),
			})),
			createScriptProcessor: vi.fn(() => ({
				connect: vi.fn(),
				disconnect: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
			})),
			close: vi.fn(),
			sampleRate: 16000,
			state: "running",
			destination: {},
		};

		global.AudioContext = vi.fn(() => mockAudioContext) as any;

		// Mock MediaStream
		const mockTrack = {
			stop: vi.fn(),
			kind: "audio",
		};

		mockMediaStream = {
			getTracks: vi.fn(() => [mockTrack]),
			getAudioTracks: vi.fn(() => [mockTrack]),
		};

		if (!navigator.mediaDevices) {
			(navigator as any).mediaDevices = {};
		}
		navigator.mediaDevices.getUserMedia = vi.fn(async () => mockMediaStream);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	// Integration Test 1: Complete conversation cycle
	it("completes full conversation cycle", async () => {
		// Arrange - Set up all three hooks
		const { result: webrtcResult } = renderHook(() =>
			useWebRTCClient({
				url: "ws://localhost:8000/api/v1/pipecat/ws",
			})
		);

		const { result: captureResult } = renderHook(() =>
			useAudioCapture({
				sampleRate: 16000,
				channelCount: 1,
			})
		);

		const { result: playbackResult } = renderHook(() =>
			useAudioPlayback({
				sampleRate: 16000,
				channelCount: 1,
			})
		);

		// Act - Connect WebRTC
		act(() => {
			webrtcResult.current.connect();
		});

		// Simulate connection success
		act(() => {
			mockWebSocket.readyState = WebSocket.OPEN;
			const handler = mockWebSocket.addEventListener.mock.calls.find(
				(call: any) => call[0] === "open"
			)?.[1];
			if (handler) handler({});
		});

		// Assert - WebRTC connected
		expect(webrtcResult.current.status).toBe("connected");

		// Act - Start audio capture
		await act(async () => {
			await captureResult.current.startCapture();
		});

		// Assert - Audio capturing
		expect(captureResult.current.isCapturing).toBe(true);

		// Act - Simulate audio data capture
		const mockAudioData = new Float32Array(4096);
		mockAudioData.fill(0.5);

		act(() => {
			const processor = mockAudioContext.createScriptProcessor.mock.results[0]?.value;
			const handler = processor?.addEventListener.mock.calls.find(
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

		// Assert - Audio sent via WebSocket
		expect(mockWebSocket.send).toHaveBeenCalled();

		// Act - Simulate receiving audio from backend
		const responseAudio = new ArrayBuffer(8192);
		act(() => {
			const handler = mockWebSocket.addEventListener.mock.calls.find(
				(call: any) => call[0] === "message"
			)?.[1];

			if (handler) {
				handler({ data: responseAudio });
			}
		});

		// Act - Queue and play received audio
		const float32Response = new Float32Array(responseAudio);
		act(() => {
			playbackResult.current.queueAudio(float32Response);
		});

		expect(playbackResult.current.queueSize).toBe(1);

		await act(async () => {
			await playbackResult.current.startPlayback();
		});

		// Assert - Audio playing
		expect(playbackResult.current.isPlaying).toBe(true);
		expect(mockAudioContext.createBufferSource).toHaveBeenCalled();

		// Cleanup
		act(() => {
			captureResult.current.stopCapture();
			webrtcResult.current.disconnect();
			playbackResult.current.stop();
		});
	});

	// Integration Test 2: Multiple conversation turns
	it("handles multiple conversation turns", async () => {
		const { result: webrtcResult } = renderHook(() => useWebRTCClient());
		const { result: captureResult } = renderHook(() => useAudioCapture());
		const { result: playbackResult } = renderHook(() => useAudioPlayback());

		// Connect
		act(() => {
			webrtcResult.current.connect();
			mockWebSocket.readyState = WebSocket.OPEN;
			const handler = mockWebSocket.addEventListener.mock.calls.find(
				(call: any) => call[0] === "open"
			)?.[1];
			if (handler) handler({});
		});

		await act(async () => {
			await captureResult.current.startCapture();
		});

		// Turn 1
		const audio1 = new Float32Array(4096);
		audio1.fill(0.3);

		act(() => {
			const processor = mockAudioContext.createScriptProcessor.mock.results[0]?.value;
			const handler = processor?.addEventListener.mock.calls.find(
				(call: any) => call[0] === "audioprocess"
			)?.[1];
			if (handler) {
				handler({ inputBuffer: { getChannelData: vi.fn(() => audio1) } });
			}
		});

		expect(mockWebSocket.send).toHaveBeenCalledTimes(1);

		// Turn 2
		const audio2 = new Float32Array(4096);
		audio2.fill(0.6);

		act(() => {
			const processor = mockAudioContext.createScriptProcessor.mock.results[0]?.value;
			const handler = processor?.addEventListener.mock.calls.find(
				(call: any) => call[0] === "audioprocess"
			)?.[1];
			if (handler) {
				handler({ inputBuffer: { getChannelData: vi.fn(() => audio2) } });
			}
		});

		expect(mockWebSocket.send).toHaveBeenCalledTimes(2);

		// Turn 3
		const audio3 = new Float32Array(4096);
		audio3.fill(0.9);

		act(() => {
			const processor = mockAudioContext.createScriptProcessor.mock.results[0]?.value;
			const handler = processor?.addEventListener.mock.calls.find(
				(call: any) => call[0] === "audioprocess"
			)?.[1];
			if (handler) {
				handler({ inputBuffer: { getChannelData: vi.fn(() => audio3) } });
			}
		});

		expect(mockWebSocket.send).toHaveBeenCalledTimes(3);

		// Cleanup
		act(() => {
			captureResult.current.stopCapture();
			webrtcResult.current.disconnect();
		});
	});

	// Integration Test 3: Volume adjustment during playback
	it("adjusts volume during playback", async () => {
		const { result: playbackResult } = renderHook(() =>
			useAudioPlayback({
				volume: 0.5,
			})
		);

		// Queue audio
		const audioData = new Float32Array(4096);
		act(() => {
			playbackResult.current.queueAudio(audioData);
		});

		// Start playback
		await act(async () => {
			await playbackResult.current.startPlayback();
		});

		expect(playbackResult.current.isPlaying).toBe(true);
		expect(playbackResult.current.volume).toBe(0.5);

		// Adjust volume
		act(() => {
			playbackResult.current.setVolume(0.8);
		});

		expect(playbackResult.current.volume).toBe(0.8);

		// Adjust to max
		act(() => {
			playbackResult.current.setVolume(1.0);
		});

		expect(playbackResult.current.volume).toBe(1.0);

		// Adjust to min
		act(() => {
			playbackResult.current.setVolume(0.0);
		});

		expect(playbackResult.current.volume).toBe(0.0);

		// Cleanup
		act(() => {
			playbackResult.current.stop();
		});
	});

	// Integration Test 4: Connection status updates
	it("updates connection status correctly", async () => {
		const { result } = renderHook(() => useWebRTCClient());

		// Initial state
		expect(result.current.status).toBe("disconnected");

		// Connecting
		act(() => {
			result.current.connect();
		});

		expect(result.current.status).toBe("connecting");

		// Connected
		act(() => {
			mockWebSocket.readyState = WebSocket.OPEN;
			const handler = mockWebSocket.addEventListener.mock.calls.find(
				(call: any) => call[0] === "open"
			)?.[1];
			if (handler) handler({});
		});

		expect(result.current.status).toBe("connected");

		// Disconnected
		act(() => {
			result.current.disconnect();
		});

		expect(result.current.status).toBe("disconnected");
	});

	// Integration Test 5: Audio level visualization
	it("tracks audio levels during capture", async () => {
		const { result } = renderHook(() => useAudioCapture());

		await act(async () => {
			await result.current.startCapture();
		});

		// Initial level
		expect(result.current.audioLevel).toBe(0);

		// Simulate audio with level
		const analyser = mockAudioContext.createAnalyser.mock.results[0]?.value;
		if (analyser) {
			analyser.getByteFrequencyData = vi.fn((array) => {
				for (let i = 0; i < array.length; i++) {
					array[i] = 100; // Average level of 100
				}
			});
		}

		// Wait for audio analysis
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 100));
		});

		// Level should be updated
		expect(result.current.audioLevel).toBeGreaterThan(0);

		// Cleanup
		act(() => {
			result.current.stopCapture();
		});
	});

	// Integration Test 6: End-to-end latency measurement
	it("measures end-to-end latency", async () => {
		const { result: webrtcResult } = renderHook(() => useWebRTCClient());
		const { result: captureResult } = renderHook(() => useAudioCapture());
		const { result: playbackResult } = renderHook(() => useAudioPlayback());

		const startTime = Date.now();

		// Connect
		act(() => {
			webrtcResult.current.connect();
			mockWebSocket.readyState = WebSocket.OPEN;
			const handler = mockWebSocket.addEventListener.mock.calls.find(
				(call: any) => call[0] === "open"
			)?.[1];
			if (handler) handler({});
		});

		// Capture audio
		await act(async () => {
			await captureResult.current.startCapture();
		});

		// Send audio
		const audioData = new Float32Array(4096);
		act(() => {
			const processor = mockAudioContext.createScriptProcessor.mock.results[0]?.value;
			const handler = processor?.addEventListener.mock.calls.find(
				(call: any) => call[0] === "audioprocess"
			)?.[1];
			if (handler) {
				handler({ inputBuffer: { getChannelData: vi.fn(() => audioData) } });
			}
		});

		// Receive response
		const responseAudio = new ArrayBuffer(8192);
		act(() => {
			const handler = mockWebSocket.addEventListener.mock.calls.find(
				(call: any) => call[0] === "message"
			)?.[1];
			if (handler) {
				handler({ data: responseAudio });
			}
		});

		// Play response
		const float32Response = new Float32Array(responseAudio);
		act(() => {
			playbackResult.current.queueAudio(float32Response);
		});

		await act(async () => {
			await playbackResult.current.startPlayback();
		});

		const endTime = Date.now();
		const latency = endTime - startTime;

		// Assert latency is reasonable (in test environment)
		// Note: Real latency will be measured with actual backend
		expect(latency).toBeLessThan(1000); // 1 second in test

		// Cleanup
		act(() => {
			captureResult.current.stopCapture();
			webrtcResult.current.disconnect();
			playbackResult.current.stop();
		});
	});
});
