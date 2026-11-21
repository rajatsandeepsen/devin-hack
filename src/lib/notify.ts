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
