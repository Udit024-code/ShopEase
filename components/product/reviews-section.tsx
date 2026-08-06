import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Muted } from "@/components/ui/typography";
import {
	reviewAuthorName,
	useDeleteReview,
	useMyReview,
	useReviews,
	useUpsertReview,
	type Review,
} from "@/hooks/useReviews";

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function Stars({
	value,
	size = 14,
	onChange,
}: {
	value: number;
	size?: number;
	onChange?: (v: number) => void;
}) {
	return (
		<View className="flex-row gap-0.5">
			{[1, 2, 3, 4, 5].map((n) => {
				const filled = n <= value;
				const star = (
					<Feather
						name="star"
						size={size}
						color={filled ? "#f59e0b" : "#d1d5db"}
					/>
				);
				if (!onChange) return <View key={n}>{star}</View>;
				return (
					<Pressable key={n} hitSlop={6} onPress={() => onChange(n)}>
						{star}
					</Pressable>
				);
			})}
		</View>
	);
}

function ReviewRow({
	review,
	isMine,
	onDelete,
}: {
	review: Review;
	isMine: boolean;
	onDelete: () => void;
}) {
	return (
		<View className="gap-1 py-3 border-b border-border">
			<View className="flex-row items-center justify-between">
				<Text className="text-sm font-semibold">
					{reviewAuthorName(review)}
					{isMine && (
						<Text className="text-xs font-normal text-muted-foreground">
							{"  "}(You)
						</Text>
					)}
				</Text>
				{isMine && (
					<Pressable onPress={onDelete} hitSlop={8} accessibilityLabel="Delete review">
						<Feather name="trash-2" size={16} color="#6b7280" />
					</Pressable>
				)}
			</View>
			<View className="flex-row items-center gap-2">
				<Stars value={review.rating} />
				<Muted className="text-xs">{formatDate(review.created_at)}</Muted>
			</View>
			{!!review.comment && (
				<Text className="text-sm leading-5">{review.comment}</Text>
			)}
		</View>
	);
}

export function ReviewsSection({ productId }: { productId: string }) {
	const { data: reviews, isLoading } = useReviews(productId);
	const { data: myReview } = useMyReview(productId);
	const upsertReview = useUpsertReview(productId);
	const deleteReview = useDeleteReview(productId);

	const [rating, setRating] = useState(0);
	const [comment, setComment] = useState("");

	// Prefill the form with the user's existing review, if any.
	useEffect(() => {
		if (myReview) {
			setRating(myReview.rating);
			setComment(myReview.comment ?? "");
		}
	}, [myReview]);

	function submit() {
		if (rating < 1) {
			Alert.alert("Add a rating", "Please tap a star rating first.");
			return;
		}
		upsertReview.mutate(
			{ rating, comment },
			{
				onSuccess: () =>
					Alert.alert(
						myReview ? "Review updated" : "Review posted",
						"Thanks for your feedback!",
					),
				onError: (e: any) =>
					Alert.alert("Couldn't save review", e.message ?? "Try again."),
			},
		);
	}

	function confirmDelete(reviewId: string) {
		Alert.alert("Delete review", "Remove your review for this product?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: () => {
					deleteReview.mutate(reviewId);
					setRating(0);
					setComment("");
				},
			},
		]);
	}

	return (
		<View className="gap-3 pt-4 border-t border-border">
			<Text className="text-base font-semibold">Ratings &amp; Reviews</Text>

			{/* Write / edit your review */}
			<View className="gap-2 rounded-lg border border-border p-3">
				<Text className="text-sm font-semibold">
					{myReview ? "Edit your review" : "Write a review"}
				</Text>
				<Stars value={rating} size={26} onChange={setRating} />
				<Input
					placeholder="Share your thoughts (optional)"
					value={comment}
					onChangeText={setComment}
					multiline
					className="min-h-16 py-2"
					editable={!upsertReview.isPending}
				/>
				<Button
					size="sm"
					variant="default"
					disabled={upsertReview.isPending}
					onPress={submit}
				>
					{upsertReview.isPending ? (
						<ActivityIndicator size="small" />
					) : (
						<Text>{myReview ? "Update review" : "Post review"}</Text>
					)}
				</Button>
			</View>

			{/* Existing reviews */}
			{isLoading ? (
				<ActivityIndicator size="small" />
			) : !reviews || reviews.length === 0 ? (
				<Muted className="text-sm">No reviews yet. Be the first!</Muted>
			) : (
				<View>
					{reviews.map((r) => (
						<ReviewRow
							key={r.id}
							review={r}
							isMine={!!myReview && r.id === myReview.id}
							onDelete={() => confirmDelete(r.id)}
						/>
					))}
				</View>
			)}
		</View>
	);
}
