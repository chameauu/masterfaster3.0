"use client";

/**
 * Continuous Audio Recording Hook
 * 
 * Records audio while user is speaking (based on VAD).
 * Automatically starts/stops recording based on speech detection.
 * 
 * Following React best practices:
 * - rerender-use-ref-transient-values: MediaRecorder and chunks in refs
 * - rerender-functional-setstate: Stable callbacks
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface ContinuousRecordingOptions {
  /** Called when recording completes with audio blob */
  onRecordingComplete?: (audio: Blob) => void;
  /** Called when recording starts */
  onRecordingStart?: () => void;
  /** Called when recording stops */
  onRecordingStop?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

export interface ContinuousRecordingResult {
  /** Is currently recording? */
  isRecording: boolean;
  /** Start recording */
  startRecording: (stream: MediaStream) => void;
  /** Stop recording */
  stopRecording: () => void;
  /** Recording duration in seconds */
  duration: number;
}

export function useContinuousRecording(
  options: ContinuousRecordingOptions = {}
): ContinuousRecordingResult {
  const {
    onRecordingComplete,
    onRecordingStart,
    onRecordingStop,
    onError,
  } = options;

  // Use refs for transient values (rerender-use-ref-transient-values)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  // Start recording (functional setState)
  const startRecording = useCallback(
    (stream: MediaStream) => {
      try {
        // Create MediaRecorder
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm", // Most browsers support this
        });

        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        startTimeRef.current = Date.now();

        // Handle data available
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        // Handle recording stop
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });

          // Call completion callback
          if (onRecordingComplete) {
            onRecordingComplete(audioBlob);
          }

          // Reset
          audioChunksRef.current = [];
          setIsRecording(false);
          setDuration(0);

          // Clear duration interval
          if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
          }

          // Call stop callback
          if (onRecordingStop) {
            onRecordingStop();
          }
        };

        // Handle errors
        mediaRecorder.onerror = (event) => {
          console.error("[Recording] Error:", event);
          const error = new Error("Recording failed");
          if (onError) {
            onError(error);
          }
        };

        // Start recording
        mediaRecorder.start(100); // Collect data every 100ms
        setIsRecording(true);

        // Start duration timer
        durationIntervalRef.current = setInterval(() => {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          setDuration(Math.round(elapsed));
        }, 100);

        // Call start callback
        if (onRecordingStart) {
          onRecordingStart();
        }
      } catch (err) {
        console.error("[Recording] Failed to start:", err);
        const error =
          err instanceof Error ? err : new Error("Failed to start recording");
        if (onError) {
          onError(error);
        }
      }
    },
    [onRecordingComplete, onRecordingStart, onRecordingStop, onError]
  );

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isRecording]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    duration,
  };
}
