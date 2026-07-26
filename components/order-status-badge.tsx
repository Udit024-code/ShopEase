import { View } from "react-native";

import { Text } from "@/components/ui/text";

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
	pending: { bg: "#fef3c7", fg: "#92400e" },
	paid: { bg: "#d1fae5", fg: "#065f46" },
	shipped: { bg: "#dbeafe", fg: "#1e40af" },
	delivered: { bg: "#d1fae5", fg: "#065f46" },
	cancelled: { bg: "#fee2e2", fg: "#991b1b" },
};

export function OrderStatusBadge({ status }: { status: string }) {
	const c = STATUS_COLORS[status] ?? { bg: "#e5e7eb", fg: "#374151" };
	return (
		<View
			className="self-start rounded-full px-3 py-1"
			style={{ backgroundColor: c.bg }}
		>
			<Text
				className="text-xs font-semibold capitalize"
				style={{ color: c.fg }}
			>
				{status}
			</Text>
		</View>
	);
}
