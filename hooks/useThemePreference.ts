import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useColorScheme } from "@/lib/useColorScheme";

const STORAGE_KEY = "shopease:theme-preference";

export type ThemePreference = "light" | "dark" | "system";

/**
 * Reads the persisted theme choice on mount and applies it, and persists +
 * applies any change. "system" defers to the OS appearance. Safe to use in
 * multiple places — AsyncStorage is the source of truth and setColorScheme
 * is global.
 */
export function useThemePreference() {
	const { setColorScheme } = useColorScheme();
	const [preference, setPreferenceState] = useState<ThemePreference>("system");

	useEffect(() => {
		AsyncStorage.getItem(STORAGE_KEY)
			.then((raw) => {
				const pref = (raw as ThemePreference) ?? "system";
				setPreferenceState(pref);
				setColorScheme(pref);
			})
			.catch(() => {});
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const setPreference = useCallback(
		(pref: ThemePreference) => {
			setPreferenceState(pref);
			setColorScheme(pref);
			AsyncStorage.setItem(STORAGE_KEY, pref).catch(() => {});
		},
		[setColorScheme],
	);

	return { preference, setPreference };
}
