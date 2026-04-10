"use client";

/**
 * Voice Demo Page
 *
 * Demo page to test complete voice widget with Pipecat integration.
 * Tests WebRTC client + audio capture + audio playback.
 */

import { VoiceWidget } from "@/components/voice/voice-widget";

export default function VoiceDemoPage() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
			<div className="text-center space-y-2">
				<h1 className="text-3xl font-bold">Voice Widget Demo</h1>
				<p className="text-muted-foreground">
					Complete Pipecat WebRTC integration with audio playback
				</p>
			</div>

			<VoiceWidget
				wsUrl="ws://localhost:8000/api/v1/pipecat/ws"
				autoConnect={false}
				showVolumeControls={true}
			/>

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
						<li>Audio streams to Pipecat backend (WebRTC)</li>
						<li>Backend processes with Silero VAD + Faster-Whisper STT</li>
						<li>Backend responds with Piper TTS</li>
						<li>Response plays automatically in browser</li>
						<li>Adjust volume with slider</li>
					</ol>
				</div>

				<div>
					<h3 className="font-semibold mb-2">Features:</h3>
					<ul className="list-disc list-inside space-y-1">
						<li>WebRTC connection to Pipecat backend</li>
						<li>Real-time audio capture (16kHz mono)</li>
						<li>Audio level visualization</li>
						<li>TTS audio playback</li>
						<li>Volume control (0-100%)</li>
						<li>Connection status indicators</li>
						<li>Error handling</li>
					</ul>
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
