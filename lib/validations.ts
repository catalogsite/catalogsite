import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .refine((val) => !val || /^https?:\/\/.+/i.test(val), 'Must be a valid URL starting with http:// or https://');

export const catalogSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color').optional(),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color').optional(),
  background_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color').optional(),
  text_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color').optional(),
  card_style: z.enum(['rounded', 'square', 'minimal']).optional(),
  grid_columns: z.coerce.number().int().min(1).max(6).optional(),
});
export type CatalogFormValues = z.infer<typeof catalogSchema>;

export const brandSchema = z.object({
  name: z.string().trim().min(1, 'Brand name is required').max(120),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  published: z.boolean().optional(),
});
export type BrandFormValues = z.infer<typeof brandSchema>;

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required').max(160),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .max(160)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().trim().max(4000).optional().or(z.literal('')),
  price: z
    .union([z.coerce.number().nonnegative('Price cannot be negative'), z.literal('')])
    .optional(),
  sku: z.string().trim().max(80).optional().or(z.literal('')),
  external_url: optionalUrl,
  published: z.boolean().optional(),
});
export type ProductFormValues = z.infer<typeof productSchema>;

export const productCsvRowSchema = z.object({
  brand_name: z.string().trim().min(1, 'brand_name is required'),
  product_name: z.string().trim().min(1, 'product_name is required'),
  description: z.string().trim().optional().or(z.literal('')),
  price: z.string().trim().optional().or(z.literal('')),
  sku: z.string().trim().optional().or(z.literal('')),
  external_url: z.string().trim().optional().or(z.literal('')),
  image_url: z.string().trim().optional().or(z.literal('')),
});

export const CSV_TEMPLATE_HEADERS = [
  'brand_name',
  'product_name',
  'description',
  'price',
  'sku',
  'external_url',
  'image_url',
] as const;

/** One-shot catalog builder payload (catalog + brands + products together). */
export const builderProductSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required').max(160),
  description: z.string().trim().max(4000).optional().or(z.literal('')),
  image_url: z.string().trim().optional().or(z.literal('')),
  price: z.union([z.number().nonnegative(), z.null()]).optional(),
  sku: z.string().trim().max(80).optional().or(z.literal('')),
  external_url: optionalUrl,
});

export const builderBrandSchema = z.object({
  name: z.string().trim().min(1, 'Brand name is required').max(120),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  logo_url: z.string().trim().optional().or(z.literal('')),
  products: z.array(builderProductSchema).default([]),
});

export const fullCatalogSchema = z.object({
  name: z.string().trim().min(2, 'Catalog name must be at least 2 characters').max(120),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  logo_url: z.string().trim().optional().or(z.literal('')),
  published: z.boolean().default(true),
  brands: z.array(builderBrandSchema).min(1, 'Add at least one brand'),
});

export type FullCatalogInput = z.infer<typeof fullCatalogSchema>;
