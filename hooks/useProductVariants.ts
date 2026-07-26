import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/config/supabase";
import type { Database } from "@/database.types";

export type ProductVariant = Pick<
	Database["public"]["Tables"]["product_variants"]["Row"],
	"id" | "size" | "color" | "stock" | "price_override"
>;

export function useProductVariants(productId: string | undefined) {
	return useQuery({
		queryKey: ["product-variants", productId],
		enabled: !!productId,
		queryFn: async (): Promise<ProductVariant[]> => {
			const { data, error } = await supabase
				.from("product_variants")
				.select("id, size, color, stock, price_override")
				.eq("product_id", productId!)
				.eq("is_active", true);

			if (error) throw error;
			return data;
		},
	});
}
