import { categories, categoryKeys, languages, type CategoryKey, type LanguageCode } from "@/watch.ts";

export function formatCategoryLabel(key: CategoryKey) {
	const category = categories[key];
	return `${category.icon} ${category.name}`;
}

export function formatSubscriptions(subscriptions: string[]) {
	const selected = subscriptions.filter((s): s is CategoryKey =>
		categoryKeys.includes(s as CategoryKey),
	);

	if (selected.length === 0) {
		return "You have no active subscriptions. Use /subscribe to pick topics.";
	}

	return [
		"Your active subscriptions:",
		...selected.map((key) => `- ${formatCategoryLabel(key)}`),
	].join("\n");
}

export function formatProfile(user?: {
	id: string;
	language?: string | null;
	subscriptions?: string[] | null;
} | null) {
	if (!user) return "No profile found yet. Send /start to set up Watch Bot.";

	const languageCode = (user.language ?? "en-IN") as LanguageCode;
	const language = languages[languageCode]?.nativeName ?? user.language ?? "English";
	const subs = (user.subscriptions ?? []).filter((s): s is CategoryKey =>
		categoryKeys.includes(s as CategoryKey),
	);

	return [
		"Your Watch Bot profile:",
		`- Language: ${language} (${languageCode})`,
		`- Subscriptions: ${subs.length ? subs.map((s) => categories[s].name).join(", ") : "None"}`,
	].join("\n");
}

export function getLanguageKeyboard() {
	const rows: Array<Array<{ text: string; callback_data: string }>> = [];
	const entries = Object.entries(languages) as [LanguageCode, (typeof languages)[LanguageCode]][];
	for (let i = 0; i < entries.length; i += 2) {
		const row = entries.slice(i, i + 2).map(([code, lang]) => ({
			text: `${lang.nativeName}`,
			callback_data: `lang:${code}`,
		}));
		rows.push(row);
	}
	return rows;
}

export function getCategoryKeyboard(selected: string[] = []) {
	const rows: Array<Array<{ text: string; callback_data: string }>> = [];
	const entries = Object.entries(categories) as [CategoryKey, (typeof categories)[CategoryKey]][];
	for (let i = 0; i < entries.length; i += 2) {
		const row = entries.slice(i, i + 2).map(([key, cat]) => {
			const isSelected = selected.includes(key);
			return {
				text: `${isSelected ? "✅" : "▫️"} ${cat.icon} ${cat.name}`,
				callback_data: `sub:${key}`,
			};
		});
		rows.push(row);
	}
	rows.push([{ text: "Done", callback_data: "sub:done" }]);
	return rows;
}
