"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Homepage disabled - redirects directly to dashboard
 *
 * TEMPORARY: Auth disabled for development
 * Always redirects to dashboard (no login check)
 *
 * Original homepage components preserved in components/homepage/
 * To re-enable: restore the original imports and JSX
 */
export default function HomePage() {
	const router = useRouter();

	useEffect(() => {
		// TEMPORARY: Auth disabled - always go to dashboard
		router.replace("/dashboard");
	}, [router]);

	// Show minimal loading state during redirect
	return (
		<main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 text-gray-900 dark:from-black dark:to-gray-900 dark:text-white">
			<div className="text-center">
				<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
				<p className="mt-4 text-sm text-muted-foreground">Redirecting to dashboard...</p>
			</div>
		</main>
	);
}
