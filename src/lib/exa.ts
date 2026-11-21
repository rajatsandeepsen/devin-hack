import Exa from "exa-js";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, monitors } from "@/db";
import { categories, type CategoryKey } from "@/watch.ts";

function getExa() {
	const key = process.env.EXA_API_KEY;
	if (!key) throw new Error("EXA_API_KEY is missing");
	return new Exa(key);
}

export type ExaMonitorListItem = {
	id: string;
	name?: string | null;
	status?: string;
	search?: { query?: string };
	trigger?: { type?: string; period?: string } | null;
	webhook?: { url?: string; events?: string[] } | null;
	metadata?: Record<string, string> | null;
	nextRunAt?: string | null;
	createdAt?: string;
	updatedAt?: string;
};

export function getCategoryQuery(category: CategoryKey): string {
	const cat = categories[category];
	return `${cat.query}. Focus on official Indian government announcements, policies, schemes, notifications, and updates.`;
}

export function getCategoryDomains(category: CategoryKey): string[] {
	const cat = categories[category];
	const domains = new Set([...cat.domains, "gov.in", "nic.in"]);
	return [...domains];
}

export async function createCategoryMonitor(
	category: CategoryKey,
	webhookUrl: string,
) {
	const exa = getExa();
	const cat = categories[category];
	return exa.monitors.create({
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
		metadata: { category, app: "watch-bot", label: cat.name },
	} as any);
}

export async function listMonitors(params?: {
	status?: "active" | "paused" | "disabled";
	cursor?: string;
	limit?: number;
}) {
	const exa = getExa();
	return exa.monitors.list(params as any) as Promise<{
		data: ExaMonitorListItem[];
		hasMore: boolean;
		nextCursor?: string | null;
	}>;
}

export async function triggerMonitor(monitorId: string) {
	const exa = getExa();
	return exa.monitors.trigger(monitorId);
}

export async function ensureCategoryMonitor(category: CategoryKey) {
	const [existing] = await db
		.select()
		.from(monitors)
		.where(eq(monitors.category, category));
	if (existing) return existing;

	const baseUrl = process.env.EVE_SERVER_URL;
	if (!baseUrl) throw new Error("EVE_SERVER_URL is missing");
	const webhookUrl = `${baseUrl.replace(/\/$/, "")}/webhooks/exa`;

	const created = await createCategoryMonitor(category, webhookUrl);
	if (!created.webhookSecret) {
		throw new Error(`No webhookSecret returned for monitor ${category}`);
	}

	const [saved] = await db
		.insert(monitors)
		.values({
			category,
			monitorId: created.id,
			webhookSecret: created.webhookSecret,
			status: created.status ?? "active",
		})
		.onConflictDoNothing()
		.returning();

	if (saved) return saved;

	const [afterConflict] = await db
		.select()
		.from(monitors)
		.where(eq(monitors.category, category));
	if (!afterConflict) throw new Error(`Failed to persist monitor for ${category}`);
	return afterConflict;
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
