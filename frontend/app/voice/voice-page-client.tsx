"use client";

/**
 * Voice Page Client Component
 *
 * Client-side wrapper for voice interface with dynamic loading.
 * Following bundle optimization best practices:
 * - bundle-dynamic-imports: Use next/dynamic for heavy components
 */

import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// Use next/dynamic for heavy components (bundle-dynamic-imports)
const VoiceInterface = dynamic(
	() =>
		import("@/components/voice/VoiceInterface").then((mod) => ({ default: mod.VoiceInterface })),
	{
		ssr: false, // Client-only (uses MediaRecorder API)
		loading: () => (
			<div className="flex items-center justify-center min-h-screen">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="size-8 animate-spin text-muted-foreground" />
					<p className="text-muted-foreground">Loading voice assistant...</p>
				</div>
			</div>
		),
	}
);

export function VoicePageClient() {
	return (
		<main className="min-h-screen bg-background">
			<VoiceInterface />
		</main>
	);
}
