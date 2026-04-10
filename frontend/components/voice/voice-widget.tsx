"use client";

/**
 * Voice Widget Component
 *
 * Complete voice interface for dashboard integration.
 * Combines WebRTC client + audio capture + audio playback for full voice conversation.
 *
 * Following React best practices:
 * - rerender-use-ref-transient-values: Audio/WebSocket in refs
 * - rerender-functional-setstate: Stable callbacks
 * - client-event-listeners: Cleanup on unmount
 */

import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAudioCapture } from "@/hooks/use-audio-capture";
import { useAudioPlayback } from "@/hooks/use-audio-playback";
import { useWebRTCClient } from "@/hooks/use-webrtc-client";

export interface VoiceWidgetProps {
	/** WebSocket URL (default: ws://localhost:8000/api/v1/pipecat/ws) */
	wsUrl?: string;
	/** Auto-connect on mount */
	autoConnect?: boolean;
	/** Callback when transcription received */
	onTranscription?: (text: string) => void;
	/** Show volume controls */
	showVolumeControls?: boolean;
}

export function VoiceWidget({
	wsUrl = "ws://localhost:8000/api/v1/pipecat/ws",
	autoConnect = false,
	onTranscription,
	showVolumeControls = true,
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

	// Audio playback for TTS responses
	const playback = useAudioPlayback({
		sampleRate: 16000,
		channelCount: 1,
		volume: 0.8,
	});

	// Connect audio capture to WebRTC client
	useEffect(() => {
		audio.onAudioData((audioData) => {
			// Convert Float32Array to ArrayBuffer
			const buffer = audioData.buffer;
			webrtc.sendAudio(buffer);
		});
	}, [audio, webrtc]);

	// Handle received audio from backend (TTS) and play it
	useEffect(() => {
		webrtc.onAudioReceived((audioData) => {
			console.log("[VoiceWidget] Received audio:", audioData.byteLength, "bytes");

			// Convert ArrayBuffer to Float32Array
			const float32Data = new Float32Array(audioData);
			playback.queueAudio(float32Data);

			// Auto-start playback if not already playing
			if (!playback.isPlaying && playback.queueSize > 0) {
				playback.startPlayback();
			}
		});
	}, [webrtc, playback]);

	// Auto-connect on mount if enabled
	useEffect(() => {
		if (autoConnect) {
			webrtc.connect();
		}

		return () => {
			webrtc.disconnect();
			audio.stopCapture();
			playback.stop();
		};
	}, [autoConnect, webrtc, audio, playback]);

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

				{playback.isPlaying && (
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Volume2 className="size-3" />
						<span>Playing response...</span>
					</div>
				)}

				{audio.isCapturing && (
					<div className="text-xs text-muted-foreground">Audio level: {audio.audioLevel}</div>
				)}

				{webrtc.error && <div className="text-xs text-destructive">{webrtc.error}</div>}

				{audio.error && <div className="text-xs text-destructive">{audio.error}</div>}

				{playback.error && <div className="text-xs text-destructive">{playback.error}</div>}
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

			{/* Volume Controls */}
			{showVolumeControls && (
				<div className="w-full max-w-xs space-y-2">
					<div className="flex items-center gap-2">
						{playback.volume === 0 ? (
							<VolumeX className="size-4 text-muted-foreground" />
						) : (
							<Volume2 className="size-4 text-muted-foreground" />
						)}
						<Slider
							value={[playback.volume]}
							onValueChange={([value]) => playback.setVolume(value)}
							min={0}
							max={1}
							step={0.1}
							className="flex-1"
							aria-label="Volume"
						/>
						<span className="text-xs text-muted-foreground w-8 text-right">
							{Math.round(playback.volume * 100)}%
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
