import { productCsvRowSchema } from '@/lib/validations';
import type { ImportRowResult, ProductCsvRow } from '@/lib/types';
import { slugify } from '@/lib/utils';

/**
 * Validates parsed CSV rows against the schema, flags rows that duplicate
 * an existing product (same brand + product slug) and rows that duplicate
 * another row earlier in the same file, and notes whether each row's
 * brand already exists so the UI can offer "create missing brands automatically".
 */
export function validateImportRows(
  rows: ProductCsvRow[],
  existingBrandNames: string[],
  existingProductKeys: string[] // `${brandSlug}::${productSlug}`
): ImportRowResult[] {
  const existingBrandSlugs = new Set(existingBrandNames.map((n) => slugify(n)));
  const existingKeys = new Set(existingProductKeys);
  const seenInFile = new Set<string>();

  return rows.map((row, index) => {
    const errors: string[] = [];
    const parsed = productCsvRowSchema.safeParse(row);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => errors.push(issue.message));
    }

    if (row.price && row.price.trim() && Number.isNaN(Number(row.price))) {
      errors.push('price must be a number');
    }
    if (row.external_url && row.external_url.trim() && !/^https?:\/\//i.test(row.external_url)) {
      errors.push('external_url must start with http:// or https://');
    }

    const brandSlug = slugify(row.brand_name || '');
    const productSlug = slugify(row.product_name || '');
    const key = `${brandSlug}::${productSlug}`;
    const brandExists = existingBrandSlugs.has(brandSlug);

    let status: ImportRowResult['status'] = errors.length > 0 ? 'error' : 'valid';
    if (status === 'valid' && (existingKeys.has(key) || seenInFile.has(key))) {
      status = 'duplicate';
    }
    seenInFile.add(key);

    return { row: index + 2, data: row, status, errors, brandExists }; // +2: header row + 1-index
  });
}
