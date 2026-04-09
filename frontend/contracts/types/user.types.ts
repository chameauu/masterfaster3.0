import { z } from "zod";

// TEMPORARY: Relaxed validation for development (auth disabled)
// TODO: Re-enable strict validation when auth is re-enabled
export const user = z.object({
	id: z.string(), // Relaxed from z.uuid() for dev
	email: z.string(), // Relaxed from z.email() for dev
	is_active: z.boolean(),
	is_superuser: z.boolean(),
	is_verified: z.boolean(),
	pages_limit: z.number(),
	pages_used: z.number(),
	display_name: z.string().nullish(),
	avatar_url: z.string().nullish(),
});

// Original strict schema (commented out for development):
// export const user = z.object({
// 	id: z.uuid(),
// 	email: z.email(),
// 	is_active: z.boolean(),
// 	is_superuser: z.boolean(),
// 	is_verified: z.boolean(),
// 	pages_limit: z.number(),
// 	pages_used: z.number(),
// 	display_name: z.string().nullish(),
// 	avatar_url: z.string().nullish(),
// });

/**
 * Get current user
 */
export const getMeResponse = user;

/**
 * Update current user request
 */
export const updateUserRequest = z.object({
	display_name: z.string().nullish(),
	avatar_url: z.string().nullish(),
});

/**
 * Update current user response
 */
export const updateUserResponse = user;

export type User = z.infer<typeof user>;
export type GetMeResponse = z.infer<typeof getMeResponse>;
export type UpdateUserRequest = z.infer<typeof updateUserRequest>;
export type UpdateUserResponse = z.infer<typeof updateUserResponse>;
