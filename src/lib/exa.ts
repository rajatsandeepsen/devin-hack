import { categories, type CategoryKey } from "@/watch.ts";

const EXA_API_BASE = "https://api.exa.ai";

type ExaMonitor = {
	id: string;
	name: string;
	status?: string;
	webhookSecret?: string;
	webhook?: { url: string; events?: string[] };
};

function getExaApiKey() {
	const key = process.env.EXA_API_KEY;
	if (!key) throw new Error("EXA_API_KEY is missing");
	return key;
}

async function exaFetch<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${EXA_API_BASE}${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${getExaApiKey()}`,
			...(init?.headers ?? {}),
		},
	});
	if (!res.ok) {
		const body = await res.text().catch(() => "");
		throw new Error(`Exa API ${path} failed: ${res.status} ${body}`);
	}
	return (await res.json()) as T;
}

export function getCategoryQuery(category: CategoryKey): string {
	const cat = categories[category];
	return `${cat.query}. Focus on official Indian government announcements, policies, schemes, notifications, and updates.`;
}

export function getCategoryDomains(category: CategoryKey): string[] {
	const cat = categories[category];
	// Include category domains plus broad gov/nic domains.
	const domains = new Set([...cat.domains, "gov.in", "nic.in"]);
	return [...domains];
}

export async function createCategoryMonitor(
	category: CategoryKey,
	webhookUrl: string,
) {
	const cat = categories[category];
	return exaFetch<ExaMonitor>("/monitors", {
		method: "POST",
		body: JSON.stringify({
			name: `watch-bot:${category}`,
			search: {
				query: getCategoryQuery(category),
				numResults: 5,
				includeDomains: getCategoryDomains(category),
				contents: { highlights: true },
			},
			trigger: { type: "interval", period: "1h" },
			webhook: {
				url: webhookUrl,
				events: ["monitor.run.completed"],
			},
			metadata: { category },
		}),
	});
}

export async function triggerMonitor(monitorId: string) {
	return exaFetch(`/monitors/${monitorId}/trigger`, { method: "POST" });
}

export function verifyExaSignature(
	payload: Buffer | string,
	signatureHeader: string | null,
	secret: string,
): boolean {
	if (!signatureHeader) return false;
	const parts = Object.fromEntries(
		signatureHeader.split(",").map((part) => {
			const [k, ...rest] = part.split("=");
			return [k, rest.join("=")];
		}),
	) as { t?: string; v1?: string };
	if (!parts.t || !parts.v1) return false;

	const body = typeof payload === "string" ? Buffer.from(payload) : payload;
	const signed = Buffer.concat([Buffer.from(`${parts.t}.`), body]);
	const expected = createHmac("sha256", secret).update(signed).digest("hex");
	const actual = Buffer.from(parts.v1, "hex");
	const exp = Buffer.from(expected, "hex");
	if (actual.length !== exp.length) return false;
	return timingSafeEqual(actual, exp);
}

import { createHmac, timingSafeEqual } from "node:crypto";
