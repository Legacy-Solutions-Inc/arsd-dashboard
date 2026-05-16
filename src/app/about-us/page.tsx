import type { Metadata } from 'next';
import AboutUsPageClient from './AboutUsPageClient';

export const metadata: Metadata = {
  title: "About ARSD Construction — Iloilo's PCAB-Licensed Contractor Since 1998",
  description: 'Founded 1998 in Iloilo City. SEC-registered (CS 2007 28366), PCAB Category A licensed (No. 36037), PhilGEPS-certified. 25+ years and 500+ projects of structural-integrity-first construction.',
  alternates: { canonical: 'https://arsd.co/about-us' },
};

export default function AboutUsPage() {
  return <AboutUsPageClient />;
}
