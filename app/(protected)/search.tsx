import { useEffect, useState } from "react";
import {
	FlatList,
	Pressable,
	TextInput,
	View,
} from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { Text } from "@/components/ui/text";
import { Muted } from "@/components/ui/typography";
import { ProductCard } from "@/components/product/product-card";
import { FilterSheet } from "@/components/product/filter-sheet";
import {
	DEFAULT_FILTERS,
	activeFilterCount,
	useSearchProducts,
	type SearchFilters,
} from "@/hooks/useSearch";
import { useRecentSearches } from "@/hooks/useRecentSearches";

export default function Search() {
	const insets = useSafeAreaInsets();
	const [query, setQuery] = useState("");
	const [debounced, setDebounced] = useState("");
	const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
	const [filterOpen, setFilterOpen] = useState(false);

	const { recent, addRecent, clearRecent } = useRecentSearches();

	useEffect(() => {
		const t = setTimeout(() => setDebounced(query.trim()), 350);
		return () => clearTimeout(t);
	}, [query]);

	const {
		data: results,
		isLoading,
		isFetching,
		isError,
	} = useSearchProducts(debounced, filters);

	const hasQuery = debounced.length > 0;
	const filterCount = activeFilterCount(filters);

	return (
		<View className="flex-1 bg-background">
			<Stack.Screen options={{ headerShown: false }} />

			<View
				className="flex-row items-center gap-2 px-3 pb-2 border-b border-border"
				style={{ paddingTop: insets.top + 8 }}
			>
				<Pressable onPress={() => router.back()} hitSlop={8}>
					<Feather name="arrow-left" size={24} />
				</Pressable>
				<View className="flex-1 flex-row items-center gap-2 rounded-lg bg-muted px-3 h-11">
					<Feather name="search" size={18} color="#6b7280" />
					<TextInput
						className="flex-1 text-base text-foreground"
						placeholder="Search products, brands…"
						placeholderTextColor="#9ca3af"
						value={query}
						onChangeText={setQuery}
						autoFocus
						autoCapitalize="none"
						autoCorrect={false}
						returnKeyType="search"
						onSubmitEditing={() => debounced && addRecent(debounced)}
					/>
					{query.length > 0 && (
						<Pressable onPress={() => setQuery("")} hitSlop={8}>
							<Feather name="x" size={18} color="#6b7280" />
						</Pressable>
					)}
				</View>
			</View>

			{hasQuery && (
				<View className="flex-row items-center justify-between px-4 py-2.5 border-b border-border">
					<Muted className="text-sm">
						{isLoading || isFetching
							? "Searching…"
							: `${results?.length ?? 0} result${
									results?.length === 1 ? "" : "s"
								}`}
					</Muted>
					<Pressable
						className="flex-row items-center gap-1.5"
						onPress={() => setFilterOpen(true)}
					>
						<Feather name="sliders" size={16} color="#059669" />
						<Text className="text-sm text-brand">
							Sort & filter{filterCount > 0 ? ` (${filterCount})` : ""}
						</Text>
					</Pressable>
				</View>
			)}

			{!hasQuery ? (
				<View className="p-4 gap-3">
					{recent.length > 0 ? (
						<>
							<View className="flex-row items-center justify-between">
								<Text className="text-sm font-semibold">Recent searches</Text>
								<Pressable onPress={clearRecent} hitSlop={8}>
									<Text className="text-sm text-brand">Clear</Text>
								</Pressable>
							</View>
							<View className="flex-row flex-wrap gap-2">
								{recent.map((term) => (
									<Pressable
										key={term}
										className="rounded-full border border-border px-3 py-1.5"
										onPress={() => setQuery(term)}
									>
										<Text className="text-sm">{term}</Text>
									</Pressable>
								))}
							</View>
						</>
					) : (
						<View className="items-center justify-center py-20 gap-2">
							<Feather name="search" size={40} color="#9ca3af" />
							<Muted className="text-center">
								Search for products by name or brand.
							</Muted>
						</View>
					)}
				</View>
			) : isError ? (
				<View className="flex-1 items-center justify-center p-4 gap-2">
					<Text className="text-base font-semibold">Search failed</Text>
					<Muted className="text-center">Something went wrong.</Muted>
				</View>
			) : !isLoading && (results?.length ?? 0) === 0 ? (
				<View className="flex-1 items-center justify-center p-6 gap-2">
					<Feather name="package" size={40} color="#9ca3af" />
					<Text className="text-base font-semibold">No results</Text>
					<Muted className="text-center">
						No products match “{debounced}”. Try a different search or adjust
						filters.
					</Muted>
				</View>
			) : (
				<FlatList
					data={results ?? []}
					keyExtractor={(item) => item.id}
					numColumns={2}
					columnWrapperClassName="gap-3 px-4"
					contentContainerClassName="gap-4 py-4"
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
					renderItem={({ item }) => (
						<View className="flex-1">
							<ProductCard product={item} widthClassName="w-full" />
						</View>
					)}
				/>
			)}

			<FilterSheet
				visible={filterOpen}
				filters={filters}
				onApply={(f) => {
					setFilters(f);
					setFilterOpen(false);
				}}
				onClose={() => setFilterOpen(false)}
			/>
		</View>
	);
}
