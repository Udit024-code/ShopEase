import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/config/supabase";

export function useTopLevelCategories() {
	return useQuery({
		queryKey: ["categories", "top-level"],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("categories")
				.select("id, name, slug")
				.is("parent_id", null)
				.order("name", { ascending: true });

			if (error) throw error;
			return data;
		},
	});
}

export function useCategory(categoryId: string | undefined) {
	return useQuery({
		queryKey: ["category", categoryId],
		enabled: !!categoryId,
		queryFn: async () => {
			const { data, error } = await supabase
				.from("categories")
				.select("id, name, slug")
				.eq("id", categoryId!)
				.single();

			if (error) throw error;
			return data;
		},
	});
}
