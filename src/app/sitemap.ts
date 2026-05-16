import type { MetadataRoute } from 'next';
import { createApiSupabaseClient } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://arsd.co';
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`,             lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${baseUrl}/our-services`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/projects`,     lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${baseUrl}/about-us`,     lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/contact-us`,   lastModified: now, changeFrequency: 'yearly',  priority: 0.7 },
  ];

  const supabase = createApiSupabaseClient();
  const { data } = await supabase
    .from('website_projects')
    .select('slug, updated_at')
    .eq('is_deleted', false)
    .not('slug', 'is', null);

  const projectPages: MetadataRoute.Sitemap = (data ?? [])
    .filter((p): p is { slug: string; updated_at: string } => typeof p.slug === 'string')
    .map((p) => ({
      url: `${baseUrl}/projects/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

  return [...staticPages, ...projectPages];
}
