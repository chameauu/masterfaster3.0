"use client";

import { useCallback, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { VoiceRecorder } from "./VoiceRecorder";
import { voiceSearch, VoiceAPIError } from "@/lib/apis/voice-api";
import { 
  voiceSessionAtom, 
  voiceConversationAtom,
  voiceUIAtom,
} from "@/atoms/voice";

/**
 * VoiceInterface Component
 * 
 * Main voice assistant interface.
 * Orchestrates recording, transcription, and results display.
 * 
 * Follows React best practices:
 * - rerender-defer-reads: Don't subscribe to state only used in callbacks
 * - rerender-functional-setstate: Stable callbacks
 */

export function VoiceInterface() {
  const [session, setSession] = useAtom(voiceSessionAtom);
  const setConversation = useSetAtom(voiceConversationAtom);
  const setUIState = useSetAtom(voiceUIAtom);
  
  const [currentTranscript, setCurrentTranscript] = useState<string>("");
  const [currentResults, setCurrentResults] = useState<unknown[]>([]);
  const [voiceResponse, setVoiceResponse] = useState<string>("");
  
  // Handle recording start
  const handleRecordingStart = useCallback(() => {
    const sessionId = crypto.randomUUID();
    
    setSession({
      id: sessionId,
      userId: "00000000-0000-0000-0000-000000000001", // Mock user for now
      status: "recording",
      startedAt: new Date(),
    });
    
    // Clear previous results
    setCurrentTranscript("");
    setCurrentResults([]);
    setVoiceResponse("");
  }, [setSession]);
  
  // Handle recording stop
  const handleRecordingStop = useCallback(() => {
    setSession(prev => prev ? { ...prev, status: "processing" } : null);
  }, [setSession]);
  
  // Handle recording complete
  const handleRecordingComplete = useCallback(async (audio: Blob) => {
    try {
      // Update session status
      setSession(prev => prev ? { ...prev, status: "processing" } : null);
      
      // Call voice API
      const response = await voiceSearch(audio);
      
      // Update state with results
      setCurrentTranscript(response.transcript);
      setCurrentResults(response.results);
      setVoiceResponse(response.voice_response);
      
      // Update conversation history
      setConversation(prev => {
        const message = {
          id: crypto.randomUUID(),
          role: "user" as const,
          transcript: response.transcript,
          timestamp: new Date(),
          intent: response.intent,
          results: response.results,
          voiceResponse: response.voice_response,
        };
        
        if (!prev) {
          return {
            sessionId: session?.id || crypto.randomUUID(),
            messages: [message],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
        
        return {
          ...prev,
          messages: [...prev.messages, message],
          updatedAt: new Date(),
        };
      });
      
      // Update session status
      setSession(prev => prev ? { ...prev, status: "idle" } : null);
      
      // Show success toast
      toast.success("Voice search complete", {
        description: `Found ${response.results.length} results`,
      });
      
    } catch (error) {
      console.error("Voice search error:", error);
      
      // Update session with error
      setSession(prev => prev ? { 
        ...prev, 
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      } : null);
      
      // Show error toast
      if (error instanceof VoiceAPIError) {
        toast.error("Voice search failed", {
          description: error.message,
        });
      } else {
        toast.error("Voice search failed", {
          description: "An unexpected error occurred",
        });
      }
    }
  }, [session?.id, setSession, setConversation]);
  
  // Handle recording error
  const handleRecordingError = useCallback((error: Error) => {
    console.error("Recording error:", error);
    
    setSession(prev => prev ? {
      ...prev,
      status: "error",
      error: error.message,
    } : null);
    
    toast.error("Recording failed", {
      description: error.message,
    });
  }, [setSession]);
  
  return (
    <div className="flex flex-col items-center gap-8 p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Voice Assistant</h1>
        <p className="text-muted-foreground">
          Search your documents using voice commands
        </p>
      </div>
      
      {/* Voice Recorder */}
      <div className="w-full flex justify-center">
        <VoiceRecorder
          onRecordingStart={handleRecordingStart}
          onRecordingStop={handleRecordingStop}
          onRecordingComplete={handleRecordingComplete}
          onError={handleRecordingError}
        />
      </div>
      
      {/* Processing Indicator */}
      {session?.status === "processing" && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Processing your voice command...</span>
        </div>
      )}
      
      {/* Transcript */}
      {currentTranscript && (
        <div className="w-full p-4 border rounded-lg space-y-2">
          <h3 className="font-semibold">You said:</h3>
          <p className="text-muted-foreground">{currentTranscript}</p>
        </div>
      )}
      
      {/* Voice Response */}
      {voiceResponse && (
        <div className="w-full p-4 border rounded-lg space-y-2 bg-muted/50">
          <h3 className="font-semibold">Response:</h3>
          <p>{voiceResponse}</p>
        </div>
      )}
      
      {/* Results */}
      {currentResults.length > 0 && (
        <div className="w-full space-y-4">
          <h3 className="font-semibold">Search Results ({currentResults.length})</h3>
          <div className="space-y-2">
            {currentResults.map((result: any, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">
                  {result.document?.title || `Result ${index + 1}`}
                </h4>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {result.content || result.chunks?.[0]?.content || "No content available"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Error State */}
      {session?.status === "error" && session.error && (
        <div className="w-full p-4 border border-destructive rounded-lg">
          <h3 className="font-semibold text-destructive mb-2">Error</h3>
          <p className="text-sm text-muted-foreground">{session.error}</p>
        </div>
      )}
    </div>
  );
}
