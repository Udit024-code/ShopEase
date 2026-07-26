import { ActivityIndicator, Alert, FlatList, Pressable, View } from "react-native";
import { Stack, router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Muted } from "@/components/ui/typography";
import {
	useAddresses,
	useDeleteAddress,
	useSetDefaultAddress,
	type Address,
} from "@/hooks/useAddresses";

function formatAddress(a: Address) {
	return [a.line1, a.line2, a.city, a.state, a.postal_code, a.country]
		.filter(Boolean)
		.join(", ");
}

function AddressCard({ address }: { address: Address }) {
	const deleteAddress = useDeleteAddress();
	const setDefault = useSetDefaultAddress();

	function confirmDelete() {
		Alert.alert("Delete address", "Remove this address?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: () => deleteAddress.mutate(address.id),
			},
		]);
	}

	return (
		<View className="rounded-xl border border-border p-4 gap-2">
			<View className="flex-row items-center gap-2">
				<Text className="text-base font-semibold">
					{address.label || address.full_name}
				</Text>
				{address.is_default && (
					<View className="rounded bg-brand px-1.5 py-0.5">
						<Text className="text-xs font-semibold text-brand-foreground">
							Default
						</Text>
					</View>
				)}
			</View>

			<Text className="text-sm">{address.full_name}</Text>
			<Muted className="text-sm">{address.phone}</Muted>
			<Muted className="text-sm leading-5">{formatAddress(address)}</Muted>

			<View className="flex-row items-center gap-4 pt-2 border-t border-border mt-1">
				<Pressable
					className="flex-row items-center gap-1.5 py-1"
					onPress={() =>
						router.push({
							pathname: "/address/edit",
							params: { id: address.id },
						})
					}
				>
					<Feather name="edit-2" size={15} color="#6b7280" />
					<Text className="text-sm">Edit</Text>
				</Pressable>

				<Pressable
					className="flex-row items-center gap-1.5 py-1"
					onPress={confirmDelete}
				>
					<Feather name="trash-2" size={15} color="#6b7280" />
					<Text className="text-sm">Delete</Text>
				</Pressable>

				{!address.is_default && (
					<Pressable
						className="flex-row items-center gap-1.5 py-1 ml-auto"
						onPress={() => setDefault.mutate(address.id)}
					>
						<Feather name="check-circle" size={15} color="#059669" />
						<Text className="text-sm text-brand">Set default</Text>
					</Pressable>
				)}
			</View>
		</View>
	);
}

export default function AddressList() {
	const { data: addresses, isLoading, isError } = useAddresses();

	return (
		<View className="flex-1 bg-background">
			<Stack.Screen
				options={{ headerShown: true, headerTitle: "Addresses" }}
			/>

			{isLoading ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator />
				</View>
			) : isError ? (
				<View className="flex-1 items-center justify-center p-4 gap-2">
					<Text className="text-base font-semibold">
						Couldn&apos;t load addresses
					</Text>
					<Muted className="text-center">Something went wrong.</Muted>
				</View>
			) : !addresses || addresses.length === 0 ? (
				<View className="flex-1 items-center justify-center p-6 gap-3">
					<Feather name="map-pin" size={40} color="#9ca3af" />
					<Text className="text-base font-semibold">No addresses yet</Text>
					<Muted className="text-center">
						Add a delivery address to use at checkout.
					</Muted>
					<Button
						variant="default"
						size="default"
						onPress={() => router.push("/address/edit")}
					>
						<Text>Add Address</Text>
					</Button>
				</View>
			) : (
				<FlatList
					data={addresses}
					keyExtractor={(item) => item.id}
					contentContainerClassName="p-4 gap-3"
					showsVerticalScrollIndicator={false}
					renderItem={({ item }) => <AddressCard address={item} />}
					ListFooterComponent={
						<Button
							className="mt-2"
							variant="secondary"
							size="default"
							onPress={() => router.push("/address/edit")}
						>
							<Text>Add Another Address</Text>
						</Button>
					}
				/>
			)}
		</View>
	);
}
