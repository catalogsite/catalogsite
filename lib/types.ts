export type CardStyle = 'rounded' | 'square' | 'minimal';

export interface Catalog {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  published: boolean;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  card_style: CardStyle;
  grid_columns: number;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  catalog_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  display_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
  price: number | null;
  sku: string | null;
  external_url: string | null;
  display_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface MediaItem {
  id: string;
  catalog_id: string | null;
  bucket: 'catalog-logos' | 'brand-logos' | 'product-images';
  path: string;
  url: string;
  file_name: string;
  size_bytes: number | null;
  associated_type: 'catalog' | 'brand' | 'product' | null;
  associated_id: string | null;
  created_at: string;
}

export interface CatalogWithCounts extends Catalog {
  brand_count: number;
  product_count: number;
}

export interface BrandWithProductCount extends Brand {
  product_count: number;
}

// Row shape expected in the bulk-import CSV
export interface ProductCsvRow {
  brand_name: string;
  product_name: string;
  description?: string;
  price?: string;
  sku?: string;
  external_url?: string;
  image_url?: string;
}

export interface ImportRowResult {
  row: number;
  data: ProductCsvRow;
  status: 'valid' | 'error' | 'duplicate';
  errors: string[];
  brandExists: boolean;
}
