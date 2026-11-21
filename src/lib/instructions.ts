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
	const languageLabel = lang
		? languageCode === "en-IN"
			? lang.nativeName
			: `English / ${lang.nativeName}`
		: "English";
	const subs = (user.subscriptions ?? []).filter((s): s is CategoryKey =>
		categoryKeys.includes(s as CategoryKey),
	);

	return [
		"User context:",
		`- Preferred language: ${languageLabel}`,
		`- Subscriptions: ${subs.length ? subs.map((s) => categories[s].name).join(", ") : "None"}`,
		"- If the user asks for updates, explain their subscribed categories and suggest /subscribe to change them.",
		"- When replying conversationally, prefer the user's preferred language when possible. Use plain text only, no Markdown.",
	];
}
