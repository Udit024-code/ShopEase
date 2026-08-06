import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/config/supabase";
import { useAuth } from "@/context/supabase-provider";

export type OrderSummary = {
	id: string;
	status: string;
	total_amount: number;
	payment_method: string;
	created_at: string;
	item_count: number;
};

export type OrderDetail = {
	id: string;
	status: string;
	total_amount: number;
	payment_method: string;
	created_at: string;
	address: {
		full_name: string;
		phone: string;
		line1: string;
		line2: string | null;
		city: string;
		state: string | null;
		postal_code: string;
		country: string;
	} | null;
	items: {
		id: string;
		quantity: number;
		price: number;
		product_id: string;
		variant_id: string | null;
		product: {
			name: string;
			brand: string | null;
			images: string[];
		} | null;
		variant: { size: string | null; color: string | null } | null;
	}[];
};

export function useOrders() {
	const { session } = useAuth();
	const userId = session?.user.id;

	return useQuery({
		queryKey: ["orders", "list", userId],
		enabled: !!userId,
		queryFn: async (): Promise<OrderSummary[]> => {
			const { data, error } = await supabase
				.from("orders")
				.select(
					"id, status, total_amount, payment_method, created_at, order_items(count)",
				)
				.eq("user_id", userId!)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return (data ?? []).map((o: any) => ({
				id: o.id,
				status: o.status,
				total_amount: o.total_amount,
				payment_method: o.payment_method,
				created_at: o.created_at,
				item_count: o.order_items?.[0]?.count ?? 0,
			}));
		},
	});
}

export function useOrder(orderId: string | undefined) {
	return useQuery({
		queryKey: ["order", orderId],
		enabled: !!orderId,
		queryFn: async (): Promise<OrderDetail> => {
			const { data, error } = await supabase
				.from("orders")
				.select(
					"id, status, total_amount, payment_method, created_at, address:addresses(full_name, phone, line1, line2, city, state, postal_code, country), items:order_items(id, quantity, price, product_id, variant_id, product:products(name, brand, images), variant:product_variants(size, color))",
				)
				.eq("id", orderId!)
				.single();

			if (error) throw error;
			return data as unknown as OrderDetail;
		},
	});
}

export function usePlaceOrder() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			addressId,
			paymentMethod = "cod",
		}: {
			addressId: string | null;
			paymentMethod?: string;
		}): Promise<string> => {
			const { data, error } = await supabase.rpc("place_order", {
				// The RPC accepts a null address, but generated types type the
				// uuid arg as non-null; cast to keep the nullable runtime behavior.
				p_address_id: addressId as string,
				p_payment_method: paymentMethod,
			});
			if (error) throw error;
			return data as string;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cart"] });
			queryClient.invalidateQueries({ queryKey: ["orders"] });
		},
	});
}

export function useReorder() {
	const queryClient = useQueryClient();
	const { session } = useAuth();
	const userId = session?.user.id;

	return useMutation({
		mutationFn: async (orderId: string) => {
			if (!userId) throw new Error("Not signed in");

			const { data: items, error } = await supabase
				.from("order_items")
				.select("product_id, variant_id, quantity")
				.eq("order_id", orderId);
			if (error) throw error;

			// Merge each order line into the cart, bumping quantity on an
			// existing product+variant line rather than duplicating it.
			for (const item of items ?? []) {
				let existingQuery = supabase
					.from("cart_items")
					.select("id, quantity")
					.eq("user_id", userId)
					.eq("product_id", item.product_id);

				existingQuery = item.variant_id
					? existingQuery.eq("variant_id", item.variant_id)
					: existingQuery.is("variant_id", null);

				const { data: existing, error: findError } =
					await existingQuery.maybeSingle();
				if (findError) throw findError;

				if (existing) {
					const { error: updateError } = await supabase
						.from("cart_items")
						.update({ quantity: existing.quantity + item.quantity })
						.eq("id", existing.id);
					if (updateError) throw updateError;
				} else {
					const { error: insertError } = await supabase
						.from("cart_items")
						.insert({
							user_id: userId,
							product_id: item.product_id,
							variant_id: item.variant_id,
							quantity: item.quantity,
						});
					if (insertError) throw insertError;
				}
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cart"] });
		},
	});
}

export function useCancelOrder() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (orderId: string) => {
			const { error } = await supabase.rpc("cancel_order", {
				p_order_id: orderId,
			});
			if (error) throw error;
		},
		onSuccess: (_data, orderId) => {
			queryClient.invalidateQueries({ queryKey: ["orders"] });
			queryClient.invalidateQueries({ queryKey: ["order", orderId] });
		},
	});
}
