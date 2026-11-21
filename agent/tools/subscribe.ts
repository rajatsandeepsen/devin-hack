import { eq } from "drizzle-orm";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { categoryKeys } from "@/watch.ts";
import { db, users } from "@/db";
import { ensureCategoryMonitor } from "@/lib/exa.ts";
import { mergeSubscriptions } from "@/lib/merge.ts";
import { checkTelegramAuth } from "./print_info.ts";

const inputSchema = z.object({
	category: z.enum(["all", ...categoryKeys]).describe(
		"Government update category to subscribe to. Use 'all' for every category.",
	),
});

export default defineTool({
	description:
		"Subscribe the current Telegram user to Watch Bot government update categories. Use this when the user wants alerts/updates for agriculture, weather, subsidies/welfare, jobs, education, health, business/MSME, finance/tax, transport, or demo - even if they ask in a non-English language.",
	inputSchema,
	async execute({ category }, ctx) {
		const id = checkTelegramAuth(ctx.session.auth.current);

		const [existing] = await db
			.select({ subscriptions: users.subscriptions })
			.from(users)
			.where(eq(users.id, id));

		const subscriptions = mergeSubscriptions(existing?.subscriptions ?? [], {
			category,
		});

		const toEnsure = category === "all" ? categoryKeys : [category];
		for (const key of toEnsure) {
			try {
				await ensureCategoryMonitor(key);
			} catch (e) {
				console.error("Failed to ensure monitor", key, e);
			}
		}

		await db
			.insert(users)
			.values({ id, subscriptions })
			.onConflictDoUpdate({
				target: users.id,
				set: { subscriptions, updatedAt: new Date() },
			});

		return { subscribed: true, category, subscriptions };
	},
	toModelOutput: (out) => ({
		type: "text",
		value: out.subscribed
			? `Subscribed. Active categories: ${out.subscriptions.join(", ") || "none"}`
			: "Unable to subscribe.",
	}),
});
