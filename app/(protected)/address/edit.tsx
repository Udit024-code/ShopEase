import { useEffect } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormField,
	FormInput,
	FormSwitch,
} from "@/components/ui/form";
import { Text } from "@/components/ui/text";
import {
	useAddress,
	useCreateAddress,
	useUpdateAddress,
} from "@/hooks/useAddresses";

const formSchema = z.object({
	label: z.string().trim().max(30, "Keep the label short."),
	fullName: z.string().trim().min(1, "Enter a full name."),
	phone: z
		.string()
		.trim()
		.min(7, "Enter a valid phone number.")
		.max(20, "Enter a valid phone number."),
	line1: z.string().trim().min(1, "Enter the street address."),
	line2: z.string().trim().max(120, "Keep this line short."),
	city: z.string().trim().min(1, "Enter the city."),
	state: z.string().trim().max(60, "Keep this short."),
	postalCode: z
		.string()
		.trim()
		.min(3, "Enter a valid postal code.")
		.max(12, "Enter a valid postal code."),
	country: z.string().trim().min(1, "Enter the country."),
	isDefault: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddressForm() {
	const { id } = useLocalSearchParams<{ id?: string }>();
	const isEditing = !!id;

	const { data: existing, isLoading } = useAddress(id);
	const createAddress = useCreateAddress();
	const updateAddress = useUpdateAddress();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			label: "",
			fullName: "",
			phone: "",
			line1: "",
			line2: "",
			city: "",
			state: "",
			postalCode: "",
			country: "India",
			isDefault: false,
		},
	});

	useEffect(() => {
		if (existing) {
			form.reset({
				label: existing.label ?? "",
				fullName: existing.full_name,
				phone: existing.phone,
				line1: existing.line1,
				line2: existing.line2 ?? "",
				city: existing.city,
				state: existing.state ?? "",
				postalCode: existing.postal_code,
				country: existing.country,
				isDefault: existing.is_default,
			});
		}
	}, [existing]); // eslint-disable-line react-hooks/exhaustive-deps

	async function onSubmit(values: FormValues) {
		const input = {
			label: values.label || null,
			full_name: values.fullName,
			phone: values.phone,
			line1: values.line1,
			line2: values.line2 || null,
			city: values.city,
			state: values.state || null,
			postal_code: values.postalCode,
			country: values.country,
			is_default: values.isDefault,
		};

		try {
			if (isEditing) {
				await updateAddress.mutateAsync({ id: id!, input });
			} else {
				await createAddress.mutateAsync(input);
			}
			router.back();
		} catch (e: any) {
			Alert.alert("Couldn't save address", e.message ?? "Try again.");
		}
	}

	if (isEditing && isLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-background">
				<Stack.Screen
					options={{ headerShown: true, headerTitle: "Edit address" }}
				/>
				<ActivityIndicator />
			</View>
		);
	}

	return (
		<View className="flex-1 bg-background">
			<Stack.Screen
				options={{
					headerShown: true,
					headerTitle: isEditing ? "Edit address" : "Add address",
				}}
			/>
			<ScrollView
				contentContainerClassName="p-4 gap-4"
				keyboardShouldPersistTaps="handled"
			>
				<Form {...form}>
					<View className="gap-4">
						<FormField
							control={form.control}
							name="label"
							render={({ field }) => (
								<FormInput
									label="Label (optional)"
									placeholder="Home, Work…"
									{...field}
								/>
							)}
						/>
						<FormField
							control={form.control}
							name="fullName"
							render={({ field }) => (
								<FormInput
									label="Full name"
									placeholder="Recipient's name"
									{...field}
								/>
							)}
						/>
						<FormField
							control={form.control}
							name="phone"
							render={({ field }) => (
								<FormInput
									label="Phone"
									placeholder="Contact number"
									keyboardType="phone-pad"
									{...field}
								/>
							)}
						/>
						<FormField
							control={form.control}
							name="line1"
							render={({ field }) => (
								<FormInput
									label="Address line 1"
									placeholder="House no., street"
									{...field}
								/>
							)}
						/>
						<FormField
							control={form.control}
							name="line2"
							render={({ field }) => (
								<FormInput
									label="Address line 2 (optional)"
									placeholder="Apartment, landmark"
									{...field}
								/>
							)}
						/>
						<FormField
							control={form.control}
							name="city"
							render={({ field }) => (
								<FormInput label="City" placeholder="City" {...field} />
							)}
						/>
						<FormField
							control={form.control}
							name="state"
							render={({ field }) => (
								<FormInput
									label="State (optional)"
									placeholder="State"
									{...field}
								/>
							)}
						/>
						<FormField
							control={form.control}
							name="postalCode"
							render={({ field }) => (
								<FormInput
									label="Postal code"
									placeholder="PIN / ZIP code"
									keyboardType="number-pad"
									{...field}
								/>
							)}
						/>
						<FormField
							control={form.control}
							name="country"
							render={({ field }) => (
								<FormInput label="Country" placeholder="Country" {...field} />
							)}
						/>
						<FormField
							control={form.control}
							name="isDefault"
							render={({ field }) => (
								<FormSwitch label="Set as default address" {...field} />
							)}
						/>
					</View>
				</Form>

				<Button
					size="default"
					variant="default"
					disabled={form.formState.isSubmitting}
					onPress={form.handleSubmit(onSubmit)}
				>
					{form.formState.isSubmitting ? (
						<ActivityIndicator size="small" />
					) : (
						<Text>{isEditing ? "Save Changes" : "Add Address"}</Text>
					)}
				</Button>
			</ScrollView>
		</View>
	);
}
