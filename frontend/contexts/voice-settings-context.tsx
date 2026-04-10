"use client";

/**
 * Voice Settings Context
 *
 * Global context for managing voice settings across the application.
 * Persists settings to localStorage for user preferences.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface VoiceSettingsState {
	// Speech Recognition (STT) Settings
	sttLanguage: string;
	sttPhrases: string[];

	// Text-to-Speech (TTS) Settings
	ttsLanguage: string;
	ttsVoiceName: string;
	ttsRate: number;
	ttsPitch: number;
	ttsVolume: number;

	// VAD Settings
	vadThreshold: number;
	vadSilenceDuration: number;
}

export interface VoiceSettingsContextValue extends VoiceSettingsState {
	updateSettings: (settings: Partial<VoiceSettingsState>) => void;
	resetSettings: () => void;
}

const DEFAULT_SETTINGS: VoiceSettingsState = {
	// STT defaults
	sttLanguage: "en-US",
	sttPhrases: [
		"SurfSense",
		"search my notes",
		"summarize document",
		"create quiz",
		"knowledge base",
	],

	// TTS defaults
	ttsLanguage: "en-US",
	ttsVoiceName: "",
	ttsRate: 1.0,
	ttsPitch: 1.0,
	ttsVolume: 1.0,

	// VAD defaults
	vadThreshold: 30,
	vadSilenceDuration: 1500,
};

const STORAGE_KEY = "surfsense-voice-settings";

const VoiceSettingsContext = createContext<VoiceSettingsContextValue | undefined>(undefined);

export function VoiceSettingsProvider({ children }: { children: ReactNode }) {
	const [settings, setSettings] = useState<VoiceSettingsState>(DEFAULT_SETTINGS);

	// Load settings from localStorage on mount
	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				setSettings({ ...DEFAULT_SETTINGS, ...parsed });
			}
		} catch (error) {
			console.error("[VoiceSettings] Failed to load settings:", error);
		}
	}, []);

	// Save settings to localStorage when they change
	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
		} catch (error) {
			console.error("[VoiceSettings] Failed to save settings:", error);
		}
	}, [settings]);

	const updateSettings = (updates: Partial<VoiceSettingsState>) => {
		setSettings((prev) => ({ ...prev, ...updates }));
	};

	const resetSettings = () => {
		setSettings(DEFAULT_SETTINGS);
		localStorage.removeItem(STORAGE_KEY);
	};

	return (
		<VoiceSettingsContext.Provider
			value={{
				...settings,
				updateSettings,
				resetSettings,
			}}
		>
			{children}
		</VoiceSettingsContext.Provider>
	);
}

export function useVoiceSettings() {
	const context = useContext(VoiceSettingsContext);
	if (!context) {
		throw new Error("useVoiceSettings must be used within VoiceSettingsProvider");
	}
	return context;
}
