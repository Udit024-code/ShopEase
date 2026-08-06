import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/config/supabase";
import { useAuth } from "@/context/supabase-provider";

export type Review = {
	id: string;
	user_id: string;
	rating: number;
	comment: string | null;
	created_at: string;
	author: {
		username: string | null;
		display_name: string | null;
		avatar_url: string | null;
	} | null;
};

export function reviewAuthorName(review: Review): string {
	return (
		review.author?.display_name?.trim() ||
		review.author?.username?.trim() ||
		"Anonymous"
	);
}

export function useReviews(productId: string | undefined) {
	return useQuery({
		queryKey: ["reviews", productId],
		enabled: !!productId,
		queryFn: async (): Promise<Review[]> => {
			const { data, error } = await supabase
				.from("reviews")
				.select(
					"id, user_id, rating, comment, created_at, author:profiles(username, display_name, avatar_url)",
				)
				.eq("product_id", productId!)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return (data ?? []) as unknown as Review[];
		},
	});
}

export function useMyReview(productId: string | undefined) {
	const { session } = useAuth();
	const userId = session?.user.id;

	return useQuery({
		queryKey: ["review", "mine", productId, userId],
		enabled: !!productId && !!userId,
		queryFn: async (): Promise<Review | null> => {
			const { data, error } = await supabase
				.from("reviews")
				.select(
					"id, user_id, rating, comment, created_at, author:profiles(username, display_name, avatar_url)",
				)
				.eq("product_id", productId!)
				.eq("user_id", userId!)
				.maybeSingle();

			if (error) throw error;
			return (data as unknown as Review) ?? null;
		},
	});
}

export function useUpsertReview(productId: string) {
	const queryClient = useQueryClient();
	const { session } = useAuth();

	return useMutation({
		mutationFn: async ({
			rating,
			comment,
		}: {
			rating: number;
			comment: string;
		}) => {
			const userId = session?.user.id;
			if (!userId) throw new Error("You must be signed in to review.");

			const { error } = await supabase.from("reviews").upsert(
				{
					product_id: productId,
					user_id: userId,
					rating,
					comment: comment.trim() || null,
				},
				{ onConflict: "product_id,user_id" },
			);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
			queryClient.invalidateQueries({ queryKey: ["review", "mine", productId] });
			// the trigger updates the product's aggregate rating
			queryClient.invalidateQueries({ queryKey: ["product", productId] });
			queryClient.invalidateQueries({ queryKey: ["products"] });
		},
	});
}

export function useDeleteReview(productId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (reviewId: string) => {
			const { error } = await supabase
				.from("reviews")
				.delete()
				.eq("id", reviewId);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
			queryClient.invalidateQueries({ queryKey: ["review", "mine", productId] });
			queryClient.invalidateQueries({ queryKey: ["product", productId] });
			queryClient.invalidateQueries({ queryKey: ["products"] });
		},
	});
}
