-- ============================================================================
-- Replace the Lorem Picsum placeholder images seeded in
-- 20260716040000_seed_catalog_data.sql with real, category-appropriate
-- product photography from the Unsplash CDN (images.unsplash.com).
--
-- These URLs are stable, hotlinkable, and covered by the Unsplash License.
-- Sized to w=800 to match the previous 800x800 placeholders. Updates are
-- keyed by product id so this is safe to re-run.
-- ============================================================================

update public.products set images = array[
	'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
	'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80'
] where id = '20000000-0000-0000-0000-000000000001'; -- Wireless Noise-Cancelling Headphones

update public.products set images = array[
	'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'
] where id = '20000000-0000-0000-0000-000000000002'; -- Smartphone 128GB

update public.products set images = array[
	'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80'
] where id = '20000000-0000-0000-0000-000000000003'; -- 14" Ultralight Laptop

update public.products set images = array[
	'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'
] where id = '20000000-0000-0000-0000-000000000004'; -- Smart Watch Series 5

update public.products set images = array[
	'https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=800&q=80'
] where id = '20000000-0000-0000-0000-000000000005'; -- Men's Slim Fit Denim Jacket

update public.products set images = array[
	'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'
] where id = '20000000-0000-0000-0000-000000000006'; -- Cotton Crewneck T-Shirt (3-Pack)

update public.products set images = array[
	'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80'
] where id = '20000000-0000-0000-0000-000000000007'; -- Floral Wrap Dress

update public.products set images = array[
	'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80'
] where id = '20000000-0000-0000-0000-000000000008'; -- High-Waisted Yoga Leggings

update public.products set images = array[
	'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800&q=80'
] where id = '20000000-0000-0000-0000-000000000009'; -- 8-Piece Non-Stick Cookware Set

update public.products set images = array[
	'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80'
] where id = '20000000-0000-0000-0000-000000000010'; -- Ceramic Coffee Mug Set (4-Pack)

update public.products set images = array[
	'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80'
] where id = '20000000-0000-0000-0000-000000000011'; -- Vitamin C Brightening Serum

update public.products set images = array[
	'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800&q=80'
] where id = '20000000-0000-0000-0000-000000000012'; -- Natural Bristle Hair Brush

update public.products set images = array[
	'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=800&q=80'
] where id = '20000000-0000-0000-0000-000000000013'; -- Yoga Mat with Carry Strap

update public.products set images = array[
	'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80'
] where id = '20000000-0000-0000-0000-000000000014'; -- Insulated Water Bottle 1L

update public.products set images = array[
	'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80'
] where id = '20000000-0000-0000-0000-000000000015'; -- The Midnight Library (Paperback)

update public.products set images = array[
	'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80'
] where id = '20000000-0000-0000-0000-000000000016'; -- Atomic Habits (Paperback)

-- ---------------------------------------------------------------------------
-- Banners
-- ---------------------------------------------------------------------------

update public.banners set image_url =
	'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80'
where id = '30000000-0000-0000-0000-000000000001'; -- Summer Sale (fashion)

update public.banners set image_url =
	'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&q=80'
where id = '30000000-0000-0000-0000-000000000002'; -- New Electronics

update public.banners set image_url =
	'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80'
where id = '30000000-0000-0000-0000-000000000003'; -- Free Shipping
