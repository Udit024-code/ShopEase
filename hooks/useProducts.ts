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

export type ProductDetail = Database["public"]["Tables"]["products"]["Row"];

const PRODUCT_COLUMNS = "id, name, price, discount_price, brand, rating, images";
const RAIL_LIMIT = 10;

export function useProductsByCategory(categoryId: string | undefined) {
	return useQuery({
		queryKey: ["products", "by-category", categoryId],
		enabled: !!categoryId,
		queryFn: async (): Promise<Product[]> => {
			const { data, error } = await supabase
				.from("products")
				.select(PRODUCT_COLUMNS)
				.eq("is_active", true)
				.eq("category_id", categoryId!)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
	});
}

export function useProduct(productId: string | undefined) {
	return useQuery({
		queryKey: ["product", productId],
		enabled: !!productId,
		queryFn: async (): Promise<ProductDetail> => {
			const { data, error } = await supabase
				.from("products")
				.select("*")
				.eq("id", productId!)
				.single();

			if (error) throw error;
			return data;
		},
	});
}

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
