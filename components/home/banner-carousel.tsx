import { useEffect, useRef, useState } from "react";
import {
	Alert,
	Dimensions,
	NativeScrollEvent,
	NativeSyntheticEvent,
	Pressable,
	ScrollView,
	View,
} from "react-native";

import { Image } from "@/components/image";
import { useActiveBanners } from "@/hooks/useBanners";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AUTO_ADVANCE_MS = 4000;

function BannerCarouselSkeleton() {
	return (
		<View className="px-4">
			<View className="w-full aspect-[2/1] rounded-xl bg-muted" />
		</View>
	);
}

export function BannerCarousel() {
	const { data: banners, isLoading, isError } = useActiveBanners();
	const scrollRef = useRef<ScrollView>(null);
	const [activeIndex, setActiveIndex] = useState(0);

	useEffect(() => {
		if (!banners || banners.length < 2) return;

		const interval = setInterval(() => {
			setActiveIndex((current) => {
				const nextIndex = (current + 1) % banners.length;
				scrollRef.current?.scrollTo({
					x: nextIndex * SCREEN_WIDTH,
					animated: true,
				});
				return nextIndex;
			});
		}, AUTO_ADVANCE_MS);

		return () => clearInterval(interval);
	}, [banners]);

	function handleScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
		const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
		setActiveIndex(index);
	}

	// TODO: wire real navigation once product/category screens exist —
	// banner.link already stores the intended destination path.
	function handlePress(title: string | null) {
		Alert.alert(
			title ?? "Promotion",
			"This will link to the relevant category or product once that screen is built.",
		);
	}

	if (isLoading) return <BannerCarouselSkeleton />;
	if (isError || !banners || banners.length === 0) return null;

	return (
		<View>
			<ScrollView
				ref={scrollRef}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				onMomentumScrollEnd={handleScrollEnd}
			>
				{banners.map((banner) => (
					<View key={banner.id} style={{ width: SCREEN_WIDTH }} className="px-4">
						<Pressable onPress={() => handlePress(banner.title)}>
							<Image
								source={{ uri: banner.image_url }}
								className="w-full aspect-[2/1] rounded-xl bg-muted"
								contentFit="cover"
								accessibilityLabel={banner.title ?? undefined}
							/>
						</Pressable>
					</View>
				))}
			</ScrollView>

			{banners.length > 1 && (
				<View className="flex-row justify-center gap-1.5 mt-3">
					{banners.map((banner, index) => (
						<View
							key={banner.id}
							className={
								index === activeIndex
									? "h-1.5 w-4 rounded-full bg-primary"
									: "h-1.5 w-1.5 rounded-full bg-muted"
							}
						/>
					))}
				</View>
			)}
		</View>
	);
}
