import { useEffect, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import {
	DEFAULT_FILTERS,
	type SearchFilters,
	type SortOption,
} from "@/hooks/useSearch";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
	{ value: "newest", label: "Newest" },
	{ value: "price_asc", label: "Price: Low to High" },
	{ value: "price_desc", label: "Price: High to Low" },
	{ value: "rating", label: "Rating" },
];

const RATING_OPTIONS: { value: number; label: string }[] = [
	{ value: 0, label: "Any" },
	{ value: 3, label: "3.0+" },
	{ value: 4, label: "4.0+" },
	{ value: 4.5, label: "4.5+" },
];

type FilterSheetProps = {
	visible: boolean;
	filters: SearchFilters;
	onApply: (filters: SearchFilters) => void;
	onClose: () => void;
};

function SelectableChip({
	label,
	selected,
	onPress,
}: {
	label: string;
	selected: boolean;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			className={
				selected
					? "rounded-full border border-brand bg-brand/10 px-3 py-1.5"
					: "rounded-full border border-border px-3 py-1.5"
			}
		>
			<Text className={selected ? "text-sm text-brand" : "text-sm"}>
				{label}
			</Text>
		</Pressable>
	);
}

export function FilterSheet({
	visible,
	filters,
	onApply,
	onClose,
}: FilterSheetProps) {
	const insets = useSafeAreaInsets();
	const [draft, setDraft] = useState<SearchFilters>(filters);

	// Re-sync the draft whenever the sheet is opened with the committed filters.
	useEffect(() => {
		if (visible) setDraft(filters);
	}, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<Modal
			visible={visible}
			transparent
			animationType="slide"
			onRequestClose={onClose}
		>
			<View className="flex-1 justify-end">
				<Pressable className="flex-1 bg-black/40" onPress={onClose} />

				<View
					className="bg-background rounded-t-2xl p-4 gap-5"
					style={{ paddingBottom: insets.bottom + 16 }}
				>
					<View className="flex-row items-center justify-between">
						<Text className="text-lg font-semibold">Sort & filter</Text>
						<Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close">
							<Feather name="x" size={22} color="#6b7280" />
						</Pressable>
					</View>

					<View className="gap-2">
						<Text className="text-sm font-semibold">Sort by</Text>
						<View className="flex-row flex-wrap gap-2">
							{SORT_OPTIONS.map((opt) => (
								<SelectableChip
									key={opt.value}
									label={opt.label}
									selected={draft.sort === opt.value}
									onPress={() => setDraft((d) => ({ ...d, sort: opt.value }))}
								/>
							))}
						</View>
					</View>

					<View className="gap-2">
						<Text className="text-sm font-semibold">Minimum rating</Text>
						<View className="flex-row flex-wrap gap-2">
							{RATING_OPTIONS.map((opt) => (
								<SelectableChip
									key={opt.value}
									label={opt.label}
									selected={draft.minRating === opt.value}
									onPress={() =>
										setDraft((d) => ({ ...d, minRating: opt.value }))
									}
								/>
							))}
						</View>
					</View>

					<View className="gap-2">
						<Text className="text-sm font-semibold">Filter</Text>
						<View className="flex-row flex-wrap gap-2">
							<SelectableChip
								label="On sale"
								selected={draft.onSaleOnly}
								onPress={() =>
									setDraft((d) => ({ ...d, onSaleOnly: !d.onSaleOnly }))
								}
							/>
							<SelectableChip
								label="In stock"
								selected={draft.inStockOnly}
								onPress={() =>
									setDraft((d) => ({ ...d, inStockOnly: !d.inStockOnly }))
								}
							/>
						</View>
					</View>

					<View className="flex-row gap-3 pt-1">
						<Button
							className="flex-1"
							variant="secondary"
							size="default"
							onPress={() => setDraft(DEFAULT_FILTERS)}
						>
							<Text>Clear all</Text>
						</Button>
						<Button
							className="flex-1"
							variant="default"
							size="default"
							onPress={() => onApply(draft)}
						>
							<Text>Apply</Text>
						</Button>
					</View>
				</View>
			</View>
		</Modal>
	);
}
