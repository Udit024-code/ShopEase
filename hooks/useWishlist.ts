import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/config/supabase";
import { useAuth } from "@/context/supabase-provider";
import type { Product } from "@/hooks/useProducts";

export type WishlistItem = {
	id: string;
	product: Product | null;
};

const WISHLIST_SELECT =
	"id, product:products(id, name, price, discount_price, brand, rating, images)";

export function useWishlistItems() {
	const { session } = useAuth();
	const userId = session?.user.id;

	return useQuery({
		queryKey: ["wishlist", "list", userId],
		enabled: !!userId,
		queryFn: async (): Promise<WishlistItem[]> => {
			const { data, error } = await supabase
				.from("wishlist")
				.select(WISHLIST_SELECT)
				.eq("user_id", userId!)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return (data ?? []) as WishlistItem[];
		},
	});
}

/** Whether a given product is in the current user's wishlist. */
export function useIsWishlisted(productId: string | undefined) {
	const { session } = useAuth();
	const userId = session?.user.id;

	return useQuery({
		queryKey: ["wishlist", "is-wishlisted", userId, productId],
		enabled: !!userId && !!productId,
		queryFn: async (): Promise<boolean> => {
			const { data, error } = await supabase
				.from("wishlist")
				.select("id")
				.eq("user_id", userId!)
				.eq("product_id", productId!)
				.maybeSingle();

			if (error) throw error;
			return !!data;
		},
	});
}

export function useToggleWishlist(productId: string) {
	const queryClient = useQueryClient();
	const { session } = useAuth();
	const userId = session?.user.id;

	return useMutation({
		mutationFn: async (isWishlisted: boolean) => {
			if (!userId) throw new Error("Not signed in");

			if (isWishlisted) {
				const { error } = await supabase
					.from("wishlist")
					.delete()
					.eq("user_id", userId)
					.eq("product_id", productId);
				if (error) throw error;
			} else {
				const { error } = await supabase
					.from("wishlist")
					.insert({ user_id: userId, product_id: productId });
				if (error) throw error;
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["wishlist", "is-wishlisted", userId, productId],
			});
			queryClient.invalidateQueries({ queryKey: ["wishlist", "list"] });
		},
	});
}
