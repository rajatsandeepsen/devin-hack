import { eq } from "drizzle-orm";
import { sendTelegramMessage, splitTelegramMessageText } from "eve/channels/telegram";
import { db, deliveries, users } from "@/db";
import { categories, type CategoryKey, type LanguageCode } from "@/watch.ts";
import { formatUpdateMessage, type WatchUpdate } from "./notify.ts";
import { translateText } from "./translate.ts";

type ExaWebhookEvent = {
	id?: string;
	type?: string;
	data?: {
		id?: string;
		monitorId?: string;
		status?: string;
		output?: {
			results?: Array<{
				title?: string;
				url?: string;
				publishedDate?: string;
				highlights?: string[];
				text?: string;
				summary?: string;
			}>;
			content?: string | Record<string, unknown>;
		};
		metadata?: { category?: string };
	};
};

export async function handleMonitorWebhook(event: ExaWebhookEvent) {
	if (event.type !== "monitor.run.completed") return { ok: true, ignored: true };
	const run = event.data;
	if (!run || run.status !== "completed") return { ok: true, ignored: true };

	const category = (run.metadata?.category ?? "") as CategoryKey;
	if (!category || !(category in categories)) {
		console.warn("Unknown monitor category", run.monitorId, run.metadata);
		return { ok: false, error: "unknown_category" };
	}

	const eventId = event.id ?? run.id ?? `${run.monitorId}:${category}:${Date.now()}`;
	const inserted = await db
		.insert(deliveries)
		.values({ id: eventId, category, runId: run.id })
		.onConflictDoNothing()
		.returning({ id: deliveries.id });
	if (inserted.length === 0) {
		return { ok: true, duplicate: true, sent: 0 };
	}

	const updates = extractUpdates(category, event);
	if (updates.length === 0) return { ok: true, sent: 0 };

	const matching = (await db.select().from(users)).filter((u) =>
		(u.subscriptions ?? []).includes(category),
	);
	if (matching.length === 0) return { ok: true, sent: 0 };

	let sent = 0;
	for (const update of updates) {
		const baseMessage = formatUpdateMessage(update);
		const byLanguage = new Map<string, string>();

		for (const user of matching) {
			const lang = (user.language ?? "en-IN") as LanguageCode;
			let message = byLanguage.get(lang);
			if (!message) {
				message =
					lang === "en-IN"
						? baseMessage
						: await translateText(baseMessage, lang, "en-IN");
				byLanguage.set(lang, message);
			}

			const chunks = splitTelegramMessageText(message);
			for (const chunk of chunks) {
				try {
					await sendTelegramMessage({
						chatId: user.id,
						body: { text: chunk },
					});
				} catch (e) {
					console.error("Failed to send update", user.id, e);
				}
			}
			sent++;
		}
	}

	return { ok: true, sent, updates: updates.length };
}

function extractUpdates(category: CategoryKey, event: ExaWebhookEvent): WatchUpdate[] {
	const output = event.data?.output;
	const results = output?.results ?? [];
	const updates: WatchUpdate[] = [];

	for (const result of results.slice(0, 3)) {
		const title = result.title?.trim() || `${categories[category].name} update`;
		const summary =
			result.summary?.trim() ||
			(result.highlights ?? []).filter(Boolean).join(" ").trim() ||
			(typeof output?.content === "string" ? output.content.slice(0, 700) : "") ||
			"New government update available.";
		updates.push({
			category,
			title,
			summary: summary.slice(0, 900),
			url: result.url,
			publishedDate: result.publishedDate,
		});
	}

	if (updates.length === 0 && typeof output?.content === "string" && output.content.trim()) {
		updates.push({
			category,
			title: `${categories[category].name} update`,
			summary: output.content.slice(0, 900),
		});
	}

	return updates;
}
