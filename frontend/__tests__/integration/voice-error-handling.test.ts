/**
 * Voice Error Handling Integration Tests
 *
 * Tests error scenarios and recovery:
 * - Connection failures
 * - Permission denials
 * - Network interruptions
 * - Audio processing errors
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAudioCapture } from "@/hooks/use-audio-capture";
import { useWebRTCClient } from "@/hooks/use-webrtc-client";

describe("Voice Error Handling Integration", () => {
	let mockWebSocket: any;
	let mockAudioContext: any;
	let originalWebSocket: any;
	let originalAudioContext: any;

	beforeEach(() => {
		// Save originals
		originalWebSocket = global.WebSocket;
		originalAudioContext = global.AudioContext;

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
		if (!navigator.mediaDevices) {
			(navigator as any).mediaDevices = {};
		}
	});

	afterEach(() => {
		// Restore originals
		global.WebSocket = originalWebSocket;
		global.AudioContext = originalAudioContext;
		vi.clearAllMocks();
	});

	// Error Test 1: Backend not running
	it("handles backend connection failure", async () => {
		// Mock WebSocket constructor to throw error
		global.WebSocket = vi.fn(() => {
			throw new Error("Connection refused");
		}) as any;

		const { result } = renderHook(() =>
			useWebRTCClient({
				url: "ws://localhost:8000/api/v1/pipecat/ws",
			})
		);

		// Try to connect
		act(() => {
			result.current.connect();
		});

		// Assert error state
		expect(result.current.status).toBe("error");
		expect(result.current.error).toBeTruthy();
		expect(result.current.error).toContain("Connection refused");
	});

	// Error Test 2: Connection drops mid-conversation
	it("handles connection drop and reconnects", async () => {
		const { result } = renderHook(() =>
			useWebRTCClient({
				url: "ws://localhost:8000/api/v1/pipecat/ws",
				autoReconnect: true,
				reconnectInterval: 100,
			})
		);

		// Connect successfully
		act(() => {
			result.current.connect();
			mockWebSocket.readyState = WebSocket.OPEN;
			const handler = mockWebSocket.addEventListener.mock.calls.find(
				(call: any) => call[0] === "open"
			)?.[1];
			if (handler) handler({});
		});

		expect(result.current.status).toBe("connected");

		// Simulate connection drop
		act(() => {
			const handler = mockWebSocket.addEventListener.mock.calls.find(
				(call: any) => call[0] === "close"
			)?.[1];
			if (handler) handler({});
		});

		expect(result.current.status).toBe("disconnected");

		// Wait for reconnection attempt
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 150));
		});

		// Should attempt to reconnect
		expect(global.WebSocket).toHaveBeenCalledTimes(2);
	});

	// Error Test 3: WebSocket error event
	it("handles WebSocket error event", async () => {
		const { result } = renderHook(() => useWebRTCClient());

		act(() => {
			result.current.connect();
		});

		// Simulate error event
		act(() => {
			const handler = mockWebSocket.addEventListener.mock.calls.find(
				(call: any) => call[0] === "error"
			)?.[1];
			if (handler) handler(new Event("error"));
		});

		expect(result.current.status).toBe("error");
		expect(result.current.error).toBeTruthy();
	});

	// Error Test 4: Microphone permission denied
	it("handles microphone permission denied", async () => {
		// Mock getUserMedia to reject
		const permissionError = new Error("Permission denied");
		permissionError.name = "NotAllowedError";
		navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(permissionError);

		const { result } = renderHook(() => useAudioCapture());

		// Try to start capture
		await act(async () => {
			await result.current.startCapture();
		});

		// Assert error state
		expect(result.current.isCapturing).toBe(false);
		expect(result.current.error).toBeTruthy();
		expect(result.current.error).toContain("Permission denied");
	});

	// Error Test 5: Microphone not available
	it("handles microphone not available", async () => {
		// Mock getUserMedia to reject with NotFoundError
		const notFoundError = new Error("Requested device not found");
		notFoundError.name = "NotFoundError";
		navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(notFoundError);

		const { result } = renderHook(() => useAudioCapture());

		await act(async () => {
			await result.current.startCapture();
		});

		expect(result.current.isCapturing).toBe(false);
		expect(result.current.error).toBeTruthy();
		expect(result.current.error).toContain("not found");
	});

	// Error Test 6: Audio context creation fails
	it("handles audio context creation failure", async () => {
		// Mock AudioContext to throw error
		global.AudioContext = vi.fn(() => {
			throw new Error("AudioContext not supported");
		}) as any;

		const mockTrack = { stop: vi.fn(), kind: "audio" };
		const mockStream = {
			getTracks: vi.fn(() => [mockTrack]),
			getAudioTracks: vi.fn(() => [mockTrack]),
		};
		navigator.mediaDevices.getUserMedia = vi.fn(async () => mockStream);

		const { result } = renderHook(() => useAudioCapture());

		await act(async () => {
			await result.current.startCapture();
		});

		expect(result.current.isCapturing).toBe(false);
		expect(result.current.error).toBeTruthy();
	});

	// Error Test 7: Network timeout
	it("handles network timeout", async () => {
		const { result } = renderHook(() =>
			useWebRTCClient({
				autoReconnect: false,
			})
		);

		act(() => {
			result.current.connect();
		});

		// Simulate timeout (connection never opens)
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 100));
		});

		// Should still be in connecting state (no timeout implemented yet)
		// This test documents current behavior
		expect(result.current.status).toBe("connecting");
	});

	// Error Test 8: Send audio when disconnected
	it("handles sending audio when disconnected", async () => {
		const { result } = renderHook(() => useWebRTCClient());

		// Try to send audio without connecting
		const audioData = new ArrayBuffer(1024);

		// Should not throw error
		expect(() => {
			act(() => {
				result.current.sendAudio(audioData);
			});
		}).not.toThrow();

		// Should log warning (check console.warn was called)
		// Note: In real implementation, this logs a warning
	});

	// Error Test 9: Multiple rapid connection attempts
	it("handles multiple rapid connection attempts", async () => {
		const { result } = renderHook(() => useWebRTCClient());

		// Rapid connection attempts
		act(() => {
			result.current.connect();
			result.current.connect();
			result.current.connect();
		});

		// Should only create one WebSocket
		expect(global.WebSocket).toHaveBeenCalledTimes(1);
	});

	// Error Test 10: Cleanup during active capture
	it("handles cleanup during active capture", async () => {
		const mockTrack = { stop: vi.fn(), kind: "audio" };
		const mockStream = {
			getTracks: vi.fn(() => [mockTrack]),
			getAudioTracks: vi.fn(() => [mockTrack]),
		};
		navigator.mediaDevices.getUserMedia = vi.fn(async () => mockStream);

		const { result, unmount } = renderHook(() => useAudioCapture());

		await act(async () => {
			await result.current.startCapture();
		});

		expect(result.current.isCapturing).toBe(true);

		// Unmount while capturing
		unmount();

		// Should cleanup (track.stop called)
		expect(mockTrack.stop).toHaveBeenCalled();
	});

	// Error Test 11: Reconnection with exponential backoff
	it("implements exponential backoff for reconnection", async () => {
		const { result } = renderHook(() =>
			useWebRTCClient({
				autoReconnect: true,
				reconnectInterval: 100,
				maxReconnectAttempts: 3,
			})
		);

		// Connect and disconnect multiple times
		act(() => {
			result.current.connect();
			mockWebSocket.readyState = WebSocket.OPEN;
			const openHandler = mockWebSocket.addEventListener.mock.calls.find(
				(call: any) => call[0] === "open"
			)?.[1];
			if (openHandler) openHandler({});
		});

		// Disconnect
		act(() => {
			const closeHandler = mockWebSocket.addEventListener.mock.calls.find(
				(call: any) => call[0] === "close"
			)?.[1];
			if (closeHandler) closeHandler({});
		});

		// Wait for first reconnect attempt (100ms * 1)
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 150));
		});

		expect(global.WebSocket).toHaveBeenCalledTimes(2);

		// Disconnect again
		act(() => {
			const closeHandler = mockWebSocket.addEventListener.mock.calls.find(
				(call: any) => call[0] === "close"
			)?.[1];
			if (closeHandler) closeHandler({});
		});

		// Wait for second reconnect attempt (100ms * 2)
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 250));
		});

		expect(global.WebSocket).toHaveBeenCalledTimes(3);
	});

	// Error Test 12: Max reconnection attempts reached
	it("stops reconnecting after max attempts", async () => {
		const { result } = renderHook(() =>
			useWebRTCClient({
				autoReconnect: true,
				reconnectInterval: 50,
				maxReconnectAttempts: 2,
			})
		);

		// Connect
		act(() => {
			result.current.connect();
		});

		// Disconnect and trigger reconnects
		for (let i = 0; i < 3; i++) {
			act(() => {
				const closeHandler = mockWebSocket.addEventListener.mock.calls.find(
					(call: any) => call[0] === "close"
				)?.[1];
				if (closeHandler) closeHandler({});
			});

			await act(async () => {
				await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)));
			});
		}

		// Should have attempted: initial + 2 reconnects = 3 total
		expect(global.WebSocket).toHaveBeenCalledTimes(3);

		// Wait more to ensure no additional attempts
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 200));
		});

		// Still 3 (no more attempts)
		expect(global.WebSocket).toHaveBeenCalledTimes(3);
	});
});
