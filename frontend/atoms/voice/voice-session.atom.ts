"use client";

import { atom } from "jotai";

export type VoiceSessionStatus = "idle" | "recording" | "processing" | "playing" | "error";

export interface VoiceSession {
  id: string;
  userId: string;
  status: VoiceSessionStatus;
  startedAt: Date;
  error?: string;
}

/**
 * Global voice session state atom.
 * Tracks the current voice interaction session.
 */
export const voiceSessionAtom = atom<VoiceSession | null>(null);

/**
 * Derived atom: Is currently recording?
 * (rerender-derived-state: Subscribe to derived booleans, not raw values)
 */
export const isRecordingAtom = atom(
  (get) => get(voiceSessionAtom)?.status === "recording"
);

/**
 * Derived atom: Is currently processing?
 */
export const isProcessingAtom = atom(
  (get) => get(voiceSessionAtom)?.status === "processing"
);

/**
 * Derived atom: Is currently playing audio?
 */
export const isPlayingAtom = atom(
  (get) => get(voiceSessionAtom)?.status === "playing"
);

/**
 * Derived atom: Has error?
 */
export const hasErrorAtom = atom(
  (get) => get(voiceSessionAtom)?.status === "error"
);
