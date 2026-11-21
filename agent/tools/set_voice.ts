import { eq } from "drizzle-orm";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { db, users } from "@/db";
import { checkTelegramAuth } from "./print_info.ts";

const inputSchema = z.object({
	enabled: z
		.boolean()
		.describe(
			"Whether to send government updates as voice audio files. true enables voice, false disables it.",
		),
});

export default defineTool({
	description:
		"Set the current Telegram user's voice update preference. When enabled, Watch Bot sends update audio and the source link as text. Use when the user asks to enable/disable voice/audio updates in any language.",
	inputSchema,
	async execute({ enabled }, ctx) {
		const id = checkTelegramAuth(ctx.session.auth.current);

		await db
			.insert(users)
			.values({ id, voice: enabled })
			.onConflictDoUpdate({
				target: users.id,
				set: { voice: enabled, updatedAt: new Date() },
			});

		return { ok: true, enabled };
	},
	toModelOutput: (out) => ({
		type: "text",
		value: out.ok
			? out.enabled
				? "Voice updates enabled."
				: "Voice updates disabled."
			: "Unable to set voice preference.",
	}),
});
