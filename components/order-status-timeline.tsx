import { View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Text } from "@/components/ui/text";
import { Muted } from "@/components/ui/typography";

const BRAND = "#059669";
const MUTED = "#9ca3af";
const CANCELLED = "#dc2626";

// The forward flow an order moves through. Statuses like "paid" collapse onto
// "pending" (placed) for display purposes.
const FLOW: { key: string; label: string }[] = [
	{ key: "pending", label: "Order placed" },
	{ key: "shipped", label: "Shipped" },
	{ key: "out_for_delivery", label: "Out for delivery" },
	{ key: "delivered", label: "Delivered" },
];

function flowIndex(status: string): number {
	if (status === "paid") return 0;
	const i = FLOW.findIndex((s) => s.key === status);
	return i;
}

export function OrderStatusTimeline({
	status,
	placedAt,
}: {
	status: string;
	placedAt: string;
}) {
	if (status === "cancelled") {
		return (
			<View className="flex-row items-center gap-3 rounded-xl border border-border p-4">
				<Feather name="x-circle" size={22} color={CANCELLED} />
				<View className="flex-1">
					<Text className="text-sm font-semibold" style={{ color: CANCELLED }}>
						Order cancelled
					</Text>
					<Muted className="text-xs">Items were restocked.</Muted>
				</View>
			</View>
		);
	}

	const currentIndex = flowIndex(status);

	return (
		<View className="rounded-xl border border-border p-4">
			{FLOW.map((step, index) => {
				const done = index <= currentIndex;
				const isCurrent = index === currentIndex;
				const isLast = index === FLOW.length - 1;

				return (
					<View key={step.key} className="flex-row gap-3">
						{/* marker + connector rail */}
						<View className="items-center">
							<View
								className="h-6 w-6 items-center justify-center rounded-full"
								style={{ backgroundColor: done ? BRAND : "#e5e7eb" }}
							>
								{done ? (
									<Feather name="check" size={14} color="#ffffff" />
								) : (
									<View className="h-2 w-2 rounded-full bg-muted-foreground" />
								)}
							</View>
							{!isLast && (
								<View
									className="w-0.5 flex-1"
									style={{
										backgroundColor: index < currentIndex ? BRAND : "#e5e7eb",
										minHeight: 24,
									}}
								/>
							)}
						</View>

						{/* label */}
						<View className={isLast ? "pb-0 pt-0.5" : "pb-5 pt-0.5"}>
							<Text
								className="text-sm"
								style={{
									color: done ? "#111827" : MUTED,
									fontWeight: isCurrent ? "700" : "500",
								}}
							>
								{step.label}
							</Text>
							{index === 0 && (
								<Muted className="text-xs">
									{new Date(placedAt).toLocaleDateString(undefined, {
										year: "numeric",
										month: "short",
										day: "numeric",
									})}
								</Muted>
							)}
						</View>
					</View>
				);
			})}
		</View>
	);
}
