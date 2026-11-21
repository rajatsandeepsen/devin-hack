import { eq } from "drizzle-orm";
import { db, monitors } from "@/db";
import { categoryKeys, type CategoryKey } from "@/watch.ts";
import { createCategoryMonitor } from "@/lib/exa.ts";

const baseUrl = process.env.EVE_SERVER_URL;
if (!baseUrl) throw new Error("EVE_SERVER_URL is missing");
const webhookUrl = `${baseUrl.replace(/\/$/, "")}/webhooks/exa`;

const requested = process.argv.slice(2).filter(Boolean) as CategoryKey[];
const keys = requested.length > 0 ? requested : categoryKeys;

for (const key of keys) {
	if (!categoryKeys.includes(key)) {
		console.warn(`Skipping unknown category: ${key}`);
		continue;
	}

	const [existing] = await db
		.select()
		.from(monitors)
		.where(eq(monitors.category, key));
	if (existing) {
		console.log(`Monitor already exists for ${key}: ${existing.monitorId}`);
		continue;
	}

	console.log(`Creating Exa monitor for ${key} -> ${webhookUrl}`);
	const monitor = await createCategoryMonitor(key, webhookUrl);
	if (!monitor.webhookSecret) {
		throw new Error(`No webhookSecret returned for ${key}. Save it manually.`);
	}

	await db.insert(monitors).values({
		category: key,
		monitorId: monitor.id,
		webhookSecret: monitor.webhookSecret,
		status: monitor.status ?? "active",
	});

	console.log(`Created ${key}: ${monitor.id}`);
}

console.log("Done.");
process.exit(0);
