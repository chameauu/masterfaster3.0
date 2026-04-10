"use client";

/**
 * Auto-Transcription Hook
 * 
 * Combines VAD + Recording + Transcription for always-listening interface.
 * Automatically transcribes audio when user stops speaking.
 * 
 * Following React best practices:
 * - rerender-defer-reads: Don't subscribe to state only used in callbacks
 * - rerender-functional-setstate: Stable callbacks
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BACKEND_URL } from "@/lib/env-config";
import { useContinuousRecording } from "./use-continuous-recording";
import { useVoiceActivityDetection } from "./use-voice-activity-detection";

export interface AutoTranscriptionOptions {
  /** Called when transcription completes with text */
  onTranscript: (text: string) => void;
  /** Enable/disable auto-transcription */
  enabled?: boolean;
  /** VAD threshold (0-255) */
  threshold?: number;
  /** Silence duration in ms */
  silenceDuration?: number;
}

export interface AutoTranscriptionResult {
  /** Is voice enabled and listening? */
  isEnabled: boolean;
  /** Is currently speaking? */
  isSpeaking: boolean;
  /** Is currently recording? */
  isRecording: boolean;
  /** Is currently transcribing? */
  isTranscribing: boolean;
  /** Current audio level (0-255) */
  audioLevel: number;
  /** Error message if any */
  error: string | null;
  /** Enable voice */
  enable: () => Promise<void>;
  /** Disable voice */
  disable: () => void;
  /** Recording duration */
  duration: number;
}

export function useAutoTranscription(
  options: AutoTranscriptionOptions
): AutoTranscriptionResult {
  const { onTranscript, enabled = false, threshold, silenceDuration } = options;

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wasRecordingRef = useRef(false);
  const isRecordingRef = useRef(false); // Track recording state in ref

  // Voice Activity Detection
  const vad = useVoiceActivityDetection({
    threshold,
    silenceDuration,
    enabled,
  });

  // Handle recording completion
  const handleRecordingComplete = useCallback(
    async (audioBlob: Blob) => {
      setIsTranscribing(true);

      try {
        // Send to backend for transcription
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");

        const response = await fetch(`${BACKEND_URL}/api/v1/voice/transcribe`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Transcription failed: ${response.statusText}`);
        }

        const data = await response.json();
        const transcript = data.transcript?.trim();

        if (transcript) {
          onTranscript(transcript);
        }
      } catch (err) {
        console.error("[AutoTranscription] Transcription error:", err);
        const errorMsg =
          err instanceof Error ? err.message : "Transcription failed";
        setError(errorMsg);
        toast.error("Voice transcription failed", {
          description: errorMsg,
        });
      } finally {
        setIsTranscribing(false);
      }
    },
    [onTranscript]
  );

  // Continuous Recording
  const recording = useContinuousRecording({
    onRecordingComplete: handleRecordingComplete,
    onRecordingStart: () => {
      isRecordingRef.current = true;
    },
    onRecordingStop: () => {
      isRecordingRef.current = false;
    },
    onError: (err) => {
      console.error("[AutoTranscription] Recording error:", err);
      setError(err.message);
      toast.error("Voice recording failed", {
        description: err.message,
      });
    },
  });

  // Auto start/stop recording based on speech detection
  useEffect(() => {
    if (!vad.isListening) {
      return;
    }

    if (vad.isSpeaking && !isRecordingRef.current) {
      // Speech started → Start recording
      if (streamRef.current) {
        recording.startRecording(streamRef.current);
        wasRecordingRef.current = true;
      }
    } else if (!vad.isSpeaking && isRecordingRef.current && wasRecordingRef.current) {
      // Speech ended → Stop recording
      recording.stopRecording();
      wasRecordingRef.current = false;
    }
  }, [vad.isSpeaking, vad.isListening, recording.startRecording, recording.stopRecording]);

  // Enable voice
  const enable = useCallback(async () => {
    try {
      // Request microphone permission and get stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Start VAD
      await vad.startListening();

      setError(null);
      toast.success("Voice enabled", {
        description: "Speak naturally, I'm listening...",
      });
    } catch (err) {
      console.error("[AutoTranscription] Failed to enable:", err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Failed to access microphone";
      setError(errorMsg);
      toast.error("Failed to enable voice", {
        description: errorMsg,
      });
    }
  }, [vad]);

  // Disable voice
  const disable = useCallback(() => {
    // Stop recording if active
    if (recording.isRecording) {
      recording.stopRecording();
    }

    // Stop VAD
    vad.stopListening();

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setError(null);
    toast.info("Voice disabled");
  }, [vad, recording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    isEnabled: vad.isListening,
    isSpeaking: vad.isSpeaking,
    isRecording: recording.isRecording,
    isTranscribing,
    audioLevel: vad.audioLevel,
    error: error || vad.error,
    enable,
    disable,
    duration: recording.duration,
  };
}
