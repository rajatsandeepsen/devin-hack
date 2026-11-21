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
		`${category.icon} *${category.name} update*`,
		"",
		`*${escapeMarkdown(update.title)}*`,
		"",
		escapeMarkdown(update.summary),
	];

	if (update.url) {
		lines.push("", `Source: ${update.url}`);
	}
	if (update.publishedDate) {
		lines.push(`Published: ${escapeMarkdown(update.publishedDate)}`);
	}

	return lines.join("\n");
}

function escapeMarkdown(text: string): string {
	return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}
