"use client";

/**
 * WebRTC Client Hook
 * 
 * Manages WebSocket connection to Pipecat backend for voice communication.
 * 
 * Following React best practices:
 * - rerender-use-ref-transient-values: WebSocket in refs
 * - rerender-functional-setstate: Stable callbacks
 * - client-event-listeners: Cleanup on unmount
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface WebRTCClientOptions {
  /** WebSocket URL (default: ws://localhost:8000/api/v1/pipecat/ws) */
  url?: string;
  /** Enable automatic reconnection */
  autoReconnect?: boolean;
  /** Reconnection interval in ms */
  reconnectInterval?: number;
  /** Maximum reconnection attempts */
  maxReconnectAttempts?: number;
}

export type ConnectionStatus = 
  | "disconnected" 
  | "connecting" 
  | "connected" 
  | "error";

export interface WebRTCClientResult {
  /** Current connection status */
  status: ConnectionStatus;
  /** Error message if any */
  error: string | null;
  /** Connect to WebSocket */
  connect: () => void;
  /** Disconnect from WebSocket */
  disconnect: () => void;
  /** Send audio data */
  sendAudio: (data: ArrayBuffer) => void;
  /** Register callback for received audio */
  onAudioReceived: (callback: (data: ArrayBuffer) => void) => void;
}

export function useWebRTCClient(
  options: WebRTCClientOptions = {}
): WebRTCClientResult {
  const {
    url = "ws://localhost:8000/api/v1/pipecat/ws",
    autoReconnect = true,
    reconnectInterval = 1000,
    maxReconnectAttempts = 5,
  } = options;

  // Use refs for transient values (rerender-use-ref-transient-values)
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioCallbackRef = useRef<((data: ArrayBuffer) => void) | null>(null);

  // State
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);

  // Connect to WebSocket (functional setState for stable callback)
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    setStatus("connecting");
    setError(null);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      // Handle connection open
      ws.addEventListener("open", () => {
        setStatus("connected");
        reconnectAttemptsRef.current = 0;
        console.log("[WebRTC] Connected to", url);
      });

      // Handle messages
      ws.addEventListener("message", (event) => {
        // Assuming binary audio data
        if (event.data instanceof ArrayBuffer) {
          audioCallbackRef.current?.(event.data);
        }
      });

      // Handle errors
      ws.addEventListener("error", (event) => {
        console.error("[WebRTC] WebSocket error:", event);
        setStatus("error");
        setError("WebSocket connection error");
      });

      // Handle close
      ws.addEventListener("close", () => {
        console.log("[WebRTC] Disconnected");
        setStatus("disconnected");

        // Auto-reconnect if enabled
        if (
          autoReconnect &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current += 1;
          console.log(
            `[WebRTC] Reconnecting... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval * reconnectAttemptsRef.current); // Exponential backoff
        }
      });
    } catch (err) {
      console.error("[WebRTC] Failed to create WebSocket:", err);
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Failed to create WebSocket"
      );
    }
  }, [url, autoReconnect, reconnectInterval, maxReconnectAttempts]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus("disconnected");
    reconnectAttemptsRef.current = 0;
  }, []);

  // Send audio data
  const sendAudio = useCallback((data: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    } else {
      console.warn("[WebRTC] Cannot send audio: not connected");
    }
  }, []);

  // Register audio callback
  const onAudioReceived = useCallback((callback: (data: ArrayBuffer) => void) => {
    audioCallbackRef.current = callback;
  }, []);

  // Cleanup on unmount (client-event-listeners)
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    error,
    connect,
    disconnect,
    sendAudio,
    onAudioReceived,
  };
}
