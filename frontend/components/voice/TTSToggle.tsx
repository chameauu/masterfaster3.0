"use client";

/**
 * TTS Toggle Component
 *
 * Toggle button for Text-to-Speech functionality with settings.
 * Reads AI responses aloud for visually impaired users.
 *
 * Following React best practices:
 * - rendering-hoist-jsx: Static icons hoisted
 * - rerender-memo: Memoized for performance
 */

import { Pause, Play, Settings, Volume2, VolumeX } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { VoiceSettings } from "./voice-settings";
import { useVoiceSettings } from "@/contexts/voice-settings-context";

// Hoist static JSX (rendering-hoist-jsx)
const VOLUME_ICON = <Volume2 className="size-5" />;
const VOLUME_OFF_ICON = <VolumeX className="size-5" />;
const PAUSE_ICON = <Pause className="size-5" />;
const PLAY_ICON = <Play className="size-5" />;
const SETTINGS_ICON = <Settings className="size-4" />;

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
	const voiceSettings = useVoiceSettings();
	const [settingsOpen, setSettingsOpen] = useState(false);

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
			<div className="relative flex gap-1">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant={buttonState.variant}
							size="icon"
							onClick={buttonState.onClick}
							className={className}
							aria-label={buttonState.tooltip}
						>
							{buttonState.icon}
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>{buttonState.tooltip}</p>
					</TooltipContent>
				</Tooltip>

				{/* Stop button (only show when speaking) */}
				{isSpeaking && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								onClick={onStop}
								className="size-8"
								aria-label="Stop speech"
							>
								<VolumeX className="size-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Stop speech</p>
						</TooltipContent>
					</Tooltip>
				)}

				{/* Settings button */}
				<Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
					<Tooltip>
						<TooltipTrigger asChild>
							<PopoverTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="size-8"
									aria-label="Voice settings"
								>
									{SETTINGS_ICON}
								</Button>
							</PopoverTrigger>
						</TooltipTrigger>
						<TooltipContent>
							<p>Voice settings</p>
						</TooltipContent>
					</Tooltip>
					<PopoverContent className="w-80" align="end">
						<div className="space-y-2">
							<h4 className="font-medium leading-none">Voice Settings</h4>
							<p className="text-sm text-muted-foreground">
								Configure language, voice, and quality
							</p>
						</div>
						<VoiceSettings
							language={voiceSettings.ttsLanguage}
							voiceName={voiceSettings.ttsVoiceName}
							rate={voiceSettings.ttsRate}
							pitch={voiceSettings.ttsPitch}
							volume={voiceSettings.ttsVolume}
							onChange={useCallback((settings) => {
								voiceSettings.updateSettings({
									ttsLanguage: settings.language,
									ttsVoiceName: settings.voiceName,
									ttsRate: settings.rate,
									ttsPitch: settings.pitch,
									ttsVolume: settings.volume,
									// Also update STT language to match
									sttLanguage: settings.language,
								});
							}, [voiceSettings])}
						/>
					</PopoverContent>
				</Popover>
			</div>
		</TooltipProvider>
	);
});
