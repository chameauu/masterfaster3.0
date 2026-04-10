"use client";

/**
 * Voice Widget Component
 *
 * Minimal voice interface for dashboard integration.
 * Combines WebRTC client + audio capture for real-time voice streaming.
 *
 * Following React best practices:
 * - rerender-use-ref-transient-values: Audio/WebSocket in refs
 * - rerender-functional-setstate: Stable callbacks
 * - client-event-listeners: Cleanup on unmount
 */

import { Mic, MicOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAudioCapture } from "@/hooks/use-audio-capture";
import { useWebRTCClient } from "@/hooks/use-webrtc-client";

export interface VoiceWidgetProps {
	/** WebSocket URL (default: ws://localhost:8000/api/v1/pipecat/ws) */
	wsUrl?: string;
	/** Auto-connect on mount */
	autoConnect?: boolean;
	/** Callback when transcription received */
	onTranscription?: (text: string) => void;
}

export function VoiceWidget({
	wsUrl = "ws://localhost:8000/api/v1/pipecat/ws",
	autoConnect = false,
	onTranscription,
}: VoiceWidgetProps) {
	const [isActive, setIsActive] = useState(false);

	// WebRTC client for backend connection
	const webrtc = useWebRTCClient({
		url: wsUrl,
		autoReconnect: true,
	});

	// Audio capture for microphone
	const audio = useAudioCapture({
		sampleRate: 16000,
		channelCount: 1,
	});

	// Connect audio capture to WebRTC client
	useEffect(() => {
		audio.onAudioData((audioData) => {
			// Convert Float32Array to ArrayBuffer
			const buffer = audioData.buffer;
			webrtc.sendAudio(buffer);
		});
	}, [audio, webrtc]);

	// Handle received audio from backend (TTS)
	useEffect(() => {
		webrtc.onAudioReceived((audioData) => {
			console.log("[VoiceWidget] Received audio:", audioData.byteLength, "bytes");
			// TODO: Play audio (Day 15-16)
		});
	}, [webrtc]);

	// Auto-connect on mount if enabled
	useEffect(() => {
		if (autoConnect) {
			webrtc.connect();
		}

		return () => {
			webrtc.disconnect();
			audio.stopCapture();
		};
	}, [autoConnect, webrtc, audio]);

	// Toggle voice capture
	const toggleVoice = useCallback(async () => {
		if (isActive) {
			// Stop
			audio.stopCapture();
			setIsActive(false);
		} else {
			// Start
			if (webrtc.status !== "connected") {
				webrtc.connect();
			}
			await audio.startCapture();
			setIsActive(true);
		}
	}, [isActive, webrtc, audio]);

	// Connection status indicator
	const getStatusColor = () => {
		switch (webrtc.status) {
			case "connected":
				return "bg-green-500";
			case "connecting":
				return "bg-yellow-500";
			case "error":
				return "bg-red-500";
			default:
				return "bg-gray-500";
		}
	};

	return (
		<div className="flex flex-col items-center gap-4 p-4">
			{/* Voice Button */}
			<div className="relative">
				<Button
					size="lg"
					variant={isActive ? "destructive" : "default"}
					onClick={toggleVoice}
					className="rounded-full size-16"
					aria-label={isActive ? "Stop voice" : "Start voice"}
					disabled={audio.error !== null}
				>
					{isActive ? <MicOff className="size-6" /> : <Mic className="size-6" />}
				</Button>

				{/* Connection status indicator */}
				<div
					className={`absolute -top-1 -right-1 size-4 rounded-full ${getStatusColor()} ${
						webrtc.status === "connecting" ? "animate-pulse" : ""
					}`}
					title={`WebRTC: ${webrtc.status}`}
				/>
			</div>

			{/* Status Text */}
			<div className="text-center space-y-1">
				{isActive && (
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<div className="size-2 rounded-full bg-red-500 animate-pulse" />
						<span>Listening...</span>
					</div>
				)}

				{audio.isCapturing && (
					<div className="text-xs text-muted-foreground">Audio level: {audio.audioLevel}</div>
				)}

				{webrtc.error && <div className="text-xs text-destructive">{webrtc.error}</div>}

				{audio.error && <div className="text-xs text-destructive">{audio.error}</div>}
			</div>

			{/* Audio Level Visualizer */}
			{audio.isCapturing && (
				<div className="w-full max-w-xs">
					<div className="h-2 bg-muted rounded-full overflow-hidden">
						<div
							className="h-full bg-primary transition-all duration-100"
							style={{ width: `${(audio.audioLevel / 255) * 100}%` }}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
