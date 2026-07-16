export function formatPrice(amount: number) {
	return `$${amount.toFixed(2)}`;
}

export function discountPercent(price: number, discountPrice: number) {
	if (price <= 0 || discountPrice >= price) return 0;
	return Math.round(((price - discountPrice) / price) * 100);
}
