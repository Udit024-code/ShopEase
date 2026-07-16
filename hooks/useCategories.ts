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
