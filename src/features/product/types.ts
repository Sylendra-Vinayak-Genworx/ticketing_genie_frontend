// ─── Product Types ────────────────────────────────────────────────────────────

export interface Product {
  product_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface ProductCreateRequest {
  name: string;
  description?: string;
  is_active: boolean;
}

export interface ProductUpdateRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}
