import { eq } from "drizzle-orm";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { db, users } from "@/db";
import { formatProfile } from "@/lib/subscriptions.ts";
import { checkTelegramAuth } from "./print_info.ts";

export default defineTool({
	description:
		"Get the current Telegram user's Watch Bot profile: preferred language and active subscriptions. Use when the user asks for their profile/settings/subscriptions/language, in any language.",
	inputSchema: z.object({}),
	async execute(_, ctx) {
		const id = checkTelegramAuth(ctx.session.auth.current);
		const [user] = await db.select().from(users).where(eq(users.id, id));
		return { profile: formatProfile(user ?? { id, language: "en-IN", subscriptions: [] }) };
	},
	toModelOutput: (out) => ({
		type: "text",
		value: out.profile,
	}),
});
