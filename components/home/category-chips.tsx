import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { Text } from "@/components/ui/text";
import { useColorScheme } from "@/lib/useColorScheme";
import { colors } from "@/constants/colors";
import { useTopLevelCategories } from "@/hooks/useCategories";

type FeatherIconName = keyof typeof Feather.glyphMap;

const ICON_BY_SLUG: Record<string, FeatherIconName> = {
	electronics: "cpu",
	fashion: "shopping-bag",
	"home-kitchen": "home",
	beauty: "feather",
	sports: "activity",
	books: "book-open",
};

const DEFAULT_ICON: FeatherIconName = "grid";

// Short chip labels — the full category names ("Beauty & Personal Care") are
// too long for a compact chip, so show a tight label and fall back to the full
// name for anything unmapped.
const SHORT_LABEL_BY_SLUG: Record<string, string> = {
	electronics: "Electronics",
	fashion: "Fashion",
	"home-kitchen": "Home",
	beauty: "Beauty",
	sports: "Sports",
	books: "Books",
};

function CategoryChipsSkeleton() {
	return (
		<View className="flex-row px-4">
			{[1, 2, 3, 4, 5, 6].map((i) => (
				<View key={i} className="flex-1 items-center">
					<View className="w-14 h-14 rounded-full bg-muted" />
				</View>
			))}
		</View>
	);
}

export function CategoryChips() {
	const { data: categories, isLoading, isError } = useTopLevelCategories();
	const { colorScheme } = useColorScheme();
	const iconColor =
		colorScheme === "dark" ? colors.dark.foreground : colors.light.foreground;

	if (isLoading) return <CategoryChipsSkeleton />;
	if (isError || !categories || categories.length === 0) return null;

	// Top-level categories are a small fixed set, so distribute them evenly
	// across the padded row (symmetric margins) rather than a horizontal scroll
	// that clips the last chip when it barely overflows.
	return (
		<View className="flex-row px-4">
			{categories.map((category) => (
				<Pressable
					key={category.id}
					className="flex-1 items-center gap-1.5"
					onPress={() =>
						router.push({
							pathname: "/category/[id]",
							params: { id: category.id },
						})
					}
				>
					<View className="w-14 h-14 rounded-full bg-muted items-center justify-center">
						<Feather
							name={
								(category.slug && ICON_BY_SLUG[category.slug]) ||
								DEFAULT_ICON
							}
							size={22}
							color={iconColor}
						/>
					</View>
					<Text className="text-xs text-center" numberOfLines={1}>
						{(category.slug && SHORT_LABEL_BY_SLUG[category.slug]) ||
							category.name}
					</Text>
				</Pressable>
			))}
		</View>
	);
}
