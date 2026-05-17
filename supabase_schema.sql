-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- STORAGE: Create a public bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view product images (public bucket)
CREATE POLICY "Public read product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Allow authenticated admins to upload product images
CREATE POLICY "Admins can upload product images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated admins to delete product images
CREATE POLICY "Admins can delete product images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated'
);

-- PROFILES
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- PRODUCTS
-- We will just use string IDs to match our existing mock data
CREATE TABLE public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  is_new BOOLEAN DEFAULT false,
  image TEXT NOT NULL,
  description TEXT,
  stock INTEGER DEFAULT 100,
  sku TEXT,
  tags TEXT[],
  variants JSONB DEFAULT '[]'::jsonb
);

-- Insert mock products
INSERT INTO public.products (id, name, price, category, is_new, image, description) VALUES
('m1', 'Minimalist Leather Jacket', 450, 'men', true, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800', 'A premium minimalist black leather jacket, tailored for a perfect fit.'),
('m2', 'Cashmere Blend Overcoat', 580, 'men', false, 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=800', 'Luxurious cashmere blend overcoat.'),
('m3', 'Essential Cotton Tee', 65, 'men', true, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800', 'Premium heavyweight cotton tee with a relaxed fit.'),
('m4', 'Tailored Chinos', 120, 'men', false, 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800', 'Classic tailored chinos in a versatile khaki shade.'),
('m5', 'Oxford Cloth Button-Down', 85, 'men', true, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800', 'The quintessential white oxford shirt, perfect for layering.'),
('m6', 'Merino Wool Crewneck', 140, 'men', false, 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800', 'Soft and breathable merino wool sweater.'),
('m7', 'Denim Trucker Jacket', 195, 'men', false, 'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?auto=format&fit=crop&q=80&w=800', 'Vintage-washed denim jacket with a modern cut.'),
('m8', 'Slim Fit Dress Trousers', 160, 'men', true, 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&q=80&w=800', 'Sharp, tailored dress trousers for formal occasions.'),
('m9', 'Classic Polo Shirt', 75, 'men', false, 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&q=80&w=800', 'Breathable pique cotton polo shirt.'),
('m10', 'Lightweight Bomber Jacket', 220, 'men', true, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=800', 'Minimalist water-resistant bomber jacket.'),
('m11', 'Corduroy Overshirt', 110, 'men', false, 'https://images.unsplash.com/photo-1590330297626-d7aff25a0431?auto=format&fit=crop&q=80&w=800', 'Heavyweight corduroy overshirt for transitional weather.'),
('w1', 'Silk Evening Dress', 320, 'women', true, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800', 'Elegant silk evening dress with a fluid silhouette.'),
('w2', 'Pleated Midi Skirt', 180, 'women', false, 'https://images.unsplash.com/photo-1583391733958-d25e07fac04f?auto=format&fit=crop&q=80&w=800', 'Versatile pleated midi skirt in neutral tones.'),
('w3', 'Tailored Wide-Leg Trousers', 210, 'women', true, 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=800', 'Sophisticated wide-leg trousers.'),
('w4', 'Cashmere Turtleneck Sweater', 240, 'women', true, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=800', 'Cozy and elegant cashmere turtleneck.'),
('w5', 'Oversized Blazer', 280, 'women', false, 'https://images.unsplash.com/photo-1548624313-0396c75e4b1a?auto=format&fit=crop&q=80&w=800', 'Modern oversized blazer with structured shoulders.'),
('w6', 'Classic White Button-Down', 95, 'women', false, 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&q=80&w=800', 'Crisp poplin cotton button-down shirt.'),
('w7', 'Linen Wrap Dress', 150, 'women', true, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800', 'Breathable summer linen wrap dress.'),
('w8', 'Wool Blend Coat', 420, 'women', false, 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&q=80&w=800', 'Timeless wool blend coat for winter elegance.'),
('w9', 'High-Waisted Denim Jeans', 130, 'women', true, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=800', 'Classic vintage-inspired straight leg jeans.'),
('w10', 'Satin Camisole', 65, 'women', false, 'https://images.unsplash.com/photo-1563178406-4cdc2923acbc?auto=format&fit=crop&q=80&w=800', 'Delicate silk satin camisole top.'),
('w11', 'Ribbed Knit Cardigan', 115, 'women', true, 'https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?auto=format&fit=crop&q=80&w=800', 'Chunky ribbed knit cardigan.'),
('a1', 'Leather Crossbody Bag', 295, 'accessories', true, 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=800', 'Minimalist leather crossbody bag.'),
('a2', 'Minimalist Silver Watch', 185, 'accessories', false, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800', 'Sleek stainless steel watch.'),
('a3', 'Classic Aviator Sunglasses', 145, 'accessories', true, 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800', 'Timeless metal frame aviators.'),
('a4', 'Woven Leather Belt', 60, 'accessories', false, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800', 'Premium braided leather belt.'),
('a5', 'Silk Patterned Scarf', 85, 'accessories', true, 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&q=80&w=800', '100% silk printed scarf.'),
('a6', 'Suede Chelsea Boots', 310, 'accessories', false, 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&q=80&w=800', 'Classic suede Chelsea boots.'),
('a7', 'Gold Chain Necklace', 120, 'accessories', true, 'https://images.unsplash.com/photo-1599643478524-fb66f70a00eb?auto=format&fit=crop&q=80&w=800', '18k gold-plated curb chain.'),
('a8', 'Leather Cardholder', 55, 'accessories', false, 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=800', 'Slim full-grain leather cardholder.'),
('a9', 'Canvas Tote Bag', 45, 'accessories', true, 'https://images.unsplash.com/photo-1597488960136-2182060010dc?auto=format&fit=crop&q=80&w=800', 'Heavyweight organic canvas tote.'),
('a10', 'Wool Fedora Hat', 95, 'accessories', false, 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?auto=format&fit=crop&q=80&w=800', 'Structured wool felt fedora.'),
('a11', 'Minimalist Cuff Bracelet', 75, 'accessories', true, 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=800', 'Sleek brushed silver cuff.');

-- CART ITEMS
CREATE TABLE public.cart_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  size TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ORDERS
CREATE TABLE public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total NUMERIC NOT NULL,
  status TEXT DEFAULT 'Processing',
  shipping_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ORDER ITEMS
CREATE TABLE public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  size TEXT NOT NULL,
  price_at_time NUMERIC NOT NULL
);

-- RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Products: Anyone can read products
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);

-- Products: Admins can insert products
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Products: Admins can update products
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Products: Admins can delete products
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Cart Items: Users can CRUD their own cart items
CREATE POLICY "Users can manage own cart" ON public.cart_items FOR ALL USING (auth.uid() = user_id);

-- Orders: Users can read and create their own orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Orders: Admins can view all orders
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Order Items: Users can read and create their own order items based on order ownership
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create own order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid())
);
