import "../global.css";

import { useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "@/context/supabase-provider";
import { useColorScheme } from "@/lib/useColorScheme";
import { colors } from "@/constants/colors";

export default function AppLayout() {
	const { colorScheme } = useColorScheme();
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 60 * 1000,
						retry: 2,
					},
				},
			}),
	);

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<QueryClientProvider client={queryClient}>
					<AuthProvider>
						<Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
							<Stack.Screen name="index" />
							<Stack.Screen name="onboarding" />
							<Stack.Screen name="(protected)" />
							<Stack.Screen
								name="sign-up"
								options={{
									presentation: "modal",
									headerShown: true,
									headerTitle: "Sign Up",
									headerStyle: {
										backgroundColor:
											colorScheme === "dark"
												? colors.dark.background
												: colors.light.background,
									},
									headerTintColor:
										colorScheme === "dark"
											? colors.dark.foreground
											: colors.light.foreground,
									gestureEnabled: true,
								}}
							/>
							<Stack.Screen
								name="sign-in"
								options={{
									presentation: "modal",
									headerShown: true,
									headerTitle: "Sign In",
									headerStyle: {
										backgroundColor:
											colorScheme === "dark"
												? colors.dark.background
												: colors.light.background,
									},
									headerTintColor:
										colorScheme === "dark"
											? colors.dark.foreground
											: colors.light.foreground,
									gestureEnabled: true,
								}}
							/>
							<Stack.Screen
								name="forgot-password"
								options={{
									presentation: "modal",
									headerShown: true,
									headerTitle: "Reset Password",
									headerStyle: {
										backgroundColor:
											colorScheme === "dark"
												? colors.dark.background
												: colors.light.background,
									},
									headerTintColor:
										colorScheme === "dark"
											? colors.dark.foreground
											: colors.light.foreground,
									gestureEnabled: true,
								}}
							/>
						</Stack>
					</AuthProvider>
				</QueryClientProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
