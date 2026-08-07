import { useMutation } from "@tanstack/react-query";

import { supabase } from "@/config/supabase";

export type AppliedCoupon = {
	code: string;
	discount_type: string;
	value: number;
	discount_amount: number;
};

/**
 * Validates a promo code against the current subtotal via the server-side
 * `validate_coupon` RPC and returns the discount to preview at checkout. The
 * actual discount is re-validated and applied by `place_order` on submit, so
 * this is preview-only and can never be trusted to set the final price.
 */
export function useValidateCoupon() {
	return useMutation({
		mutationFn: async ({
			code,
			subtotal,
		}: {
			code: string;
			subtotal: number;
		}): Promise<AppliedCoupon> => {
			const { data, error } = await supabase.rpc("validate_coupon", {
				p_code: code,
				p_subtotal: subtotal,
			});
			if (error) throw error;
			const row = Array.isArray(data) ? data[0] : data;
			if (!row) throw new Error("Invalid or expired coupon");
			return row as AppliedCoupon;
		},
	});
}
