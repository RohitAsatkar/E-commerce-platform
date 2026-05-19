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
        if (data) {
          const sorted = [...data].sort((a: any, b: any) => {
            // 1. If created_at is available, sort by it descending
            if (a.created_at && b.created_at) {
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
            
            // 2. Sort by custom admin ID prefix 'p_' (which contains timestamp)
            const aIsNewAdmin = a.id?.startsWith('p_');
            const bIsNewAdmin = b.id?.startsWith('p_');
            
            if (aIsNewAdmin && !bIsNewAdmin) return -1;
            if (!aIsNewAdmin && bIsNewAdmin) return 1;
            
            if (aIsNewAdmin && bIsNewAdmin) {
              const aTime = Number(a.id.split('_')[1]) || 0;
              const bTime = Number(b.id.split('_')[1]) || 0;
              return bTime - aTime;
            }
            
            // 3. Fallback to mock ID sorting
            return a.id.localeCompare(b.id);
          });
          return sorted;
        }
        return [];
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
