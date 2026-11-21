import { categoryKeys, type CategoryKey } from "@/watch.ts";

export function unmergeSubscriptions(
	existing: string[],
	input: { category?: CategoryKey | "all" | undefined },
): string[] {
	const next = new Set(
		existing.filter((s): s is CategoryKey => categoryKeys.includes(s as CategoryKey)),
	);

	if (!input.category) return [...next];

	if (input.category === "all") {
		return [];
	}

	next.delete(input.category);
	return [...next];
}
