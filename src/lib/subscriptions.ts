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
	voice?: boolean | null;
} | null) {
	if (!user) return "No profile found yet. Send /start to set up Watch Bot.";

	const languageCode = (user.language ?? "en-IN") as LanguageCode;
	const language = languages[languageCode];
	const languageLabel = language
		? languageCode === "en-IN"
			? language.nativeName
			: `English / ${language.nativeName}`
		: "English";

	const subs = (user.subscriptions ?? []).filter((s): s is CategoryKey =>
		categoryKeys.includes(s as CategoryKey),
	);

	const voiceLabel =
		user.voice === null || user.voice === undefined
			? "Not set"
			: user.voice
				? "On"
				: "Off";

	return [
		"Your Watch Bot profile:",
		`- Language: ${languageLabel}`,
		`- Voice updates: ${voiceLabel}`,
		`- Subscriptions: ${subs.length ? subs.map((s) => categories[s].name).join(", ") : "None"}`,
	].join("\n");
}

export function getVoiceKeyboard() {
	return [
		[
			{ text: "Yes, send voice", callback_data: "voice:yes" },
			{ text: "No, text only", callback_data: "voice:no" },
		],
	];
}

export function getLanguageKeyboard(preferredLanguage?: string | null) {
	const preferred =
		preferredLanguage && preferredLanguage in languages
			? (preferredLanguage as LanguageCode)
			: "en-IN";

	const codes: LanguageCode[] =
		preferred === "en-IN"
			? (Object.keys(languages) as LanguageCode[])
			: ["en-IN", preferred];

	const rows: Array<Array<{ text: string; callback_data: string }>> = [];
	for (let i = 0; i < codes.length; i += 2) {
		rows.push(
			codes.slice(i, i + 2).map((code) => ({
				text: languages[code].nativeName,
				callback_data: `lang:${code}`,
			})),
		);
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
	return rows;
}
