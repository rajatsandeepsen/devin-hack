import { categoryKeys, type CategoryKey } from "@/watch.ts";

export function mergeSubscriptions(
	existing: string[],
	input: { category?: CategoryKey | "all" | undefined },
): string[] {
	const next = new Set(
		existing.filter((s): s is CategoryKey => categoryKeys.includes(s as CategoryKey)),
	);

	if (!input.category) return [...next];

	if (input.category === "all") {
		for (const key of categoryKeys) next.add(key);
		return [...next];
	}

	next.add(input.category);
	return [...next];
}
