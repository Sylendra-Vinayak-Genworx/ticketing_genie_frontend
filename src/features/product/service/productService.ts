import { ticketingApi } from '@/lib/axios';
import type { Product, ProductCreateRequest, ProductUpdateRequest } from '@/types';

export const productService = {
  async listProducts(activeOnly: boolean = true): Promise<Product[]> {
    const res = await ticketingApi.get<Product[]>('/products', {
      params: { active_only: activeOnly },
    });
    return res.data;
  },

  async getProduct(productId: number): Promise<Product> {
    const res = await ticketingApi.get<Product>(`/products/${productId}`);
    return res.data;
  },

  async createProduct(data: ProductCreateRequest): Promise<Product> {
    const res = await ticketingApi.post<Product>('/products', data);
    return res.data;
  },

  async updateProduct(productId: number, data: ProductUpdateRequest): Promise<Product> {
    const res = await ticketingApi.patch<Product>(`/products/${productId}`, data);
    return res.data;
  },

  async deleteProduct(productId: number): Promise<void> {
    await ticketingApi.delete(`/products/${productId}`);
  },
};
