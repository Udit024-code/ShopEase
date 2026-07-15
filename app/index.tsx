import { Redirect } from "expo-router";
import { useAuth } from "@/context/supabase-provider";

export default function Index() {
	const { initialized, session } = useAuth();

	if (!initialized) {
		return null;
	}

	if (session) {
		return <Redirect href="/(protected)/(tabs)" />;
	}

	return <Redirect href="/welcome" />;
}
