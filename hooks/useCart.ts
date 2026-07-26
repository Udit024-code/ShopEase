import {
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import { supabase } from "@/config/supabase";
import { useAuth } from "@/context/supabase-provider";

export type CartItem = {
	id: string;
	quantity: number;
	variant_id: string | null;
	product: {
		id: string;
		name: string;
		price: number;
		discount_price: number | null;
		brand: string | null;
		images: string[];
	} | null;
	variant: {
		id: string;
		size: string | null;
		color: string | null;
		price_override: number | null;
	} | null;
};

const CART_SELECT =
	"id, quantity, variant_id, product:products(id, name, price, discount_price, brand, images), variant:product_variants(id, size, color, price_override)";

export function useCartItems() {
	const { session } = useAuth();
	const userId = session?.user.id;

	return useQuery({
		queryKey: ["cart", "list", userId],
		enabled: !!userId,
		queryFn: async (): Promise<CartItem[]> => {
			const { data, error } = await supabase
				.from("cart_items")
				.select(CART_SELECT)
				.eq("user_id", userId!)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return (data ?? []) as CartItem[];
		},
	});
}

/** Unit price for a cart line, honoring variant override then discount. */
export function cartLinePrice(item: CartItem): number {
	if (!item.product) return 0;
	return (
		item.variant?.price_override ??
		item.product.discount_price ??
		item.product.price
	);
}

export function useUpdateCartQuantity() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
			const { error } = await supabase
				.from("cart_items")
				.update({ quantity })
				.eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cart"] });
		},
	});
}

export function useRemoveCartItem() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await supabase.from("cart_items").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cart"] });
		},
	});
}

type AddToCartInput = {
	productId: string;
	variantId?: string | null;
	quantity?: number;
};

export function useAddToCart() {
	const queryClient = useQueryClient();
	const { session } = useAuth();
	const userId = session?.user.id;

	return useMutation({
		mutationFn: async ({
			productId,
			variantId = null,
			quantity = 1,
		}: AddToCartInput) => {
			if (!userId) throw new Error("Not signed in");

			// Find an existing line for the same product + variant so we bump
			// its quantity instead of creating a duplicate row.
			let existingQuery = supabase
				.from("cart_items")
				.select("id, quantity")
				.eq("user_id", userId)
				.eq("product_id", productId);

			existingQuery = variantId
				? existingQuery.eq("variant_id", variantId)
				: existingQuery.is("variant_id", null);

			const { data: existing, error: findError } =
				await existingQuery.maybeSingle();
			if (findError) throw findError;

			if (existing) {
				const { error } = await supabase
					.from("cart_items")
					.update({ quantity: existing.quantity + quantity })
					.eq("id", existing.id);
				if (error) throw error;
			} else {
				const { error } = await supabase.from("cart_items").insert({
					user_id: userId,
					product_id: productId,
					variant_id: variantId,
					quantity,
				});
				if (error) throw error;
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cart"] });
		},
	});
}
