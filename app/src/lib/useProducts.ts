import { useState, useEffect } from 'react';
import { supabase } from './supabase';

// Exported type for product
export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  is_new: boolean;
  image: string;
  description: string;
  stock?: number;
  sku?: string;
  tags?: string[];
  variants?: any;
};

// Global cache to avoid unnecessary refetches across components
let globalProducts: Product[] | null = null;
let fetchPromise: Promise<Product[]> | null = null;

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>(globalProducts || []);
  const [loading, setLoading] = useState<boolean>(!globalProducts);

  const fetchProducts = async () => {
    if (globalProducts) {
      setProducts(globalProducts);
      setLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = (async () => {
        const { data } = await supabase.from('products').select('*');
        return (data as Product[]) || [];
      })();
    }

    const data = await fetchPromise;
    globalProducts = data;
    setProducts(data);
    setLoading(false);
  };

  const refreshProducts = async () => {
    fetchPromise = null;
    globalProducts = null;
    setLoading(true);
    await fetchProducts();
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return { products, loading, refreshProducts };
};
