"use client";

/**
 * TTS Toggle Component
 *
 * Toggle button for Text-to-Speech functionality.
 * Reads AI responses aloud for visually impaired users.
 *
 * Following React best practices:
 * - rendering-hoist-jsx: Static icons hoisted
 * - rerender-memo: Memoized for performance
 */

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Hoist static JSX (rendering-hoist-jsx)
const VOLUME_ICON = <Volume2 className="size-5" />;
const VOLUME_OFF_ICON = <VolumeX className="size-5" />;
const PAUSE_ICON = <Pause className="size-5" />;
const PLAY_ICON = <Play className="size-5" />;

interface TTSToggleProps {
	/** Is TTS enabled? */
	isEnabled: boolean;
	/** Is currently speaking? */
	isSpeaking: boolean;
	/** Is currently paused? */
	isPaused: boolean;
	/** Toggle TTS on/off */
	onToggle: () => void;
	/** Pause/resume speech */
	onPauseResume: () => void;
	/** Stop speech */
	onStop: () => void;
	/** Optional className for styling */
	className?: string;
}

export const TTSToggle = memo(function TTSToggle({
	isEnabled,
	isSpeaking,
	isPaused,
	onToggle,
	onPauseResume,
	onStop,
	className,
}: TTSToggleProps) {
	// Determine button state and appearance
	const getButtonState = () => {
		if (!isEnabled) {
			return {
				icon: VOLUME_OFF_ICON,
				variant: "ghost" as const,
				tooltip: "Enable text-to-speech",
				onClick: onToggle,
			};
		}

		if (isSpeaking && !isPaused) {
			return {
				icon: PAUSE_ICON,
				variant: "default" as const,
				tooltip: "Pause speech",
				onClick: onPauseResume,
			};
		}

		if (isSpeaking && isPaused) {
			return {
				icon: PLAY_ICON,
				variant: "default" as const,
				tooltip: "Resume speech",
				onClick: onPauseResume,
			};
		}

		return {
			icon: VOLUME_ICON,
			variant: "secondary" as const,
			tooltip: "Text-to-speech enabled (Click to disable)",
			onClick: onToggle,
		};
	};

	const buttonState = getButtonState();

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<div className="relative flex gap-1">
						<Button
							variant={buttonState.variant}
							size="icon"
							onClick={buttonState.onClick}
							className={className}
							aria-label={buttonState.tooltip}
						>
							{buttonState.icon}
						</Button>

						{/* Stop button (only show when speaking) */}
						{isSpeaking && (
							<Button
								variant="ghost"
								size="icon"
								onClick={onStop}
								className="size-8"
								aria-label="Stop speech"
							>
								<VolumeX className="size-4" />
							</Button>
						)}
					</div>
				</TooltipTrigger>
				<TooltipContent>
					<p>{buttonState.tooltip}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
});
