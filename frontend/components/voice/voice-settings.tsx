"use client";

/**
 * Voice Settings Component
 *
 * Settings panel for configuring voice input (STT) and text-to-speech (TTS).
 * Allows users to select language, voice, and adjust quality settings.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

// Supported languages with BCP-47 codes
const LANGUAGES = [
	{ code: "en-US", name: "English (US)" },
	{ code: "en-GB", name: "English (UK)" },
	{ code: "es-ES", name: "Spanish (Spain)" },
	{ code: "es-MX", name: "Spanish (Mexico)" },
	{ code: "fr-FR", name: "French (France)" },
	{ code: "de-DE", name: "German (Germany)" },
	{ code: "it-IT", name: "Italian (Italy)" },
	{ code: "pt-BR", name: "Portuguese (Brazil)" },
	{ code: "ja-JP", name: "Japanese (Japan)" },
	{ code: "ko-KR", name: "Korean (Korea)" },
	{ code: "zh-CN", name: "Chinese (Simplified)" },
	{ code: "zh-TW", name: "Chinese (Traditional)" },
	{ code: "ar-SA", name: "Arabic (Saudi Arabia)" },
	{ code: "hi-IN", name: "Hindi (India)" },
	{ code: "ru-RU", name: "Russian (Russia)" },
	{ code: "nl-NL", name: "Dutch (Netherlands)" },
	{ code: "pl-PL", name: "Polish (Poland)" },
	{ code: "tr-TR", name: "Turkish (Turkey)" },
];

export interface VoiceSettingsProps {
	/** Current language */
	language?: string;
	/** Current voice name */
	voiceName?: string;
	/** Current speech rate */
	rate?: number;
	/** Current speech pitch */
	pitch?: number;
	/** Current speech volume */
	volume?: number;
	/** Called when settings change */
	onChange?: (settings: VoiceSettings) => void;
}

export interface VoiceSettings {
	language: string;
	voiceName: string;
	rate: number;
	pitch: number;
	volume: number;
}

export function VoiceSettings({
	language: initialLanguage = "en-US",
	voiceName: initialVoiceName = "",
	rate: initialRate = 1.0,
	pitch: initialPitch = 1.0,
	volume: initialVolume = 1.0,
	onChange,
}: VoiceSettingsProps) {
	const [language, setLanguage] = useState(initialLanguage);
	const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
	const [selectedVoice, setSelectedVoice] = useState(initialVoiceName);
	const [rate, setRate] = useState(initialRate);
	const [pitch, setPitch] = useState(initialPitch);
	const [volume, setVolume] = useState(initialVolume);

	// Load available voices
	useEffect(() => {
		const loadVoices = () => {
			const availableVoices = window.speechSynthesis.getVoices();
			setVoices(availableVoices);

			// Auto-select first voice for language if none selected
			if (!selectedVoice && availableVoices.length > 0) {
				const defaultVoice = availableVoices.find(
					(v) => v.lang === language && v.localService
				) || availableVoices.find((v) => v.lang === language);
				if (defaultVoice) {
					setSelectedVoice(defaultVoice.name);
				}
			}
		};

		loadVoices();
		if (window.speechSynthesis.onvoiceschanged !== undefined) {
			window.speechSynthesis.onvoiceschanged = loadVoices;
		}

		return () => {
			if (window.speechSynthesis.onvoiceschanged !== undefined) {
				window.speechSynthesis.onvoiceschanged = null;
			}
		};
	}, [language, selectedVoice]);

	// Filter voices by selected language
	const filteredVoices = voices.filter((v) => v.lang === language);

	// Notify parent of changes (only when values actually change)
	const prevValuesRef = useRef({ language, voiceName: selectedVoice, rate, pitch, volume });
	
	useEffect(() => {
		const prev = prevValuesRef.current;
		const hasChanged = 
			prev.language !== language ||
			prev.voiceName !== selectedVoice ||
			prev.rate !== rate ||
			prev.pitch !== pitch ||
			prev.volume !== volume;
		
		if (hasChanged && onChange) {
			onChange({
				language,
				voiceName: selectedVoice,
				rate,
				pitch,
				volume,
			});
			prevValuesRef.current = { language, voiceName: selectedVoice, rate, pitch, volume };
		}
	}, [language, selectedVoice, rate, pitch, volume, onChange]);

	// Test voice with current settings
	const testVoice = () => {
		const utterance = new SpeechSynthesisUtterance(
			"This is a test of the voice settings."
		);
		utterance.lang = language;
		utterance.rate = rate;
		utterance.pitch = pitch;
		utterance.volume = volume;

		const voice = voices.find((v) => v.name === selectedVoice);
		if (voice) {
			utterance.voice = voice;
		}

		window.speechSynthesis.cancel();
		window.speechSynthesis.speak(utterance);
	};

	return (
		<div className="space-y-6 p-4">
			{/* Language Selection */}
			<div className="space-y-2">
				<Label htmlFor="language">Language</Label>
				<Select value={language} onValueChange={setLanguage}>
					<SelectTrigger id="language">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{LANGUAGES.map((lang) => (
							<SelectItem key={lang.code} value={lang.code}>
								{lang.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<p className="text-xs text-muted-foreground">
					Language for both speech recognition and text-to-speech
				</p>
			</div>

			<Separator />

			{/* Voice Selection */}
			<div className="space-y-2">
				<Label htmlFor="voice">Voice</Label>
				<Select value={selectedVoice} onValueChange={setSelectedVoice}>
					<SelectTrigger id="voice">
						<SelectValue placeholder="Select voice" />
					</SelectTrigger>
					<SelectContent>
						{filteredVoices.length > 0 ? (
							filteredVoices.map((voice) => (
								<SelectItem key={voice.name} value={voice.name}>
									{voice.name}{" "}
									{voice.localService ? "(Local)" : "(Remote)"}
								</SelectItem>
							))
						) : (
							<SelectItem value="none" disabled>
								No voices available for this language
							</SelectItem>
						)}
					</SelectContent>
				</Select>
				<p className="text-xs text-muted-foreground">
					Local voices provide better quality and privacy
				</p>
			</div>

			<Separator />

			{/* Speed Control */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Label htmlFor="rate">Speed</Label>
					<span className="text-sm text-muted-foreground">
						{rate.toFixed(1)}x
					</span>
				</div>
				<Slider
					id="rate"
					value={[rate]}
					onValueChange={([v]) => setRate(v)}
					min={0.5}
					max={2.0}
					step={0.1}
					className="w-full"
				/>
				<p className="text-xs text-muted-foreground">
					Adjust speech speed (0.5x - 2.0x)
				</p>
			</div>

			{/* Pitch Control */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Label htmlFor="pitch">Pitch</Label>
					<span className="text-sm text-muted-foreground">
						{pitch.toFixed(1)}
					</span>
				</div>
				<Slider
					id="pitch"
					value={[pitch]}
					onValueChange={([v]) => setPitch(v)}
					min={0.5}
					max={2.0}
					step={0.1}
					className="w-full"
				/>
				<p className="text-xs text-muted-foreground">
					Adjust voice pitch (0.5 - 2.0)
				</p>
			</div>

			{/* Volume Control */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Label htmlFor="volume">Volume</Label>
					<span className="text-sm text-muted-foreground">
						{Math.round(volume * 100)}%
					</span>
				</div>
				<Slider
					id="volume"
					value={[volume]}
					onValueChange={([v]) => setVolume(v)}
					min={0}
					max={1}
					step={0.1}
					className="w-full"
				/>
				<p className="text-xs text-muted-foreground">
					Adjust speech volume (0% - 100%)
				</p>
			</div>

			<Separator />

			{/* Test Button */}
			<Button onClick={testVoice} className="w-full">
				Test Voice
			</Button>
		</div>
	);
}
