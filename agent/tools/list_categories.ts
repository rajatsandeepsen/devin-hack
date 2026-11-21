import { defineTool } from "eve/tools";
import { z } from "zod";
import { categories, categoryKeys } from "@/watch.ts";

export default defineTool({
	description:
		"List available Watch Bot government update categories the user can subscribe to. Use when the user asks what categories/topics/updates are available, in any language.",
	inputSchema: z.object({}),
	async execute() {
		return {
			categories: categoryKeys.map((key) => {
				const c = categories[key];
				return {
					key,
					name: c.name,
					icon: c.icon,
					description: c.description,
				};
			}),
		};
	},
	toModelOutput: (out) => ({
		type: "text",
		value: out.categories
			.map((c) => `${c.icon} ${c.name} (${c.key}) - ${c.description}`)
			.join("\n"),
	}),
});
