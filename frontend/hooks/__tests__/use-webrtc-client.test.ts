/**
 * Tests for useWebRTCClient hook
 * 
 * Following TDD principles:
 * - RED: Write failing test
 * - GREEN: Minimal implementation
 * - REFACTOR: Improve code quality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWebRTCClient } from '../use-webrtc-client';

describe('useWebRTCClient', () => {
  // Mock WebSocket
  let mockWebSocket: any;
  
  beforeEach(() => {
    // Create mock WebSocket
    mockWebSocket = {
      readyState: WebSocket.CONNECTING,
      close: vi.fn(),
      send: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    
    // Mock WebSocket constructor
    global.WebSocket = vi.fn(() => mockWebSocket) as any;
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  // TRACER BULLET: Test 1 - Connect to WebSocket
  it('connects to WebSocket endpoint', async () => {
    // RED: This test will fail because useWebRTCClient doesn't exist yet
    
    // Arrange
    const wsUrl = 'ws://localhost:8000/api/v1/pipecat/ws';
    
    // Act
    const { result } = renderHook(() => useWebRTCClient({ url: wsUrl }));
    
    // Trigger connection
    result.current.connect();
    
    // Simulate WebSocket open event
    mockWebSocket.readyState = WebSocket.OPEN;
    const openHandler = mockWebSocket.addEventListener.mock.calls.find(
      (call: any) => call[0] === 'open'
    )?.[1];
    openHandler?.();
    
    // Assert
    await waitFor(() => {
      expect(global.WebSocket).toHaveBeenCalledWith(wsUrl);
      expect(result.current.status).toBe('connected');
    });
  });
});
