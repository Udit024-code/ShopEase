import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import {
	Dimensions,
	NativeScrollEvent,
	NativeSyntheticEvent,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { Image } from "@/components/image";
import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Text as UIText } from "@/components/ui/text";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
	{
		image: require("@/assets/onboarding/slide-1-browse.jpg"),
		title: "Discover products you'll love",
		subtitle: "Browse thousands of items curated just for you.",
	},
	{
		image: require("@/assets/onboarding/slide-2-checkout.jpg"),
		title: "Checkout in seconds",
		subtitle: "Save your details once and breeze through every order.",
	},
	{
		image: require("@/assets/onboarding/slide-3-delivery.jpg"),
		title: "Track every order",
		subtitle: "Know exactly where your delivery is, every step of the way.",
	},
];

export default function Onboarding() {
	const scrollRef = useRef<ScrollView>(null);
	const [activeIndex, setActiveIndex] = useState(0);
	const isLastSlide = activeIndex === SLIDES.length - 1;

	// Android can restore a stale native scroll position across reloads/remounts.
	// Force slide 1 on every mount so onboarding always starts from the beginning.
	useEffect(() => {
		scrollRef.current?.scrollTo({ x: 0, animated: false });
		setActiveIndex(0);
	}, []);

	function goToWelcome() {
		router.replace("/welcome");
	}

	function handleScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
		const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
		setActiveIndex(index);
	}

	function handleNext() {
		if (isLastSlide) {
			goToWelcome();
			return;
		}
		const nextIndex = activeIndex + 1;
		scrollRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
		setActiveIndex(nextIndex);
	}

	return (
		<View className="flex-1 bg-black">
			<ScrollView
				ref={scrollRef}
				className="flex-1"
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				onMomentumScrollEnd={handleScrollEnd}
			>
				{SLIDES.map((slide, index) => (
					<View key={index} style={{ width: SCREEN_WIDTH, height: "100%" }}>
						<Image
							source={slide.image}
							className="absolute inset-0 w-full h-full"
							contentFit="cover"
						/>
						<LinearGradient
							colors={["transparent", "rgba(0,0,0,0.15)", "rgba(0,0,0,0.85)"]}
							locations={[0, 0.55, 1]}
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
							}}
						/>
					</View>
				))}
			</ScrollView>

			<SafeAreaView
				style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
				pointerEvents="box-none"
			>
				<Pressable
					onPress={goToWelcome}
					className="absolute right-4 top-4 rounded-full bg-white/20 px-4 py-2"
				>
					<Text className="text-sm font-semibold text-white">Skip</Text>
				</Pressable>

				<View className="flex-1 justify-end p-6 gap-6">
					<View className="flex-row gap-2">
						{SLIDES.map((_, index) => (
							<View
								key={index}
								className={
									index === activeIndex
										? "h-2 w-6 rounded-full bg-primary"
										: "h-2 w-2 rounded-full bg-white/50"
								}
							/>
						))}
					</View>

					<View className="gap-2">
						<Text className="text-3xl font-extrabold leading-tight text-white">
							{SLIDES[activeIndex].title}
						</Text>
						<Text className="text-base leading-snug text-white/85">
							{SLIDES[activeIndex].subtitle}
						</Text>
					</View>

					<Button size="default" variant="default" onPress={handleNext}>
						<UIText>{isLastSlide ? "Get Started" : "Next"}</UIText>
					</Button>
				</View>
			</SafeAreaView>
		</View>
	);
}
