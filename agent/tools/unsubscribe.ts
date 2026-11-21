import { eq } from "drizzle-orm";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { categoryKeys } from "@/watch.ts";
import { db, users } from "@/db";
import { unmergeSubscriptions } from "@/lib/unmerge.ts";
import { checkTelegramAuth } from "./print_info.ts";

const inputSchema = z.object({
	category: z.enum(["all", ...categoryKeys]).describe(
		"Government update category to unsubscribe from. Use 'all' to remove every category.",
	),
});

export default defineTool({
	description:
		"Unsubscribe the current Telegram user from Watch Bot government update categories.",
	inputSchema,
	async execute({ category }, ctx) {
		const id = checkTelegramAuth(ctx.session.auth.current);

		const [existing] = await db
			.select({ subscriptions: users.subscriptions })
			.from(users)
			.where(eq(users.id, id));

		const subscriptions = unmergeSubscriptions(existing?.subscriptions ?? [], {
			category,
		});

		await db
			.insert(users)
			.values({ id, subscriptions })
			.onConflictDoUpdate({
				target: users.id,
				set: { subscriptions, updatedAt: new Date() },
			});

		return { unsubscribed: true, category, subscriptions };
	},
	toModelOutput: (out) => ({
		type: "text",
		value: out.unsubscribed
			? `Unsubscribed. Active categories: ${out.subscriptions.join(", ") || "none"}`
			: "Unable to unsubscribe.",
	}),
});
