import { eq } from "drizzle-orm";
import { defaultTelegramAuth, telegramChannel } from "eve/channels/telegram";
import { db, users } from "@/db";
import {
	formatProfile,
	formatSubscriptions,
	getCategoryKeyboard,
	getLanguageKeyboard,
} from "@/lib/subscriptions.ts";
import {
	type CategoryKey,
	categories,
	categoryKeys,
	isCategoryKey,
	isLanguageCode,
	type LanguageCode,
	languages,
} from "@/watch.ts";

async function ensureUser(id: string) {
	await db
		.insert(users)
		.values({ id })
		.onConflictDoNothing({ target: users.id });
}

export default telegramChannel({
	botUsername: "watch_india_bot",
	credentials: {
		botToken: process.env.TELEGRAM_BOT_TOKEN,
		webhookSecretToken: process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN,
	},
	onMessage: async (ctx, message) => {
		if (message.chat.type !== "private" || !message.from || message.from.isBot)
			return null;

		await ctx.telegram.startTyping();
		const userId = String(message.from.id);
		await ensureUser(userId);

		const text = message.text?.trim() ?? "";
		if (!text.startsWith("/")) {
			return { auth: defaultTelegramAuth(message) };
		}

		const [command] = text.split(/\s+/);

		switch (command) {
			case "/start": {
				await ctx.telegram.sendMessage({
					text: "Welcome to Watch Bot. Choose your preferred language:",
					reply_markup: { inline_keyboard: getLanguageKeyboard() },
				});
				return null;
			}
			case "/language": {
				await ctx.telegram.sendMessage({
					text: "Choose your preferred language:",
					reply_markup: { inline_keyboard: getLanguageKeyboard() },
				});
				return null;
			}
			case "/subscribe": {
				const [user] = await db
					.select({ subscriptions: users.subscriptions })
					.from(users)
					.where(eq(users.id, userId));
				await ctx.telegram.sendMessage({
					text: "Select the government update categories you want. Tap to toggle, then press Done.",
					reply_markup: {
						inline_keyboard: getCategoryKeyboard(user?.subscriptions ?? []),
					},
				});
				return null;
			}
			case "/subscriptions": {
				const [user] = await db
					.select({ subscriptions: users.subscriptions })
					.from(users)
					.where(eq(users.id, userId));
				await ctx.telegram.sendMessage(
					formatSubscriptions(user?.subscriptions ?? []),
				);
				return null;
			}
			case "/unsubscribe": {
				await db
					.insert(users)
					.values({ id: userId, subscriptions: [] })
					.onConflictDoUpdate({
						target: users.id,
						set: { subscriptions: [], updatedAt: new Date() },
					});
				await ctx.telegram.sendMessage(
					"You have been unsubscribed from all Watch Bot updates.",
				);
				return null;
			}
			case "/me": {
				const [user] = await db
					.select()
					.from(users)
					.where(eq(users.id, userId));
				await ctx.telegram.sendMessage(formatProfile(user));
				return null;
			}
			case "/categories": {
				const lines = Object.entries(categories).map(
					([, cat]) => `${cat.icon} ${cat.name} - ${cat.description}`,
				);
				await ctx.telegram.sendMessage(lines.join("\n"));
				return null;
			}
			default:
				return { auth: defaultTelegramAuth(message) };
		}
	},
	async onCallbackQuery(ctx, query) {
		await ctx.telegram.answerCallbackQuery({ callbackQueryId: query.id });
		if (!query.data || !query.from) return;

		const userId = String(query.from.id);
		await ensureUser(userId);
		const [kind, value] = query.data.split(":");

		if (kind === "lang" && value && isLanguageCode(value)) {
			const lang = value as LanguageCode;
			await db
				.insert(users)
				.values({ id: userId, language: lang })
				.onConflictDoUpdate({
					target: users.id,
					set: { language: lang, updatedAt: new Date() },
				});
			await ctx.telegram.sendMessage(
				`Language set to ${languages[lang].nativeName} (${lang}). Now use /subscribe to pick update categories.`,
			);
			return;
		}

		if (kind === "sub" && value) {
			if (value === "done") {
				const [user] = await db
					.select({ subscriptions: users.subscriptions })
					.from(users)
					.where(eq(users.id, userId));
				await ctx.telegram.sendMessage(
					formatSubscriptions(user?.subscriptions ?? []),
				);
				return;
			}

			if (!isCategoryKey(value)) return;
			const category = value as CategoryKey;
			const [user] = await db
				.select({ subscriptions: users.subscriptions })
				.from(users)
				.where(eq(users.id, userId));

			const current = new Set(
				(user?.subscriptions ?? []).filter((s): s is CategoryKey =>
					categoryKeys.includes(s as CategoryKey),
				),
			);
			if (current.has(category)) current.delete(category);
			else current.add(category);

			const subscriptions = [...current];
			await db
				.insert(users)
				.values({ id: userId, subscriptions })
				.onConflictDoUpdate({
					target: users.id,
					set: { subscriptions, updatedAt: new Date() },
				});

			await ctx.telegram.sendMessage({
				text: `Updated subscriptions. Tap to toggle more, or press Done.`,
				reply_markup: { inline_keyboard: getCategoryKeyboard(subscriptions) },
			});
			return;
		}
	},
});
