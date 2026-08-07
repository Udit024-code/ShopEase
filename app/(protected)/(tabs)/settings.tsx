import { useCallback, useEffect, useState } from "react";
import { router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	ActivityIndicator,
	Alert,
	Linking,
	Pressable,
	ScrollView,
	View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Constants from "expo-constants";
import { Feather } from "@expo/vector-icons";
import * as z from "zod";

import { Image } from "@/components/image";
import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormInput, FormTextarea } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { H1, H4, Muted } from "@/components/ui/typography";
import { useAuth } from "@/context/supabase-provider";
import { useColorScheme } from "@/lib/useColorScheme";
import {
	useThemePreference,
	type ThemePreference,
} from "@/hooks/useThemePreference";
import { useNotificationPrefs } from "@/hooks/useNotificationPrefs";
import { colors } from "@/constants/colors";
import { supabase } from "@/config/supabase";

const PRIVACY_URL =
	"https://udit024-code.github.io/ShopEase/privacy-policy.html";
const TERMS_URL = "https://udit024-code.github.io/ShopEase/terms.html";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
	{ value: "system", label: "System" },
];

const formSchema = z.object({
	username: z
		.string()
		.trim()
		.toLowerCase()
		.refine((val) => val === "" || /^[a-z0-9_]{3,30}$/.test(val), {
			message: "Use 3-30 lowercase letters, numbers, or underscores.",
		}),
	displayName: z
		.string()
		.trim()
		.max(60, "Keep your display name under 60 characters."),
	bio: z.string().trim().max(280, "Keep your bio under 280 characters."),
});

type FormValues = z.infer<typeof formSchema>;

function getInitials(...candidates: Array<string | null | undefined>) {
	const source = candidates.find((c) => !!c && c.trim().length > 0);
	if (!source) return "?";
	return source.trim().slice(0, 2).toUpperCase();
}

export default function Settings() {
	const { session, signOut } = useAuth();
	const { colorScheme } = useColorScheme();
	const primaryForegroundColor =
		colorScheme === "dark"
			? colors.dark.primaryForeground
			: colors.light.primaryForeground;
	const mutedForegroundColor =
		colorScheme === "dark"
			? colors.dark.mutedForeground
			: colors.light.mutedForeground;

	const [loadingProfile, setLoadingProfile] = useState(true);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [uploadingAvatar, setUploadingAvatar] = useState(false);
	const [deletingAccount, setDeletingAccount] = useState(false);

	const { preference: themePreference, setPreference: setThemePreference } =
		useThemePreference();
	const { prefs: notificationPrefs, setPref: setNotificationPref } =
		useNotificationPrefs();
	const appVersion = Constants.expoConfig?.version ?? "1.0.0";

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: { username: "", displayName: "", bio: "" },
	});

	const loadProfile = useCallback(async () => {
		if (!session?.user) return;

		const { data, error } = await supabase
			.from("profiles")
			.select("username, display_name, bio, avatar_url")
			.eq("id", session.user.id)
			.single();

		if (error) {
			console.error("Failed to load profile:", error.message);
		} else if (data) {
			form.reset({
				username: data.username ?? "",
				displayName: data.display_name ?? "",
				bio: data.bio ?? "",
			});
			setAvatarUrl(data.avatar_url);
		}

		setLoadingProfile(false);
	}, [session?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		loadProfile();
	}, [loadProfile]);

	async function uploadAvatar(asset: ImagePicker.ImagePickerAsset) {
		if (!session?.user) return;

		setUploadingAvatar(true);
		try {
			const ext = asset.uri.split(".").pop()?.toLowerCase() || "jpg";
			const path = `${session.user.id}/avatar.${ext}`;
			const arraybuffer = await fetch(asset.uri).then((res) =>
				res.arrayBuffer(),
			);

			const { error: uploadError } = await supabase.storage
				.from("avatars")
				.upload(path, arraybuffer, {
					contentType: asset.mimeType ?? "image/jpeg",
					upsert: true,
				});

			if (uploadError) throw uploadError;

			const { data } = supabase.storage.from("avatars").getPublicUrl(path);
			const bustedUrl = `${data.publicUrl}?updated=${Date.now()}`;

			const { error: updateError } = await supabase
				.from("profiles")
				.update({ avatar_url: bustedUrl })
				.eq("id", session.user.id);

			if (updateError) throw updateError;

			setAvatarUrl(bustedUrl);
		} catch (error: any) {
			Alert.alert(
				"Upload Failed",
				error.message || "Could not update your avatar.",
			);
		} finally {
			setUploadingAvatar(false);
		}
	}

	async function pickAvatar() {
		const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (!permission.granted) {
			Alert.alert(
				"Photo Access Needed",
				permission.canAskAgain
					? "We need access to your photos to set an avatar."
					: "Enable photo access for ShopEase in your device settings to change your avatar.",
			);
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.7,
		});

		if (result.canceled || !result.assets[0]) return;

		await uploadAvatar(result.assets[0]);
	}

	async function onSubmit(values: FormValues) {
		if (!session?.user) return;

		const { error } = await supabase
			.from("profiles")
			.update({
				username: values.username || null,
				display_name: values.displayName || null,
				bio: values.bio || null,
			})
			.eq("id", session.user.id);

		if (error) {
			if (error.code === "23505") {
				form.setError("username", {
					message: "That username is already taken.",
				});
				return;
			}
			Alert.alert("Update Failed", error.message || "Something went wrong.");
			return;
		}

		Alert.alert("Saved", "Your profile has been updated.");
	}

	async function confirmDeleteAccount() {
		Alert.alert(
			"Delete account",
			"This permanently deletes your account, orders, addresses, cart, and wishlist. This cannot be undone.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: deleteAccount,
				},
			],
		);
	}

	async function deleteAccount() {
		setDeletingAccount(true);
		try {
			const { error } = await supabase.functions.invoke("delete-account");
			if (error) throw error;
			// The account is gone; clear the local session and return to start.
			await signOut();
		} catch (error: any) {
			setDeletingAccount(false);
			Alert.alert(
				"Deletion failed",
				error.message || "Could not delete your account. Please try again.",
			);
		}
	}

	if (loadingProfile) {
		return (
			<SafeAreaView className="flex-1 items-center justify-center bg-background">
				<ActivityIndicator size="small" />
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
			<ScrollView
				className="flex-1"
				contentContainerClassName="p-4 gap-6"
				keyboardShouldPersistTaps="handled"
			>
				<H1>Settings</H1>

				<View className="items-center gap-3">
					<Pressable onPress={pickAvatar} disabled={uploadingAvatar}>
						<View className="w-24 h-24 rounded-full bg-muted items-center justify-center overflow-hidden">
							{avatarUrl ? (
								<Image
									source={{ uri: avatarUrl }}
									className="w-24 h-24"
									contentFit="cover"
								/>
							) : (
								<Text className="text-2xl font-medium text-muted-foreground">
									{getInitials(
										form.getValues("displayName"),
										form.getValues("username"),
										session?.user?.email,
									)}
								</Text>
							)}
							{uploadingAvatar && (
								<View className="absolute inset-0 items-center justify-center bg-black/40">
									<ActivityIndicator color="#fff" />
								</View>
							)}
						</View>
						<View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary items-center justify-center border-2 border-background">
							<Feather name="camera" size={14} color={primaryForegroundColor} />
						</View>
					</Pressable>
					<Muted>Tap the avatar to change your photo</Muted>
				</View>

				<Form {...form}>
					<View className="gap-4">
						<FormField
							control={form.control}
							name="username"
							render={({ field }) => (
								<FormInput
									label="Username"
									placeholder="username"
									autoCapitalize="none"
									autoCorrect={false}
									maxLength={30}
									{...field}
								/>
							)}
						/>
						<FormField
							control={form.control}
							name="displayName"
							render={({ field }) => (
								<FormInput
									label="Display Name"
									placeholder="How your name appears to others"
									maxLength={60}
									{...field}
								/>
							)}
						/>
						<FormField
							control={form.control}
							name="bio"
							render={({ field }) => (
								<FormTextarea
									label="Bio"
									placeholder="Tell us a little about yourself"
									maxLength={280}
									{...field}
								/>
							)}
						/>
					</View>
				</Form>

				<Button
					size="default"
					variant="default"
					onPress={form.handleSubmit(onSubmit)}
					disabled={form.formState.isSubmitting}
				>
					{form.formState.isSubmitting ? (
						<ActivityIndicator size="small" />
					) : (
						<Text>Save Changes</Text>
					)}
				</Button>

				<View className="pt-4 border-t border-border">
					<Pressable
						className="flex-row items-center gap-3 py-3"
						onPress={() => router.push("/orders")}
					>
						<Feather name="package" size={20} color={mutedForegroundColor} />
						<Text className="flex-1 text-base">My orders</Text>
						<Feather
							name="chevron-right"
							size={20}
							color={mutedForegroundColor}
						/>
					</Pressable>
					<Pressable
						className="flex-row items-center gap-3 py-3"
						onPress={() => router.push("/address")}
					>
						<Feather name="map-pin" size={20} color={mutedForegroundColor} />
						<Text className="flex-1 text-base">Addresses</Text>
						<Feather
							name="chevron-right"
							size={20}
							color={mutedForegroundColor}
						/>
					</Pressable>
				</View>

				<View className="gap-2 pt-4 border-t border-border">
					<Text className="text-base font-semibold">Appearance</Text>
					<View className="flex-row gap-2">
						{THEME_OPTIONS.map((opt) => {
							const selected = themePreference === opt.value;
							return (
								<Pressable
									key={opt.value}
									onPress={() => setThemePreference(opt.value)}
									className={
										selected
											? "flex-1 items-center rounded-lg border border-brand bg-brand/10 py-2.5"
											: "flex-1 items-center rounded-lg border border-border py-2.5"
									}
								>
									<Text
										className={
											selected ? "text-sm font-medium text-brand" : "text-sm"
										}
									>
										{opt.label}
									</Text>
								</Pressable>
							);
						})}
					</View>
				</View>

				<View className="gap-3 pt-4 border-t border-border">
					<Text className="text-base font-semibold">Notifications</Text>
					<View className="flex-row items-center justify-between">
						<View className="flex-1 pr-3">
							<Text className="text-base">Order updates</Text>
							<Muted className="text-xs">Status changes for your orders</Muted>
						</View>
						<Switch
							checked={notificationPrefs.orderUpdates}
							onCheckedChange={(v) => setNotificationPref("orderUpdates", v)}
						/>
					</View>
					<View className="flex-row items-center justify-between">
						<View className="flex-1 pr-3">
							<Text className="text-base">Promotions</Text>
							<Muted className="text-xs">Deals, discounts, and offers</Muted>
						</View>
						<Switch
							checked={notificationPrefs.promotions}
							onCheckedChange={(v) => setNotificationPref("promotions", v)}
						/>
					</View>
				</View>

				<View className="gap-1 pt-4 border-t border-border">
					<Text className="text-base font-semibold">About</Text>
					<Pressable
						className="flex-row items-center gap-3 py-3"
						onPress={() => Linking.openURL(PRIVACY_URL)}
					>
						<Feather name="shield" size={20} color={mutedForegroundColor} />
						<Text className="flex-1 text-base">Privacy Policy</Text>
						<Feather
							name="external-link"
							size={18}
							color={mutedForegroundColor}
						/>
					</Pressable>
					<Pressable
						className="flex-row items-center gap-3 py-3"
						onPress={() => Linking.openURL(TERMS_URL)}
					>
						<Feather name="file-text" size={20} color={mutedForegroundColor} />
						<Text className="flex-1 text-base">Terms of Service</Text>
						<Feather
							name="external-link"
							size={18}
							color={mutedForegroundColor}
						/>
					</Pressable>
					<View className="flex-row items-center gap-3 py-3">
						<Feather name="info" size={20} color={mutedForegroundColor} />
						<Text className="flex-1 text-base">Version</Text>
						<Muted className="text-sm">{appVersion}</Muted>
					</View>
				</View>

				<View className="gap-2 pt-4 border-t border-border">
					<H4 className="text-center">Sign Out</H4>
					<Muted className="text-center">
						Sign out and return to the welcome screen.
					</Muted>
					<Button
						className="w-full"
						size="default"
						variant="secondary"
						disabled={deletingAccount}
						onPress={async () => {
							await signOut();
						}}
					>
						<Text>Sign Out</Text>
					</Button>
				</View>

				<View className="gap-2 pt-4 border-t border-border">
					<H4 className="text-center">Delete Account</H4>
					<Muted className="text-center">
						Permanently delete your account and all associated data.
					</Muted>
					<Button
						className="w-full"
						size="default"
						variant="destructive"
						disabled={deletingAccount}
						onPress={confirmDeleteAccount}
					>
						{deletingAccount ? (
							<ActivityIndicator size="small" color="#fff" />
						) : (
							<Text>Delete Account</Text>
						)}
					</Button>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
