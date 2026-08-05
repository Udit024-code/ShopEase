// ============================================================================
// delete-account
//
// Permanently deletes the calling user's account and all their owned data.
// A client cannot delete its own auth.users row directly, so this runs with
// the service role. The caller is identified strictly from their JWT — the
// function never trusts a client-supplied user id — so a user can only ever
// delete themselves.
//
// JWT verification is left ON (default) so only signed-in users can call it.
// ============================================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "authorization, content-type",
};

Deno.serve(async (req: Request) => {
	if (req.method === "OPTIONS") {
		return new Response(null, { headers: corsHeaders });
	}

	try {
		const authHeader = req.headers.get("Authorization");
		if (!authHeader) {
			return json({ error: "Missing authorization header" }, 401);
		}

		const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
		const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
		const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

		// Identify the caller from their JWT (never from the request body).
		const userClient = createClient(supabaseUrl, anonKey, {
			global: { headers: { Authorization: authHeader } },
		});
		const {
			data: { user },
			error: userError,
		} = await userClient.auth.getUser();

		if (userError || !user) {
			return json({ error: "Invalid or expired session" }, 401);
		}

		const userId = user.id;
		const admin = createClient(supabaseUrl, serviceRoleKey);

		// Remove owned rows explicitly (service role bypasses RLS). Order items
		// go with their parent orders. This makes the deletion complete even if
		// foreign keys aren't all set to cascade from auth.users.
		const { data: orders } = await admin
			.from("orders")
			.select("id")
			.eq("user_id", userId);

		const orderIds = (orders ?? []).map((o: { id: string }) => o.id);
		if (orderIds.length > 0) {
			await admin.from("order_items").delete().in("order_id", orderIds);
		}

		await admin.from("orders").delete().eq("user_id", userId);
		await admin.from("cart_items").delete().eq("user_id", userId);
		await admin.from("wishlist").delete().eq("user_id", userId);
		await admin.from("addresses").delete().eq("user_id", userId);

		// Best-effort removal of the user's avatar folder in storage.
		try {
			const { data: files } = await admin.storage
				.from("avatars")
				.list(userId);
			if (files && files.length > 0) {
				await admin.storage
					.from("avatars")
					.remove(files.map((f) => `${userId}/${f.name}`));
			}
		} catch (_) {
			// storage cleanup is non-critical; continue with account deletion
		}

		// Finally delete the auth user. This also removes the profiles row via
		// its cascade from auth.users.
		const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
		if (deleteError) {
			return json({ error: deleteError.message }, 500);
		}

		return json({ success: true }, 200);
	} catch (_err) {
		return json({ error: "Internal error" }, 500);
	}
});

function json(body: unknown, status: number): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { ...corsHeaders, "Content-Type": "application/json" },
	});
}
