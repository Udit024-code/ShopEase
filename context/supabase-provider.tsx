import {
	createContext,
	PropsWithChildren,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { SplashScreen } from "expo-router";

import { Session } from "@supabase/supabase-js";

import { supabase } from "@/config/supabase";

SplashScreen.preventAutoHideAsync();

// Safety timeout: hide splash screen after 10s no matter what
setTimeout(() => {
	SplashScreen.hideAsync();
}, 10000);

type AuthState = {
	initialized: boolean;
	session: Session | null;
	signUp: (email: string, password: string) => Promise<void>;
	signIn: (email: string, password: string) => Promise<void>;
	signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthState>({
	initialized: false,
	session: null,
	signUp: async () => {},
	signIn: async () => {},
	signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: PropsWithChildren) {
	const [initialized, setInitialized] = useState(false);
	const [session, setSession] = useState<Session | null>(null);

	const signUp = useCallback(async (email: string, password: string) => {
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: "shop-ease://confirm-email",
			},
		});

		if (error) {
			throw error;
		}

		if (data.session) {
			setSession(data.session);
		}
	}, []);

	const signIn = useCallback(async (email: string, password: string) => {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			throw error;
		}

		if (data.session) {
			setSession(data.session);
		}
	}, []);

	const signOut = useCallback(async () => {
		setSession(null);
		const { error } = await supabase.auth.signOut();

		if (error) {
			console.error("Error signing out:", error);
		}
	}, []);

	useEffect(() => {
		let mounted = true;

		// Restore any persisted session BEFORE marking initialized, so the router
		// doesn't briefly see a null session and bounce a signed-in user to
		// onboarding on cold start.
		supabase.auth
			.getSession()
			.then(({ data: { session } }) => {
				if (mounted) setSession(session);
			})
			.catch(() => {})
			.finally(() => {
				if (mounted) setInitialized(true);
			});

		const { data: authListener } = supabase.auth.onAuthStateChange(
			(_event, session) => {
				if (mounted) {
					setSession(session);
				}
			},
		);

		return () => {
			mounted = false;
			authListener?.subscription.unsubscribe();
		};
	}, []);

	useEffect(() => {
		if (initialized) {
			SplashScreen.hideAsync();
		}
	}, [initialized]);

	return (
		<AuthContext.Provider
			value={{
				initialized,
				session,
				signUp,
				signIn,
				signOut,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}