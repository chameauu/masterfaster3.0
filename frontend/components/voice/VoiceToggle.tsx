"use client";

/**
 * VoiceToggle Component
 *
 * Toggle button for always-listening voice interface.
 * Shows visual feedback for listening, speaking, recording, and transcribing states.
 *
 * Following React best practices:
 * - rendering-hoist-jsx: Static icons hoisted
 * - rerender-memo: Memoized for performance
 * - bundle-dynamic-imports: Heavy components loaded dynamically
 */

import { Loader2, Mic, MicOff } from "lucide-react";
import { memo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAutoTranscription } from "@/hooks/use-auto-transcription";

// Hoist static JSX (rendering-hoist-jsx)
const MIC_ICON = <Mic className="size-5" />;
const MIC_OFF_ICON = <MicOff className="size-5" />;
const LOADER_ICON = <Loader2 className="size-5 animate-spin" />;

interface VoiceToggleProps {
	/** Called when transcript is ready */
	onTranscript: (text: string) => void;
	/** Optional className for styling */
	className?: string;
	/** Auto-enable voice on mount (default: true for accessibility) */
	autoEnable?: boolean;
}

export const VoiceToggle = memo(function VoiceToggle({
	onTranscript,
	className,
	autoEnable = true,
}: VoiceToggleProps) {
	const voice = useAutoTranscription({
		onTranscript,
		threshold: 30, // Adjust based on environment
		silenceDuration: 1500, // 1.5 seconds
	});

	// Auto-enable voice on mount for accessibility (visually impaired users)
	useEffect(() => {
		if (autoEnable && !voice.isEnabled) {
			// Small delay to ensure component is fully mounted
			const timer = setTimeout(() => {
				voice.enable();
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [autoEnable, voice]);

	const handleToggle = useCallback(() => {
		if (voice.isEnabled) {
			voice.disable();
		} else {
			voice.enable();
		}
	}, [voice]);

	// Determine button state and appearance
	const getButtonState = () => {
		if (voice.isTranscribing) {
			return {
				icon: LOADER_ICON,
				variant: "default" as const,
				tooltip: "Transcribing...",
				pulse: false,
			};
		}

		if (voice.isRecording) {
			return {
				icon: MIC_ICON,
				variant: "destructive" as const,
				tooltip: `Recording... (${voice.duration}s)`,
				pulse: true,
			};
		}

		if (voice.isSpeaking) {
			return {
				icon: MIC_ICON,
				variant: "default" as const,
				tooltip: "Speak now...",
				pulse: true,
			};
		}

		if (voice.isEnabled) {
			return {
				icon: MIC_ICON,
				variant: "secondary" as const,
				tooltip: "Listening... (Click to disable)",
				pulse: false,
			};
		}

		return {
			icon: MIC_OFF_ICON,
			variant: "ghost" as const,
			tooltip: "Enable voice input",
			pulse: false,
		};
	};

	const buttonState = getButtonState();

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<div className="relative">
						<Button
							variant={buttonState.variant}
							size="icon"
							onClick={handleToggle}
							className={className}
							aria-label={voice.isEnabled ? "Disable voice" : "Enable voice"}
						>
							{buttonState.icon}
						</Button>

						{/* Pulse animation for active states */}
						{buttonState.pulse && (
							<span className="absolute inset-0 rounded-md animate-ping opacity-75 bg-current pointer-events-none" />
						)}

						{/* Audio level indicator */}
						{voice.isEnabled && !voice.isTranscribing && (
							<div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-muted rounded-full overflow-hidden">
								<div
									className="h-full bg-primary transition-all duration-100"
									style={{
										width: `${Math.min((voice.audioLevel / 255) * 100, 100)}%`,
									}}
								/>
							</div>
						)}
					</div>
				</TooltipTrigger>
				<TooltipContent>
					<p>{buttonState.tooltip}</p>
					{voice.error && <p className="text-xs text-destructive mt-1">{voice.error}</p>}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
});
