import { DEFAULT_LANGUAGE, type LanguageCode } from "@/watch.ts";

const SARVAM_TRANSLATE_URL = "https://api.sarvam.ai/translate";

export async function translateText(
	text: string,
	targetLanguage: LanguageCode,
	sourceLanguage: LanguageCode | "auto" = "auto",
): Promise<string> {
	if (!text.trim()) return text;
	if (targetLanguage === DEFAULT_LANGUAGE && sourceLanguage === DEFAULT_LANGUAGE) {
		return text;
	}
	if (targetLanguage === sourceLanguage) return text;

	const apiKey = process.env.SARVAM_API_KEY;
	if (!apiKey) {
		console.warn("SARVAM_API_KEY missing; returning original text");
		return text;
	}

	// Sarvam translate has length limits; chunk conservatively.
	const chunks = chunkText(text, 1800);
	const translated: string[] = [];

	for (const chunk of chunks) {
		const res = await fetch(SARVAM_TRANSLATE_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"api-subscription-key": apiKey,
			},
			body: JSON.stringify({
				input: chunk,
				source_language_code: sourceLanguage,
				target_language_code: targetLanguage,
				model: "sarvam-translate:v1",
				mode: "formal",
			}),
		});

		if (!res.ok) {
			const body = await res.text().catch(() => "");
			console.error("Sarvam translate failed", res.status, body);
			translated.push(chunk);
			continue;
		}

		const data = (await res.json()) as { translated_text?: string };
		translated.push(data.translated_text ?? chunk);
	}

	return translated.join("\n");
}

function chunkText(text: string, maxChars: number): string[] {
	if (text.length <= maxChars) return [text];
	const lines = text.split("\n");
	const chunks: string[] = [];
	let current = "";
	for (const line of lines) {
		const candidate = current ? `${current}\n${line}` : line;
		if (candidate.length > maxChars) {
			if (current) chunks.push(current);
			if (line.length > maxChars) {
				for (let i = 0; i < line.length; i += maxChars) {
					chunks.push(line.slice(i, i + maxChars));
				}
				current = "";
			} else {
				current = line;
			}
		} else {
			current = candidate;
		}
	}
	if (current) chunks.push(current);
	return chunks;
}
