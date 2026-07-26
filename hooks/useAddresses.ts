import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/config/supabase";
import { useAuth } from "@/context/supabase-provider";
import type { Database } from "@/database.types";

export type Address = Database["public"]["Tables"]["addresses"]["Row"];
export type AddressInput = {
	label: string | null;
	full_name: string;
	phone: string;
	line1: string;
	line2: string | null;
	city: string;
	state: string | null;
	postal_code: string;
	country: string;
	is_default: boolean;
};

export function useAddresses() {
	const { session } = useAuth();
	const userId = session?.user.id;

	return useQuery({
		queryKey: ["addresses", userId],
		enabled: !!userId,
		queryFn: async (): Promise<Address[]> => {
			const { data, error } = await supabase
				.from("addresses")
				.select("*")
				.eq("user_id", userId!)
				.order("is_default", { ascending: false })
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
	});
}

export function useAddress(addressId: string | undefined) {
	const { session } = useAuth();
	const userId = session?.user.id;

	return useQuery({
		queryKey: ["address", addressId],
		enabled: !!userId && !!addressId,
		queryFn: async (): Promise<Address> => {
			const { data, error } = await supabase
				.from("addresses")
				.select("*")
				.eq("id", addressId!)
				.single();

			if (error) throw error;
			return data;
		},
	});
}

export function useCreateAddress() {
	const queryClient = useQueryClient();
	const { session } = useAuth();
	const userId = session?.user.id;

	return useMutation({
		mutationFn: async (input: AddressInput) => {
			if (!userId) throw new Error("Not signed in");
			const { error } = await supabase
				.from("addresses")
				.insert({ ...input, user_id: userId });
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["addresses"] });
		},
	});
}

export function useUpdateAddress() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			input,
		}: {
			id: string;
			input: AddressInput;
		}) => {
			const { error } = await supabase
				.from("addresses")
				.update(input)
				.eq("id", id);
			if (error) throw error;
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["addresses"] });
			queryClient.invalidateQueries({ queryKey: ["address", variables.id] });
		},
	});
}

export function useDeleteAddress() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await supabase.from("addresses").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["addresses"] });
		},
	});
}

export function useSetDefaultAddress() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			// The DB trigger clears the default flag on the user's other addresses.
			const { error } = await supabase
				.from("addresses")
				.update({ is_default: true })
				.eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["addresses"] });
		},
	});
}
