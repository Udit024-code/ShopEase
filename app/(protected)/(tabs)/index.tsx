import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useQueryClient } from "@tanstack/react-query";

import { Text } from "@/components/ui/text";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { CategoryChips } from "@/components/home/category-chips";
import { HomeHeader } from "@/components/home/home-header";
import {
	DealsRail,
	NewArrivalsRail,
	TopRatedRail,
} from "@/components/home/home-rails";

export default function Home() {
	const queryClient = useQueryClient();
	const [refreshing, setRefreshing] = useState(false);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		try {
			await queryClient.invalidateQueries();
		} finally {
			setRefreshing(false);
		}
	}, [queryClient]);

	return (
		<View className="flex-1 bg-background">
			<StatusBar style="light" />
			<HomeHeader />
			<ScrollView
				contentContainerClassName="gap-6 py-4"
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor="#059669"
						colors={["#059669"]}
					/>
				}
			>
				<BannerCarousel />
				<View className="gap-3">
					<Text className="px-4 text-base font-semibold">
						Shop by category
					</Text>
					<CategoryChips />
				</View>
				<DealsRail />
				<NewArrivalsRail />
				<TopRatedRail />
			</ScrollView>
		</View>
	);
}
