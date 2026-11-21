import { generateText } from "ai";
import { sarvam } from "sarvam-ai-sdk";
import { DEFAULT_LANGUAGE, type LanguageCode } from "@/watch.ts";

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

	const chunks = chunkText(text, 1800);
	const translated: string[] = [];

	for (const chunk of chunks) {
		try {
			const model =
				sourceLanguage === "auto"
					? sarvam.translation("mayura:v1", {
							from: "auto",
							to: targetLanguage as any,
						})
					: sarvam.translation("sarvam-translate:v1", {
							from: sourceLanguage as any,
							to: targetLanguage as any,
							mode: "formal",
						});

			const result = await generateText({
				model,
				prompt: chunk,
			});
			translated.push(result.text?.trim() || chunk);
		} catch (e) {
			console.error("Sarvam translate failed", e);
			translated.push(chunk);
		}
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
