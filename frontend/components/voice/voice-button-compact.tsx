"use client";

/**
 * Compact Voice Button for Dashboard
 * 
 * Pipecat-powered voice button for chat header integration.
 * Minimal UI with expandable controls.
 * 
 * Following React best practices:
 * - rerender-memo: Memoized for performance
 * - rerender-use-ref-transient-values: Audio/WebSocket in refs
 * - bundle-dynamic-imports: Heavy components loaded on demand
 */

import { Mic, MicOff, Volume2, Settings } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { useAudioCapture } from "@/hooks/use-audio-capture";
import { useAudioPlayback } from "@/hooks/use-audio-playback";
import { useWebRTCClient } from "@/hooks/use-webrtc-client";

export interface VoiceButtonCompactProps {
	/** WebSocket URL (default: ws://localhost:8000/api/v1/pipecat/ws) */
	wsUrl?: string;
	/** Auto-connect on mount */
	autoConnect?: boolean;
	/** Callback when transcription received */
	onTranscription?: (text: string) => void;
	/** Size variant */
	size?: "sm" | "default" | "lg";
	/** Show as icon only (no text) */
	iconOnly?: boolean;
}

export const VoiceButtonCompact = memo(function VoiceButtonCompact({
	wsUrl = "ws://localhost:8000/api/v1/pipecat/ws",
	autoConnect = false,
	onTranscription,
	size = "default",
	iconOnly = true,
}: VoiceButtonCompactProps) {
	const [isActive, setIsActive] = useState(false);
	const [showSettings, setShowSettings] = useState(false);

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
			const buffer = audioData.buffer;
			webrtc.sendAudio(buffer);
		});
	}, [audio, webrtc]);

	// Handle received audio from backend (TTS) and play it
	useEffect(() => {
		webrtc.onAudioReceived((audioData) => {
			const float32Data = new Float32Array(audioData);
			playback.queueAudio(float32Data);

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
			audio.stopCapture();
			setIsActive(false);
		} else {
			if (webrtc.status !== "connected") {
				webrtc.connect();
			}
			await audio.startCapture();
			setIsActive(true);
		}
	}, [isActive, webrtc, audio]);

	// Get button variant based on state
	const getButtonVariant = () => {
		if (isActive) return "destructive";
		if (webrtc.status === "error") return "destructive";
		return "ghost";
	};

	// Get status color for indicator
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
		<div className="flex items-center gap-1">
			{/* Main Voice Button */}
			<div className="relative">
				<Button
					size={size}
					variant={getButtonVariant()}
					onClick={toggleVoice}
					disabled={audio.error !== null}
					aria-label={isActive ? "Stop voice" : "Start voice"}
					className="relative"
				>
					{isActive ? (
						<MicOff className="size-4" />
					) : (
						<Mic className="size-4" />
					)}
					{!iconOnly && (
						<span className="ml-2">
							{isActive ? "Stop" : "Voice"}
						</span>
					)}
				</Button>

				{/* Connection status indicator */}
				<div
					className={`absolute -top-0.5 -right-0.5 size-2 rounded-full ${getStatusColor()} ${
						webrtc.status === "connecting" ? "animate-pulse" : ""
					}`}
					title={`WebRTC: ${webrtc.status}`}
				/>
			</div>

			{/* Settings Popover */}
			<Popover open={showSettings} onOpenChange={setShowSettings}>
				<PopoverTrigger asChild>
					<Button
						size={size}
						variant="ghost"
						aria-label="Voice settings"
					>
						<Settings className="size-4" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-80" align="end">
					<div className="space-y-4">
						<div>
							<h4 className="font-medium mb-2">Voice Settings</h4>
							<p className="text-sm text-muted-foreground">
								Pipecat real-time voice conversation
							</p>
						</div>

						{/* Connection Status */}
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Status:</span>
								<span className="font-medium capitalize">{webrtc.status}</span>
							</div>
							{webrtc.error && (
								<div className="text-xs text-destructive">{webrtc.error}</div>
							)}
						</div>

						{/* Audio Level */}
						{audio.isCapturing && (
							<div className="space-y-2">
								<div className="text-sm text-muted-foreground">Audio Level</div>
								<div className="h-2 bg-muted rounded-full overflow-hidden">
									<div
										className="h-full bg-primary transition-all duration-100"
										style={{ width: `${(audio.audioLevel / 255) * 100}%` }}
									/>
								</div>
							</div>
						)}

						{/* Volume Control */}
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Volume</span>
								<span className="text-xs">{Math.round(playback.volume * 100)}%</span>
							</div>
							<div className="flex items-center gap-2">
								<Volume2 className="size-4 text-muted-foreground" />
								<Slider
									value={[playback.volume]}
									onValueChange={([value]) => playback.setVolume(value)}
									min={0}
									max={1}
									step={0.1}
									className="flex-1"
									aria-label="Volume"
								/>
							</div>
						</div>

						{/* Playback Status */}
						{playback.isPlaying && (
							<div className="text-sm text-muted-foreground">
								Playing response...
							</div>
						)}
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
});
