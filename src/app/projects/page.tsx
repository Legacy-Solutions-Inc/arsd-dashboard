import type { Metadata } from 'next';
import ProjectsPageClient from './ProjectsPageClient';
import { createClient } from '../../../supabase/server';

export const metadata: Metadata = {
  title: 'Completed Construction Projects in Iloilo & the Philippines | ARSD Construction',
  description: '500+ completed construction projects by ARSD Construction Corporation across Western Visayas — residential, commercial, industrial.',
  alternates: { canonical: 'https://arsd.co/projects' },
};

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('website_projects')
    .select(`
      id, name, location, slug, created_at,
      photos:website_project_photos(file_path, order_index)
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const initialProjects = (data ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    location: p.location as string,
    slug: (p.slug as string | null) ?? undefined,
    created_at: p.created_at as string,
    photoUrls: ((p.photos as { file_path: string; order_index: number }[]) ?? [])
      .sort((a, b) => a.order_index - b.order_index)
      .map((photo) => `${baseUrl}/storage/v1/object/public/website-projects/${photo.file_path}`),
  }));

  return <ProjectsPageClient initialProjects={initialProjects} />;
}
