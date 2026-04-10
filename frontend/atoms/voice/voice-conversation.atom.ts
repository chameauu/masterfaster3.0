"use client";

import { atom } from "jotai";

export interface VoiceMessage {
	id: string;
	role: "user" | "assistant";
	transcript: string;
	timestamp: Date;
	intent?: {
		intent_type: string;
		parameters: Record<string, unknown>;
		confidence: number;
	};
	results?: unknown[];
	voiceResponse?: string;
}

export interface VoiceConversation {
	sessionId: string;
	messages: VoiceMessage[];
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Voice conversation history atom.
 * Stores all messages in the current voice session.
 */
export const voiceConversationAtom = atom<VoiceConversation | null>(null);

/**
 * Derived atom: Get latest message
 */
export const latestVoiceMessageAtom = atom((get) => {
	const conversation = get(voiceConversationAtom);
	if (!conversation || conversation.messages.length === 0) return null;
	return conversation.messages[conversation.messages.length - 1];
});

/**
 * Derived atom: Get message count
 */
export const voiceMessageCountAtom = atom(
	(get) => get(voiceConversationAtom)?.messages.length ?? 0
);
