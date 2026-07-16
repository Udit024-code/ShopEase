-- ============================================================================
-- Seed sample catalog data (categories, products, banners) so the home
-- screen and product listing have real rows to render during development.
--
-- Images are placeholder photos from Lorem Picsum (picsum.photos), seeded
-- deterministically per row so they're stable across reseeds. These are NOT
-- real product photography — replace with actual catalog images before any
-- real launch.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Categories (top-level + one level of subcategories)
-- ---------------------------------------------------------------------------

insert into public.categories (id, name, slug, parent_id)
values
	('10000000-0000-0000-0000-000000000001', 'Electronics', 'electronics', null),
	('10000000-0000-0000-0000-000000000002', 'Fashion', 'fashion', null),
	('10000000-0000-0000-0000-000000000003', 'Home & Kitchen', 'home-kitchen', null),
	('10000000-0000-0000-0000-000000000004', 'Beauty & Personal Care', 'beauty', null),
	('10000000-0000-0000-0000-000000000005', 'Sports & Outdoors', 'sports', null),
	('10000000-0000-0000-0000-000000000006', 'Books', 'books', null)
on conflict (id) do nothing;

insert into public.categories (id, name, slug, parent_id)
values
	('10000000-0000-0000-0000-000000000011', 'Mobiles', 'mobiles', '10000000-0000-0000-0000-000000000001'),
	('10000000-0000-0000-0000-000000000012', 'Laptops', 'laptops', '10000000-0000-0000-0000-000000000001'),
	('10000000-0000-0000-0000-000000000021', 'Men''s Clothing', 'mens-clothing', '10000000-0000-0000-0000-000000000002'),
	('10000000-0000-0000-0000-000000000022', 'Women''s Clothing', 'womens-clothing', '10000000-0000-0000-0000-000000000002')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

insert into public.products
	(id, name, description, price, discount_price, category_id, brand, rating, stock, images)
values
	(
		'20000000-0000-0000-0000-000000000001',
		'Wireless Noise-Cancelling Headphones',
		'Over-ear Bluetooth headphones with active noise cancellation and 30-hour battery life.',
		199.99, 149.99,
		'10000000-0000-0000-0000-000000000001', 'Audiofly', 4.5, 42,
		array['https://picsum.photos/seed/shopease-headphones-1/800/800', 'https://picsum.photos/seed/shopease-headphones-2/800/800']
	),
	(
		'20000000-0000-0000-0000-000000000002',
		'Smartphone 128GB',
		'6.5" AMOLED display, triple camera system, all-day battery.',
		699.00, null,
		'10000000-0000-0000-0000-000000000011', 'Nova', 4.2, 18,
		array['https://picsum.photos/seed/shopease-phone-1/800/800']
	),
	(
		'20000000-0000-0000-0000-000000000003',
		'14" Ultralight Laptop',
		'Thin and light laptop with all-day battery and a fanless design.',
		1099.00, 999.00,
		'10000000-0000-0000-0000-000000000012', 'Meridian', 4.7, 9,
		array['https://picsum.photos/seed/shopease-laptop-1/800/800']
	),
	(
		'20000000-0000-0000-0000-000000000004',
		'Smart Watch Series 5',
		'Fitness tracking, heart-rate monitor, and 5-day battery life.',
		249.00, 199.00,
		'10000000-0000-0000-0000-000000000001', 'Nova', 4.1, 30,
		array['https://picsum.photos/seed/shopease-watch-1/800/800']
	),
	(
		'20000000-0000-0000-0000-000000000005',
		'Men''s Slim Fit Denim Jacket',
		'Classic denim jacket with a modern slim fit.',
		79.99, null,
		'10000000-0000-0000-0000-000000000021', 'Northfield', 4.3, 60,
		array['https://picsum.photos/seed/shopease-jacket-1/800/800']
	),
	(
		'20000000-0000-0000-0000-000000000006',
		'Cotton Crewneck T-Shirt (3-Pack)',
		'Soft breathable cotton tees, everyday fit.',
		34.99, 27.99,
		'10000000-0000-0000-0000-000000000021', 'Northfield', 4.0, 120,
		array['https://picsum.photos/seed/shopease-tshirt-1/800/800']
	),
	(
		'20000000-0000-0000-0000-000000000007',
		'Floral Wrap Dress',
		'Lightweight wrap dress with a floral print, perfect for summer.',
		59.99, 44.99,
		'10000000-0000-0000-0000-000000000022', 'Willow & Co', 4.6, 25,
		array['https://picsum.photos/seed/shopease-dress-1/800/800']
	),
	(
		'20000000-0000-0000-0000-000000000008',
		'High-Waisted Yoga Leggings',
		'Squat-proof, moisture-wicking leggings with a hidden pocket.',
		44.99, null,
		'10000000-0000-0000-0000-000000000022', 'Willow & Co', 4.8, 75,
		array['https://picsum.photos/seed/shopease-leggings-1/800/800']
	),
	(
		'20000000-0000-0000-0000-000000000009',
		'8-Piece Non-Stick Cookware Set',
		'Durable non-stick cookware set, dishwasher safe.',
		129.99, 99.99,
		'10000000-0000-0000-0000-000000000003', 'HearthHome', 4.4, 14,
		array['https://picsum.photos/seed/shopease-cookware-1/800/800']
	),
	(
		'20000000-0000-0000-0000-000000000010',
		'Ceramic Coffee Mug Set (4-Pack)',
		'Stoneware mugs, microwave and dishwasher safe.',
		24.99, null,
		'10000000-0000-0000-0000-000000000003', 'HearthHome', 4.5, 200,
		array['https://picsum.photos/seed/shopease-mugs-1/800/800']
	),
	(
		'20000000-0000-0000-0000-000000000011',
		'Vitamin C Brightening Serum',
		'Daily facial serum with vitamin C and hyaluronic acid.',
		28.00, 22.00,
		'10000000-0000-0000-0000-000000000004', 'Lumen', 4.3, 90,
		array['https://picsum.photos/seed/shopease-serum-1/800/800']
	),
	(
		'20000000-0000-0000-0000-000000000012',
		'Natural Bristle Hair Brush',
		'Boar-bristle brush for smooth, frizz-free hair.',
		18.50, null,
		'10000000-0000-0000-0000-000000000004', 'Lumen', 4.1, 150,
		array['https://picsum.photos/seed/shopease-hairbrush-1/800/800']
	),
	(
		'20000000-0000-0000-0000-000000000013',
		'Yoga Mat with Carry Strap',
		'Extra-thick non-slip yoga mat, 6mm.',
		34.99, 29.99,
		'10000000-0000-0000-0000-000000000005', 'Trailhead', 4.6, 55,
		array['https://picsum.photos/seed/shopease-yogamat-1/800/800']
	),
	(
		'20000000-0000-0000-0000-000000000014',
		'Insulated Water Bottle 1L',
		'Keeps drinks cold for 24 hours or hot for 12.',
		22.99, null,
		'10000000-0000-0000-0000-000000000005', 'Trailhead', 4.7, 300,
		array['https://picsum.photos/seed/shopease-bottle-1/800/800']
	),
	(
		'20000000-0000-0000-0000-000000000015',
		'The Midnight Library (Paperback)',
		'A novel about all the choices that go into a life well lived.',
		12.99, 9.99,
		'10000000-0000-0000-0000-000000000006', 'Canongate', 4.8, 80,
		array['https://picsum.photos/seed/shopease-book-1/800/800']
	),
	(
		'20000000-0000-0000-0000-000000000016',
		'Atomic Habits (Paperback)',
		'An easy and proven way to build good habits and break bad ones.',
		14.99, null,
		'10000000-0000-0000-0000-000000000006', 'Avery', 4.9, 110,
		array['https://picsum.photos/seed/shopease-book-2/800/800']
	)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Banners
-- ---------------------------------------------------------------------------

insert into public.banners (id, title, image_url, link, is_active)
values
	(
		'30000000-0000-0000-0000-000000000001',
		'Summer Sale — Up to 40% Off',
		'https://picsum.photos/seed/shopease-banner-1/1200/600',
		'/category/10000000-0000-0000-0000-000000000002',
		true
	),
	(
		'30000000-0000-0000-0000-000000000002',
		'New Electronics Just Landed',
		'https://picsum.photos/seed/shopease-banner-2/1200/600',
		'/category/10000000-0000-0000-0000-000000000001',
		true
	),
	(
		'30000000-0000-0000-0000-000000000003',
		'Free Shipping This Weekend',
		'https://picsum.photos/seed/shopease-banner-3/1200/600',
		null,
		true
	)
on conflict (id) do nothing;
