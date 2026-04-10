"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { Mic, MicOff, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { voiceUIAtom } from "@/atoms/voice";

/**
 * VoiceRecorder Component
 * 
 * Handles audio recording using MediaRecorder API.
 * Follows React best practices:
 * - rerender-memo: Memoized for performance
 * - rerender-use-ref-transient-values: Uses refs for transient audio data
 * - rerender-functional-setstate: Stable callbacks with functional setState
 * - rendering-hoist-jsx: Static icons hoisted
 */

interface VoiceRecorderProps {
  onRecordingComplete: (audio: Blob) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onError?: (error: Error) => void;
}

// Hoist static JSX (rendering-hoist-jsx)
const MIC_ICON = <Mic className="size-5" />;
const MIC_OFF_ICON = <MicOff className="size-5" />;
const STOP_ICON = <Square className="size-4" />;

export const VoiceRecorder = memo(function VoiceRecorder({
  onRecordingComplete,
  onRecordingStart,
  onRecordingStop,
  onError,
}: VoiceRecorderProps) {
  // Use refs for transient values (rerender-use-ref-transient-values)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  // UI state
  const [isRecording, setIsRecording] = useState(false);
  const [uiState, setUIState] = useAtom(voiceUIAtom);
  
  // Request microphone permission on mount
  useEffect(() => {
    async function requestPermission() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 16000, // 16kHz for Faster-Whisper
            channelCount: 1, // Mono
            echoCancellation: true,
            noiseSuppression: true,
          } 
        });
        
        streamRef.current = stream;
        
        // Update permission state
        setUIState(prev => ({
          ...prev,
          microphonePermission: "granted",
        }));
        
        // Initialize MediaRecorder
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm", // Most browsers support this
        });
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: "audio/webm" 
          });
          onRecordingComplete(audioBlob);
          audioChunksRef.current = [];
        };
        
        mediaRecorderRef.current = mediaRecorder;
        
      } catch (error) {
        console.error("Microphone permission denied:", error);
        
        setUIState(prev => ({
          ...prev,
          microphonePermission: "denied",
          lastError: error instanceof Error ? error.message : "Microphone access denied",
        }));
        
        if (onError) {
          onError(error instanceof Error ? error : new Error("Microphone access denied"));
        }
      }
    }
    
    requestPermission();
    
    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [setUIState, onRecordingComplete, onError]);
  
  // Functional setState for stable callbacks (rerender-functional-setstate)
  const startRecording = useCallback(() => {
    if (!mediaRecorderRef.current || uiState.microphonePermission !== "granted") {
      return;
    }
    
    setIsRecording(true);
    audioChunksRef.current = [];
    mediaRecorderRef.current.start();
    
    setUIState(prev => ({
      ...prev,
      recordingDuration: 0,
    }));
    
    if (onRecordingStart) {
      onRecordingStart();
    }
  }, [uiState.microphonePermission, setUIState, onRecordingStart]);
  
  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecording) {
      return;
    }
    
    setIsRecording(false);
    mediaRecorderRef.current.stop();
    
    if (onRecordingStop) {
      onRecordingStop();
    }
  }, [isRecording, onRecordingStop]);
  
  // Handle permission denied
  if (uiState.microphonePermission === "denied") {
    return (
      <div className="flex flex-col items-center gap-2 p-4 border border-destructive rounded-lg">
        {MIC_OFF_ICON}
        <p className="text-sm text-destructive">
          Microphone access denied. Please enable microphone permissions in your browser settings.
        </p>
      </div>
    );
  }
  
  // Handle permission prompt
  if (uiState.microphonePermission === "prompt") {
    return (
      <div className="flex flex-col items-center gap-2 p-4">
        {MIC_ICON}
        <p className="text-sm text-muted-foreground">
          Requesting microphone permission...
        </p>
      </div>
    );
  }
  
  // Recording controls
  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        size="lg"
        variant={isRecording ? "destructive" : "default"}
        onClick={isRecording ? stopRecording : startRecording}
        className="rounded-full size-16"
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {isRecording ? STOP_ICON : MIC_ICON}
      </Button>
      
      {isRecording && (
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm text-muted-foreground">Recording...</span>
        </div>
      )}
    </div>
  );
});
