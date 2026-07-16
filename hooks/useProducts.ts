import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/config/supabase";
import type { Database } from "@/database.types";

export type Product = Pick<
	Database["public"]["Tables"]["products"]["Row"],
	| "id"
	| "name"
	| "price"
	| "discount_price"
	| "brand"
	| "rating"
	| "images"
>;

const PRODUCT_COLUMNS = "id, name, price, discount_price, brand, rating, images";
const RAIL_LIMIT = 10;

export function useDealsProducts() {
	return useQuery({
		queryKey: ["products", "deals"],
		queryFn: async (): Promise<Product[]> => {
			const { data, error } = await supabase
				.from("products")
				.select(PRODUCT_COLUMNS)
				.eq("is_active", true)
				.not("discount_price", "is", null)
				.order("created_at", { ascending: false })
				.limit(RAIL_LIMIT);

			if (error) throw error;
			return data;
		},
	});
}

export function useNewArrivals() {
	return useQuery({
		queryKey: ["products", "new-arrivals"],
		queryFn: async (): Promise<Product[]> => {
			const { data, error } = await supabase
				.from("products")
				.select(PRODUCT_COLUMNS)
				.eq("is_active", true)
				.order("created_at", { ascending: false })
				.limit(RAIL_LIMIT);

			if (error) throw error;
			return data;
		},
	});
}

export function useTopRatedProducts() {
	return useQuery({
		queryKey: ["products", "top-rated"],
		queryFn: async (): Promise<Product[]> => {
			const { data, error } = await supabase
				.from("products")
				.select(PRODUCT_COLUMNS)
				.eq("is_active", true)
				.order("rating", { ascending: false })
				.limit(RAIL_LIMIT);

			if (error) throw error;
			return data;
		},
	});
}
