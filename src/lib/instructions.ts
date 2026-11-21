import { categories, categoryKeys, languages, type CategoryKey, type LanguageCode } from "@/watch.ts";

export function formatUserInstructions(user?: {
	language?: string | null;
	subscriptions?: string[] | null;
} | null) {
	if (!user) {
		return [
			"User context:",
			"- The user is not set up yet.",
			"- Ask them to choose their language and government update interests using /start or /subscribe.",
		];
	}

	const languageCode = (user.language ?? "en-IN") as LanguageCode;
	const lang = languages[languageCode];
	const languageName = lang?.name ?? "English";
	const nativeName = lang?.nativeName ?? "English";
	const subs = (user.subscriptions ?? []).filter((s): s is CategoryKey =>
		categoryKeys.includes(s as CategoryKey),
	);

	const languageRule =
		languageCode === "en-IN"
			? "- Reply in English."
			: `- ALWAYS reply in ${languageName} (${nativeName}). Do not reply in English unless the user explicitly asks for English.`;

	return [
		"User context:",
		`- Preferred language: ${languageName} (${nativeName}, ${languageCode})`,
		`- Subscriptions: ${subs.length ? subs.map((s) => categories[s].name).join(", ") : "None"}`,
		languageRule,
		"- If the user asks for updates, explain their subscribed categories and suggest /subscribe to change them.",
		"- Use plain text only. No Markdown formatting.",
	];
}
