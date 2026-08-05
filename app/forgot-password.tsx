import { useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { router } from "expo-router";

import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { H1, Muted } from "@/components/ui/typography";
import { supabase } from "@/config/supabase";

type Stage = "request" | "reset";

function isValidEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function ForgotPassword() {
	const [stage, setStage] = useState<Stage>("request");
	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);

	async function sendResetCode() {
		if (!isValidEmail(email.trim())) {
			Alert.alert("Invalid email", "Please enter a valid email address.");
			return;
		}

		setSubmitting(true);
		try {
			const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
			if (error) throw error;
			setStage("reset");
			Alert.alert(
				"Check your email",
				"We sent a password reset code to your email. Enter it below along with your new password.",
			);
		} catch (error: any) {
			Alert.alert("Couldn't send code", error.message || "Please try again.");
		} finally {
			setSubmitting(false);
		}
	}

	async function resetPassword() {
		if (code.trim().length === 0) {
			Alert.alert("Missing code", "Enter the code we emailed you.");
			return;
		}
		if (password.length < 8) {
			Alert.alert("Weak password", "Use at least 8 characters.");
			return;
		}
		if (password !== confirmPassword) {
			Alert.alert("Passwords don't match", "Please re-enter your new password.");
			return;
		}

		setSubmitting(true);
		try {
			// Verify the emailed recovery code — on success this establishes a
			// session for the user, which updateUser then uses to set the password.
			const { error: verifyError } = await supabase.auth.verifyOtp({
				email: email.trim(),
				token: code.trim(),
				type: "recovery",
			});
			if (verifyError) throw verifyError;

			const { error: updateError } = await supabase.auth.updateUser({
				password,
			});
			if (updateError) throw updateError;

			Alert.alert(
				"Password updated",
				"Your password has been reset. You're now signed in.",
			);
			router.replace("/(protected)/(tabs)");
		} catch (error: any) {
			Alert.alert(
				"Reset failed",
				error.message || "The code may be invalid or expired. Try again.",
			);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<SafeAreaView className="flex-1 bg-background p-4" edges={["bottom"]}>
			<View className="flex-1 gap-4 web:m-4">
				<H1 className="self-start">Reset password</H1>

				{stage === "request" ? (
					<View className="gap-4">
						<Muted>
							Enter the email associated with your account and we&apos;ll send
							you a reset code.
						</Muted>
						<View className="gap-1.5">
							<Text className="text-sm font-medium">Email</Text>
							<Input
								placeholder="Email"
								value={email}
								onChangeText={setEmail}
								autoCapitalize="none"
								autoComplete="email"
								autoCorrect={false}
								keyboardType="email-address"
								editable={!submitting}
							/>
						</View>
					</View>
				) : (
					<View className="gap-4">
						<Muted>
							Enter the code sent to {email} and choose a new password.
						</Muted>
						<View className="gap-1.5">
							<Text className="text-sm font-medium">Reset code</Text>
							<Input
								placeholder="6-digit code"
								value={code}
								onChangeText={setCode}
								autoCapitalize="none"
								autoCorrect={false}
								keyboardType="number-pad"
								editable={!submitting}
							/>
						</View>
						<View className="gap-1.5">
							<Text className="text-sm font-medium">New password</Text>
							<Input
								placeholder="New password"
								value={password}
								onChangeText={setPassword}
								autoCapitalize="none"
								autoCorrect={false}
								secureTextEntry
								editable={!submitting}
							/>
						</View>
						<View className="gap-1.5">
							<Text className="text-sm font-medium">Confirm password</Text>
							<Input
								placeholder="Confirm password"
								value={confirmPassword}
								onChangeText={setConfirmPassword}
								autoCapitalize="none"
								autoCorrect={false}
								secureTextEntry
								editable={!submitting}
							/>
						</View>
						<Button
							variant="secondary"
							size="sm"
							disabled={submitting}
							onPress={sendResetCode}
						>
							<Text>Resend code</Text>
						</Button>
					</View>
				)}
			</View>

			<Button
				size="default"
				variant="default"
				className="web:m-4"
				disabled={submitting}
				onPress={stage === "request" ? sendResetCode : resetPassword}
			>
				{submitting ? (
					<ActivityIndicator size="small" />
				) : (
					<Text>{stage === "request" ? "Send reset code" : "Reset password"}</Text>
				)}
			</Button>
		</SafeAreaView>
	);
}
