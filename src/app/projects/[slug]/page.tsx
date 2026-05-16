import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { Button } from '@/components/ui/button';
import { createApiSupabaseClient } from '@/lib/supabase';
import { MapPin, ArrowLeft, Building2, ArrowUpRight } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const getProject = cache(async (slug: string) => {
  const supabase = createApiSupabaseClient();
  const { data } = await supabase
    .from('website_projects')
    .select(`
      id, name, location, slug, created_at, updated_at,
      photos:website_project_photos(file_path, order_index, alt_text)
    `)
    .eq('slug', slug)
    .eq('is_deleted', false)
    .single();
  return data;
});

export async function generateStaticParams() {
  const supabase = createApiSupabaseClient();
  const { data } = await supabase
    .from('website_projects')
    .select('slug')
    .eq('is_deleted', false)
    .not('slug', 'is', null);
  return (data ?? [])
    .filter((p): p is { slug: string } => typeof p.slug === 'string')
    .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: 'Project Not Found | ARSD Construction' };

  const description = `${project.name} in ${project.location} — completed construction project by ARSD Construction Corporation, Iloilo.`;
  return {
    title: `${project.name} | ARSD Construction Projects`,
    description,
    alternates: { canonical: `https://arsd.co/projects/${project.slug}` },
    openGraph: {
      title: `${project.name} | ARSD Construction`,
      description,
      url: `https://arsd.co/projects/${project.slug}`,
      type: 'article',
    },
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const photos = ((project.photos as { file_path: string; order_index: number; alt_text: string | null }[]) ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map((p, i) => ({
      ...p,
      url: `${baseUrl}/storage/v1/object/public/website-projects/${p.file_path}`,
      altText: p.alt_text ?? `${project.name} — Photo ${i + 1}`,
    }));

  const coverPhoto = photos[0]?.url ?? null;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://arsd.co/' },
      { '@type': 'ListItem', position: 2, name: 'Projects', item: 'https://arsd.co/projects' },
      { '@type': 'ListItem', position: 3, name: project.name, item: `https://arsd.co/projects/${project.slug}` },
    ],
  };

  const creativeWorkJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.name,
    description: `${project.name} in ${project.location}`,
    creator: { '@id': 'https://arsd.co/#localbusiness' },
    locationCreated: { '@type': 'Place', name: project.location },
    url: `https://arsd.co/projects/${project.slug}`,
    ...(coverPhoto && { image: coverPhoto }),
    ...(project.created_at && { dateCreated: (project.created_at as string).split('T')[0] }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(creativeWorkJsonLd) }} />
      <div className="min-h-[100dvh] bg-[#111111]">
        <Navbar />

        <article className="responsive-container py-16 sm:py-24">
          {/* Breadcrumb nav */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-sm text-[#a09890] hover:text-[#f0ede8] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </Link>
          </nav>

          {/* Header */}
          <header className="mb-10">
            <div className="flex items-center gap-2 text-sm text-[#a09890] mb-3">
              <MapPin className="w-4 h-4 text-arsd-red flex-shrink-0" />
              <span>{project.location}</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tighter text-[#f0ede8] uppercase leading-none">
              {project.name}
            </h1>
          </header>

          {/* Photos */}
          {photos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((photo, index) => (
                <div
                  key={photo.file_path}
                  className={`relative overflow-hidden rounded-lg bg-[#1c1c1c] ${
                    index === 0 && photos.length > 1
                      ? 'sm:col-span-2 lg:col-span-2 aspect-[16/9]'
                      : 'aspect-square'
                  }`}
                >
                  <Image
                    src={photo.url}
                    alt={photo.altText}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    sizes={index === 0 ? '(min-width: 1024px) 66vw, (min-width: 640px) 66vw, 100vw' : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 rounded-lg bg-[#1c1c1c] border border-[#2a2626]">
              <Building2 className="w-12 h-12 text-[#a09890]" />
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 pt-12 border-t border-[#2a2626]">
            <p className="text-[#a09890] mb-4 text-sm">Interested in a similar project?</p>
            <Link href="/contact-us">
              <Button className="bg-arsd-red text-white hover:bg-red-700">
                Request a Quote <ArrowUpRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </article>

        <Footer />
      </div>
    </>
  );
}
