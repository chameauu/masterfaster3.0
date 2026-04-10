/**
 * Voice Assistant Page
 *
 * 100% voice-controlled interface for visually impaired users.
 * Server Component that renders the client-side voice interface.
 */

import { VoicePageClient } from "./voice-page-client";

export default function VoicePage() {
	return <VoicePageClient />;
}

export const metadata = {
	title: "Voice Assistant - SurfSense",
	description: "Voice-controlled research assistant for visually impaired users",
};
