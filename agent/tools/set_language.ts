import { eq } from "drizzle-orm";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { db, users } from "@/db";
import { DEFAULT_LANGUAGE, languageCodes, languages } from "@/watch.ts";
import { checkTelegramAuth } from "./print_info.ts";

const inputSchema = z.object({
	language: z
		.enum(languageCodes)
		.describe(
			"Preferred language code, e.g. en-IN, hi-IN, ta-IN. Use this when the user asks to change language.",
		),
});

export default defineTool({
	description:
		"Set the current Telegram user's preferred language for Watch Bot replies and update translations. Use this whenever the user asks to change/switch language, in any language.",
	inputSchema,
	async execute({ language }, ctx) {
		const id = checkTelegramAuth(ctx.session.auth.current);

		await db
			.insert(users)
			.values({ id, language })
			.onConflictDoUpdate({
				target: users.id,
				set: { language, updatedAt: new Date() },
			});

		const lang = languages[language] ?? languages[DEFAULT_LANGUAGE];
		return { ok: true, language, name: lang.name, nativeName: lang.nativeName };
	},
	toModelOutput: (out) => ({
		type: "text",
		value: out.ok
			? `Language set to ${out.name} (${out.nativeName}, ${out.language}).`
			: "Unable to set language.",
	}),
});
