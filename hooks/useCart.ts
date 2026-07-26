import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/config/supabase";
import { useAuth } from "@/context/supabase-provider";

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
