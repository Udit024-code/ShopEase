import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "shopease:notification-prefs";

export type NotificationPrefs = {
	orderUpdates: boolean;
	promotions: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
	orderUpdates: true,
	promotions: true,
};

/**
 * Local notification preferences. These persist the user's choices; wiring
 * them to actual push delivery happens when push notifications are added.
 */
export function useNotificationPrefs() {
	const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

	useEffect(() => {
		AsyncStorage.getItem(STORAGE_KEY)
			.then((raw) => {
				if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
			})
			.catch(() => {});
	}, []);

	const setPref = useCallback((key: keyof NotificationPrefs, value: boolean) => {
		setPrefs((prev) => {
			const next = { ...prev, [key]: value };
			AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
			return next;
		});
	}, []);

	return { prefs, setPref };
}
