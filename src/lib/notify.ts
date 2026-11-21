import { categories, type CategoryKey } from "@/watch.ts";

export type WatchUpdate = {
	category: CategoryKey;
	title: string;
	summary: string;
	url?: string;
	source?: string;
	publishedDate?: string;
};

export function formatUpdateMessage(update: WatchUpdate): string {
	const category = categories[update.category];
	const lines = [
		`${category.icon} ${category.name} update`,
		"",
		update.title,
		"",
		update.summary,
	];

	if (update.url) {
		lines.push("", `Source: ${update.url}`);
	}

	return lines.join("\n");
}

export function formatUpdateAudioText(update: WatchUpdate): string {
	const category = categories[update.category];
	return [`${category.name} update`, "", update.title, "", update.summary].join(
		"\n",
	);
}

export function formatUpdateLinkText(update: WatchUpdate): string | null {
	if (!update.url) return null;
	return `Source: ${update.url}`;
}

export async function sendTelegramAudio(opts: {
	chatId: string;
	audio: Buffer;
	filename?: string;
	caption?: string;
}) {
	const token = process.env.TELEGRAM_BOT_TOKEN;
	if (!token) throw new Error("TELEGRAM_BOT_TOKEN is missing");

	const form = new FormData();
	form.append("chat_id", opts.chatId);
	form.append(
		"audio",
		new Blob([opts.audio], { type: "audio/mpeg" }),
		opts.filename ?? "update.mp3",
	);
	if (opts.caption) form.append("caption", opts.caption.slice(0, 1024));

	const response = await fetch(
		`https://api.telegram.org/bot${token}/sendAudio`,
		{
			method: "POST",
			body: form,
		},
	);

	if (!response.ok) {
		const err = await response.text().catch(() => "");
		throw new Error(`Telegram sendAudio failed: ${response.status} ${err}`);
	}
}
