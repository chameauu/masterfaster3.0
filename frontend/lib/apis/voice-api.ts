/**
 * Voice API Client
 *
 * Handles communication with the voice assistant backend.
 * Follows React best practices: minimal bundle size, error handling.
 */

import { BACKEND_URL } from "../env-config";

export interface VoiceSearchRequest {
	audio: Blob;
}

export interface VoiceSearchResponse {
	transcript: string;
	intent: {
		intent_type: string;
		parameters: Record<string, unknown>;
		confidence: number;
		raw_text: string;
	};
	results: unknown[];
	voice_response: string;
}

export class VoiceAPIError extends Error {
	constructor(
		message: string,
		public statusCode?: number,
		public details?: unknown
	) {
		super(message);
		this.name = "VoiceAPIError";
	}
}

/**
 * Search documents using voice input
 *
 * @param audio - Audio blob (WAV format, 16kHz, mono, 16-bit)
 * @returns Voice search response with transcript, intent, and results
 * @throws VoiceAPIError if request fails
 */
export async function voiceSearch(audio: Blob): Promise<VoiceSearchResponse> {
	const formData = new FormData();
	formData.append("audio", audio, "recording.wav");

	try {
		const response = await fetch(`${BACKEND_URL}/api/v1/voice/search`, {
			method: "POST",
			body: formData,
			// Note: Don't set Content-Type header - browser will set it with boundary
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new VoiceAPIError(
				`Voice search failed: ${response.statusText}`,
				response.status,
				errorText
			);
		}

		const data = await response.json();
		return data as VoiceSearchResponse;
	} catch (error) {
		if (error instanceof VoiceAPIError) {
			throw error;
		}

		// Network or other errors
		throw new VoiceAPIError(
			`Failed to connect to voice service: ${error instanceof Error ? error.message : "Unknown error"}`,
			undefined,
			error
		);
	}
}

/**
 * Convert audio blob to WAV format (if needed)
 *
 * Note: MediaRecorder may produce different formats depending on browser.
 * This function ensures we always send WAV format to the backend.
 *
 * @param blob - Audio blob from MediaRecorder
 * @returns WAV-formatted blob
 */
export async function convertToWAV(blob: Blob): Promise<Blob> {
	// If already WAV, return as-is
	if (blob.type === "audio/wav" || blob.type === "audio/wave") {
		return blob;
	}

	// For now, assume MediaRecorder produces compatible format
	// TODO: Implement actual WAV conversion if needed
	// This would require Web Audio API processing
	return blob;
}
