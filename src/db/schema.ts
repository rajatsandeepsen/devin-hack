import { boolean, index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { categoryKeys, languageCodes } from "../watch.ts";
import { createdAt, updatedAt } from "./utils.ts";

export const users = pgTable(
	"users",
	{
		id: text().primaryKey(),
		language: text({ enum: languageCodes as unknown as [string, ...string[]] })
			.default("en-IN")
			.notNull(),
		subscriptions: text({ enum: categoryKeys as unknown as [string, ...string[]] })
			.array()
			.default([])
			.notNull(),
		voice: boolean(),
		createdAt: createdAt(),
		updatedAt: updatedAt(),
	},
	(table) => [
		index("users_subscriptions_idx").using("gin", table.subscriptions),
		index("users_language_idx").on(table.language),
	],
);

export const monitors = pgTable("monitors", {
	category: text({ enum: categoryKeys as unknown as [string, ...string[]] }).primaryKey(),
	monitorId: varchar({ length: 255 }).notNull(),
	webhookSecret: text().notNull(),
	status: text().default("active").notNull(),
	createdAt: createdAt(),
	updatedAt: updatedAt(),
});

export const deliveries = pgTable(
	"deliveries",
	{
		id: text().primaryKey(), // exa event id or run id
		category: text({ enum: categoryKeys as unknown as [string, ...string[]] }).notNull(),
		runId: varchar({ length: 255 }),
		createdAt: createdAt(),
	},
	(table) => [index("deliveries_category_idx").on(table.category)],
);
