"use client";

/**
 * Voice Demo Page
 *
 * Simple demo page to test voice widget integration.
 * This is a temporary page for testing before dashboard integration.
 */

import { VoiceWidget } from "@/components/voice/voice-widget";

export default function VoiceDemoPage() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
			<div className="text-center space-y-2">
				<h1 className="text-3xl font-bold">Voice Widget Demo</h1>
				<p className="text-muted-foreground">Testing Pipecat WebRTC integration</p>
			</div>

			<VoiceWidget wsUrl="ws://localhost:8000/api/v1/pipecat/ws" autoConnect={false} />

			<div className="max-w-2xl space-y-4 text-sm text-muted-foreground">
				<div>
					<h3 className="font-semibold mb-2">How to test:</h3>
					<ol className="list-decimal list-inside space-y-1">
						<li>
							Make sure backend is running:{" "}
							<code className="bg-muted px-1 rounded">uv run python -m app.app</code>
						</li>
						<li>Click the microphone button to start</li>
						<li>Speak into your microphone</li>
						<li>Audio will stream to Pipecat backend</li>
						<li>Backend will process and respond (TTS playback coming in Day 15-16)</li>
					</ol>
				</div>

				<div>
					<h3 className="font-semibold mb-2">Status indicators:</h3>
					<ul className="list-disc list-inside space-y-1">
						<li>
							<span className="inline-block size-2 rounded-full bg-gray-500 mr-1" /> Gray:
							Disconnected
						</li>
						<li>
							<span className="inline-block size-2 rounded-full bg-yellow-500 mr-1" /> Yellow:
							Connecting
						</li>
						<li>
							<span className="inline-block size-2 rounded-full bg-green-500 mr-1" /> Green:
							Connected
						</li>
						<li>
							<span className="inline-block size-2 rounded-full bg-red-500 mr-1" /> Red: Error
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
