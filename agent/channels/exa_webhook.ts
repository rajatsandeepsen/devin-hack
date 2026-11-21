import { defineChannel, POST } from "eve/channels";
import { eq } from "drizzle-orm";
import { db, monitors } from "@/db";
import { verifyExaSignature } from "@/lib/exa.ts";
import { handleMonitorWebhook } from "@/lib/updates.ts";

export default defineChannel({
	routes: [
		POST("/webhooks/exa", async (request, { waitUntil }) => {
			const rawBody = await request.text();
			let event: any;
			try {
				event = JSON.parse(rawBody);
			} catch {
				return new Response("invalid json", { status: 400 });
			}

			const monitorId = event?.data?.monitorId;
			if (monitorId) {
				const [monitor] = await db
					.select({ webhookSecret: monitors.webhookSecret })
					.from(monitors)
					.where(eq(monitors.monitorId, monitorId));
				if (monitor?.webhookSecret) {
					const ok = verifyExaSignature(
						rawBody,
						request.headers.get("exa-signature"),
						monitor.webhookSecret,
					);
					if (!ok) {
						console.warn("Invalid Exa webhook signature for monitor", monitorId);
						return new Response("invalid signature", { status: 401 });
					}
				}
			}

			waitUntil(
				handleMonitorWebhook(event).catch((e) => {
					console.error("Exa webhook processing failed", e);
				}),
			);

			return Response.json({ ok: true });
		}),
	],
});
