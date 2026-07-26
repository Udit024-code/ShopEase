import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { supabase } from "@/config/supabase";
import { PRODUCT_COLUMNS, type Product } from "@/hooks/useProducts";

export type SortOption = "newest" | "price_asc" | "price_desc" | "rating";

export type SearchFilters = {
	sort: SortOption;
	onSaleOnly: boolean;
	inStockOnly: boolean;
	minRating: number; // 0 = any
	categoryId: string | null; // null = all categories
};

export const DEFAULT_FILTERS: SearchFilters = {
	sort: "newest",
	onSaleOnly: false,
	inStockOnly: false,
	minRating: 0,
	categoryId: null,
};

export function activeFilterCount(f: SearchFilters): number {
	return (
		(f.sort !== "newest" ? 1 : 0) +
		(f.onSaleOnly ? 1 : 0) +
		(f.inStockOnly ? 1 : 0) +
		(f.minRating > 0 ? 1 : 0) +
		(f.categoryId ? 1 : 0)
	);
}

// Strip characters that have meaning in PostgREST filter strings so a search
// term can't break (or inject into) the `or(...)` expression.
function sanitizeTerm(term: string): string {
	return term.replace(/[,()%*\\:.]/g, " ").trim();
}

export function useSearchProducts(query: string, filters: SearchFilters) {
	const term = sanitizeTerm(query);

	return useQuery({
		queryKey: ["search", term, filters],
		enabled: term.length > 0,
		placeholderData: keepPreviousData,
		queryFn: async (): Promise<Product[]> => {
			let q = supabase
				.from("products")
				.select(PRODUCT_COLUMNS)
				.eq("is_active", true)
				.or(`name.ilike.%${term}%,brand.ilike.%${term}%`);

			if (filters.categoryId) {
				// Match the selected category plus its direct subcategories so a
				// top-level category (e.g. Fashion) includes its children's items.
				const { data: children, error: childrenError } = await supabase
					.from("categories")
					.select("id")
					.eq("parent_id", filters.categoryId);
				if (childrenError) throw childrenError;

				const categoryIds = [
					filters.categoryId,
					...children.map((c) => c.id),
				];
				q = q.in("category_id", categoryIds);
			}

			if (filters.onSaleOnly) q = q.not("discount_price", "is", null);
			if (filters.inStockOnly) q = q.gt("stock", 0);
			if (filters.minRating > 0) q = q.gte("rating", filters.minRating);

			switch (filters.sort) {
				case "price_asc":
					q = q.order("price", { ascending: true });
					break;
				case "price_desc":
					q = q.order("price", { ascending: false });
					break;
				case "rating":
					q = q.order("rating", { ascending: false });
					break;
				default:
					q = q.order("created_at", { ascending: false });
			}

			const { data, error } = await q.limit(50);
			if (error) throw error;
			return data;
		},
	});
}
