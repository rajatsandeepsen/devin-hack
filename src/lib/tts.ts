import { generateSpeech } from "ai";
import { sarvam } from "sarvam-ai-sdk";
import type { LanguageCode } from "@/watch.ts";

type SarvamTtsLanguage =
	| "bn-IN"
	| "en-IN"
	| "gu-IN"
	| "hi-IN"
	| "kn-IN"
	| "ml-IN"
	| "mr-IN"
	| "od-IN"
	| "pa-IN"
	| "ta-IN"
	| "te-IN";

const TTS_SUPPORTED: Partial<Record<LanguageCode, SarvamTtsLanguage>> = {
	"bn-IN": "bn-IN",
	"en-IN": "en-IN",
	"gu-IN": "gu-IN",
	"hi-IN": "hi-IN",
	"kn-IN": "kn-IN",
	"ml-IN": "ml-IN",
	"mr-IN": "mr-IN",
	"od-IN": "od-IN",
	"pa-IN": "pa-IN",
	"ta-IN": "ta-IN",
	"te-IN": "te-IN",
};

function getTtsLanguage(language: LanguageCode): SarvamTtsLanguage {
	return TTS_SUPPORTED[language] ?? "en-IN";
}

function sanitizeForSpeech(text: string): string {
	return text
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 $2")
		.replace(/[*_`~#>|]/g, "")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

export async function textToSpeech(
	text: string,
	language: LanguageCode,
): Promise<Buffer> {
	const trimmed = sanitizeForSpeech(text).slice(0, 2500);
	if (!trimmed) throw new Error("No text to convert to speech");

	const { audio } = await generateSpeech({
		model: sarvam.speech("bulbul:v4-flash", getTtsLanguage(language), {
			speaker: "shubh_enhi_ads",
		}),
		text: trimmed,
	});

	return Buffer.from(audio.base64, "base64");
}
