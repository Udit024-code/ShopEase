import { ProductRail } from "@/components/home/product-rail";
import {
	useDealsProducts,
	useNewArrivals,
	useTopRatedProducts,
} from "@/hooks/useProducts";

export function DealsRail() {
	const { data, isLoading, isError } = useDealsProducts();
	return (
		<ProductRail
			title="Top deals"
			products={data}
			isLoading={isLoading}
			isError={isError}
		/>
	);
}

export function NewArrivalsRail() {
	const { data, isLoading, isError } = useNewArrivals();
	return (
		<ProductRail
			title="New arrivals"
			products={data}
			isLoading={isLoading}
			isError={isError}
		/>
	);
}

export function TopRatedRail() {
	const { data, isLoading, isError } = useTopRatedProducts();
	return (
		<ProductRail
			title="Trending now"
			products={data}
			isLoading={isLoading}
			isError={isError}
		/>
	);
}
