/**
 * Tests for useWebRTCClient hook
 *
 * Following TDD principles:
 * - RED: Write failing test
 * - GREEN: Minimal implementation
 * - REFACTOR: Improve code quality
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWebRTCClient } from "../use-webrtc-client";

describe("useWebRTCClient", () => {
	// Mock WebSocket
	let mockWebSocket: any;
	let mockWebSocketConstructor: any;
	let originalWebSocket: any;

	beforeEach(() => {
		// Save original WebSocket
		originalWebSocket = global.WebSocket;

		// Create mock WebSocket instance
		mockWebSocket = {
			readyState: WebSocket.CONNECTING,
			close: vi.fn(),
			send: vi.fn(),
			addEventListener: vi.fn((event, handler) => {
				// Store handlers for later triggering
				if (!mockWebSocket._handlers) {
					mockWebSocket._handlers = {};
				}
				mockWebSocket._handlers[event] = handler;
			}),
			removeEventListener: vi.fn(),
		};

		// Mock WebSocket constructor
		mockWebSocketConstructor = vi.fn(() => mockWebSocket);
		global.WebSocket = mockWebSocketConstructor as any;

		// Add WebSocket constants
		global.WebSocket.CONNECTING = 0;
		global.WebSocket.OPEN = 1;
		global.WebSocket.CLOSING = 2;
		global.WebSocket.CLOSED = 3;
	});

	afterEach(() => {
		// Restore original WebSocket
		global.WebSocket = originalWebSocket;
		vi.clearAllMocks();
	});

	// Helper to trigger WebSocket events
	const triggerEvent = (event: string, data?: any) => {
		const handler = mockWebSocket._handlers?.[event];
		if (handler) {
			handler(data || {});
		}
	};

	// TRACER BULLET: Test 1 - Connect to WebSocket
	it("connects to WebSocket endpoint", () => {
		// Arrange
		const wsUrl = "ws://localhost:8000/api/v1/pipecat/ws";

		// Act
		const { result } = renderHook(() => useWebRTCClient({ url: wsUrl }));

		// Initially disconnected
		expect(result.current.status).toBe("disconnected");

		// Connect
		act(() => {
			result.current.connect();
		});

		// Should be connecting
		expect(result.current.status).toBe("connecting");
		expect(mockWebSocketConstructor).toHaveBeenCalledWith(wsUrl);

		// Simulate WebSocket open event
		act(() => {
			mockWebSocket.readyState = WebSocket.OPEN;
			triggerEvent("open");
		});

		// Assert - Should be connected
		expect(result.current.status).toBe("connected");
		expect(result.current.error).toBeNull();
	});

	// Test 2: Track connection status
	it("tracks connection status correctly", () => {
		const { result } = renderHook(() => useWebRTCClient());

		// Initial status
		expect(result.current.status).toBe("disconnected");

		// Connecting
		act(() => {
			result.current.connect();
		});
		expect(result.current.status).toBe("connecting");

		// Connected
		act(() => {
			mockWebSocket.readyState = WebSocket.OPEN;
			triggerEvent("open");
		});
		expect(result.current.status).toBe("connected");

		// Disconnected
		act(() => {
			result.current.disconnect();
		});
		expect(result.current.status).toBe("disconnected");
	});

	// Test 3: Handle connection errors
	it("handles connection errors gracefully", () => {
		const { result } = renderHook(() => useWebRTCClient());

		act(() => {
			result.current.connect();
		});

		// Simulate error
		act(() => {
			triggerEvent("error", new Event("error"));
		});

		expect(result.current.status).toBe("error");
		expect(result.current.error).toBeTruthy();
	});

	// Test 4: Disconnect and cleanup
	it("disconnects and cleans up resources", () => {
		const { result } = renderHook(() => useWebRTCClient());

		// Connect
		act(() => {
			result.current.connect();
			mockWebSocket.readyState = WebSocket.OPEN;
			triggerEvent("open");
		});

		expect(result.current.status).toBe("connected");

		// Disconnect
		act(() => {
			result.current.disconnect();
		});

		expect(mockWebSocket.close).toHaveBeenCalled();
		expect(result.current.status).toBe("disconnected");
	});

	// Test 5: Send audio data
	it("sends audio data when connected", () => {
		const { result } = renderHook(() => useWebRTCClient());

		// Connect
		act(() => {
			result.current.connect();
			mockWebSocket.readyState = WebSocket.OPEN;
			triggerEvent("open");
		});

		// Send audio
		const audioData = new ArrayBuffer(1024);
		act(() => {
			result.current.sendAudio(audioData);
		});

		expect(mockWebSocket.send).toHaveBeenCalledWith(audioData);
	});

	// Test 6: Receive audio data
	it("receives audio data via callback", () => {
		const { result } = renderHook(() => useWebRTCClient());
		const audioCallback = vi.fn();

		// Register callback
		act(() => {
			result.current.onAudioReceived(audioCallback);
		});

		// Connect
		act(() => {
			result.current.connect();
			mockWebSocket.readyState = WebSocket.OPEN;
			triggerEvent("open");
		});

		// Simulate receiving audio
		const audioData = new ArrayBuffer(1024);
		act(() => {
			triggerEvent("message", { data: audioData });
		});

		expect(audioCallback).toHaveBeenCalledWith(audioData);
	});
});
