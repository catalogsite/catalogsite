/**
 * Seeds the database with the WATCH AIM demo catalog.
 *
 * Usage:
 *   npm run seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 * (the service role key is required because this bypasses RLS to seed data
 * before any admin user/session exists).
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import slugify from 'slugify';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const BRANDS: Record<string, string[]> = {
  SEIKO: ['Prospex', 'Presage', 'Astron', 'Seiko 5 Sports'],
  TUDOR: ['Black Bay', 'Pelagos', 'Royal', 'Glamour'],
  ROLEX: ['Submariner', 'Daytona', 'Datejust', 'GMT-Master II', 'Explorer'],
  TISSOT: ['PRX', 'Le Locle', 'Seastar', 'T-Touch'],
  'PATEK PHILIPPE': ['Nautilus', 'Calatrava', 'Aquanaut'],
  OMEGA: ['Speedmaster', 'Seamaster', 'Constellation', 'De Ville'],
};

function placeholderImage(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/600`;
}

async function main() {
  console.log('Seeding WATCH AIM demo catalog…');

  const { data: catalog, error: catalogError } = await supabase
    .from('catalogs')
    .upsert(
      {
        name: 'WATCH AIM',
        slug: 'watch-aim',
        description: 'A curated catalog of the world\u2019s most respected watch brands.',
        published: true,
        primary_color: '#111111',
        secondary_color: '#6b7280',
        background_color: '#ffffff',
        text_color: '#111111',
        card_style: 'rounded',
        grid_columns: 4,
      },
      { onConflict: 'slug' }
    )
    .select()
    .single();

  if (catalogError || !catalog) {
    console.error('Could not create catalog:', catalogError?.message);
    process.exit(1);
  }

  let brandOrder = 0;
  for (const [brandName, products] of Object.entries(BRANDS)) {
    const brandSlug = slugify(brandName, { lower: true, strict: true });

    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .upsert(
        {
          catalog_id: catalog.id,
          name: brandName,
          slug: brandSlug,
          description: `${brandName} watches, part of the WATCH AIM catalog.`,
          logo_url: placeholderImage(`brand-${brandSlug}`),
          published: true,
          display_order: brandOrder++,
        },
        { onConflict: 'catalog_id,slug' }
      )
      .select()
      .single();

    if (brandError || !brand) {
      console.error(`Could not create brand ${brandName}:`, brandError?.message);
      continue;
    }

    let productOrder = 0;
    for (const productName of products) {
      const productSlug = slugify(productName, { lower: true, strict: true });
      const { error: productError } = await supabase.from('products').upsert(
        {
          brand_id: brand.id,
          name: productName,
          slug: productSlug,
          description: `The ${productName} from ${brandName} \u2014 a standout piece in their current lineup.`,
          image_url: placeholderImage(`product-${brandSlug}-${productSlug}`),
          price: Math.round((500 + Math.random() * 14500) / 10) * 10,
          sku: `${brandSlug.slice(0, 3).toUpperCase()}${String(productOrder + 1).padStart(3, '0')}`,
          published: true,
          display_order: productOrder++,
        },
        { onConflict: 'brand_id,slug' }
      );
      if (productError) console.error(`  Could not create product ${productName}:`, productError.message);
    }

    console.log(`  ${brandName}: ${products.length} products`);
  }

  console.log('Done. Visit /catalog/watch-aim once the app is running.');
}

main();
