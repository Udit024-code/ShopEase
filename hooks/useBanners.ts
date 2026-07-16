import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/config/supabase";

export function useActiveBanners() {
	return useQuery({
		queryKey: ["banners", "active"],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("banners")
				.select("id, title, image_url, link")
				.eq("is_active", true)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
	});
}
