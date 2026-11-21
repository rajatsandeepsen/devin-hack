import { eq } from "drizzle-orm";
import { defaultTelegramAuth, telegramChannel } from "eve/channels/telegram";
import { db, monitors, users } from "@/db";
import { ensureCategoryMonitor } from "@/lib/exa.ts";
import {
	formatProfile,
	formatSubscriptions,
	getCategoryKeyboard,
	getLanguageKeyboard,
	getVoiceKeyboard,
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

		const [commandRaw] = text.split(/\s+/);
		const command = commandRaw.split("@")[0];

		switch (command) {
			case "/start": {
				const [user] = await db
					.select({ language: users.language, voice: users.voice })
					.from(users)
					.where(eq(users.id, userId));
				await ctx.telegram.sendMessage({
					text: "Welcome to Watch Bot. Choose your preferred language:",
					reply_markup: { inline_keyboard: getLanguageKeyboard(user?.language) },
				});
				if (user && (user.voice === null || user.voice === undefined)) {
					await ctx.telegram.sendMessage({
						text: "Do you want government updates as voice messages too? I can send a voice file with the update, and the link as text.",
						reply_markup: { inline_keyboard: getVoiceKeyboard() },
					});
				}
				return null;
			}
			case "/language": {
				const [user] = await db
					.select({ language: users.language })
					.from(users)
					.where(eq(users.id, userId));
				await ctx.telegram.sendMessage({
					text: "Choose your preferred language:",
					reply_markup: { inline_keyboard: getLanguageKeyboard(user?.language) },
				});
				return null;
			}
			case "/subscribe": {
				const [user] = await db
					.select({ subscriptions: users.subscriptions })
					.from(users)
					.where(eq(users.id, userId));
				await ctx.telegram.sendMessage({
					text: "Select a category to subscribe. Tap any category to add it.",
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
			const [existing] = await db
				.select({ voice: users.voice })
				.from(users)
				.where(eq(users.id, userId));
			await db
				.insert(users)
				.values({ id: userId, language: lang })
				.onConflictDoUpdate({
					target: users.id,
					set: { language: lang, updatedAt: new Date() },
				});
			await ctx.telegram.sendMessage(
				`Language set to ${languages[lang].nativeName} (${lang}).`,
			);
			if (existing?.voice === null || existing?.voice === undefined) {
				await ctx.telegram.sendMessage({
					text: "Do you want government updates as voice messages too? I can send a voice file with the update, and the link as text.",
					reply_markup: { inline_keyboard: getVoiceKeyboard() },
				});
			} else {
				await ctx.telegram.sendMessage(
					"Now use /subscribe to pick update categories.",
				);
			}
			return;
		}

		if (kind === "voice" && (value === "yes" || value === "no")) {
			const voice = value === "yes";
			await db
				.insert(users)
				.values({ id: userId, voice })
				.onConflictDoUpdate({
					target: users.id,
					set: { voice, updatedAt: new Date() },
				});
			await ctx.telegram.sendMessage(
				voice
					? "Voice updates enabled. I will send update audio and the link as text. Use /subscribe to pick categories."
					: "Voice updates disabled. I will send text updates. Use /subscribe to pick categories.",
			);
			return;
		}

		if (kind === "sub" && value) {
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

			if (current.has(category)) {
				await ctx.telegram.sendMessage(
					`You are already subscribed to ${categories[category].name}.`,
				);
				return;
			}

			current.add(category);
			try {
				await ensureCategoryMonitor(category);
			} catch (e) {
				console.error("Failed to ensure monitor", category, e);
			}

			const subscriptions = [...current];
			await db
				.insert(users)
				.values({ id: userId, subscriptions })
				.onConflictDoUpdate({
					target: users.id,
					set: { subscriptions, updatedAt: new Date() },
				});

			await ctx.telegram.sendMessage(
				`Subscribed to ${categories[category].name}.`,
			);
			return;
		}
	},
});
