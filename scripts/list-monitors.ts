import { db, monitors as monitorsTable } from "@/db";
import { listMonitors } from "@/lib/exa.ts";

const local = await db.select().from(monitorsTable);
const localByMonitorId = new Map(local.map((m) => [m.monitorId, m]));

const all: any[] = [];
let cursor: string | undefined;
do {
	const res = await listMonitors({ limit: 100, cursor });
	all.push(...res.data);
	cursor = res.hasMore && res.nextCursor ? res.nextCursor : undefined;
} while (cursor);

console.log(`Found ${all.length} Exa monitor(s)\n`);

for (const monitor of all) {
	const dbRow = localByMonitorId.get(monitor.id);
	console.log(`- ${monitor.name ?? "(unnamed)"} (${monitor.id})`);
	console.log(`  status: ${monitor.status ?? "unknown"}`);
	console.log(`  category: ${monitor.metadata?.category ?? dbRow?.category ?? "unknown"}`);
	console.log(`  trigger: ${monitor.trigger?.period ?? "none"}`);
	console.log(`  webhook: ${monitor.webhook?.url ?? "none"}`);
	console.log(`  nextRunAt: ${monitor.nextRunAt ?? "none"}`);
	console.log(`  createdAt: ${monitor.createdAt ?? "unknown"}`);
	if (dbRow) console.log(`  db: monitors.category=${dbRow.category}`);
	console.log("");
}

if (local.length > 0) {
	const known = new Set(all.map((m) => m.id));
	const missing = local.filter((m) => !known.has(m.monitorId));
	if (missing.length > 0) {
		console.log("Local DB monitors missing from Exa API response:");
		for (const m of missing) console.log(`- ${m.category}: ${m.monitorId}`);
	}
}

process.exit(0);
