import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "shopease:recent-searches";
const MAX_RECENT = 8;

export function useRecentSearches() {
	const [recent, setRecent] = useState<string[]>([]);

	useEffect(() => {
		AsyncStorage.getItem(STORAGE_KEY)
			.then((raw) => {
				if (raw) setRecent(JSON.parse(raw));
			})
			.catch(() => {});
	}, []);

	const addRecent = useCallback((term: string) => {
		const trimmed = term.trim();
		if (!trimmed) return;
		setRecent((prev) => {
			const next = [
				trimmed,
				...prev.filter((t) => t.toLowerCase() !== trimmed.toLowerCase()),
			].slice(0, MAX_RECENT);
			AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
			return next;
		});
	}, []);

	const clearRecent = useCallback(() => {
		setRecent([]);
		AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
	}, []);

	return { recent, addRecent, clearRecent };
}
