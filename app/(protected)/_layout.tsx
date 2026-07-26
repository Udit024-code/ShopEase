import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/context/supabase-provider";

export const unstable_settings = {
	initialRouteName: "(tabs)",
};

export default function ProtectedLayout() {
	const { initialized, session } = useAuth();

	if (!initialized) {
		return null;
	}

	if (!session) {
		return <Redirect href="/onboarding" />;
	}

	return (
		<Stack
			screenOptions={{
				headerShown: false,
			}}
		>
			<Stack.Screen name="(tabs)" />
			<Stack.Screen name="modal" options={{ presentation: "modal" }} />
			<Stack.Screen name="category/[id]" />
			<Stack.Screen name="product/[id]" />
			<Stack.Screen name="cart" />
			<Stack.Screen name="wishlist" />
			<Stack.Screen name="address/index" />
			<Stack.Screen name="address/edit" />
			<Stack.Screen name="search" />
			<Stack.Screen name="checkout" />
			<Stack.Screen name="orders/index" />
			<Stack.Screen name="orders/[id]" />
		</Stack>
	);
}
