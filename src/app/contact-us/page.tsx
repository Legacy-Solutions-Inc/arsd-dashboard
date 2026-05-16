import type { Metadata } from 'next';
import ContactUsPageClient from './ContactUsPageClient';

export const metadata: Metadata = {
  title: 'Contact ARSD Construction — Iloilo City General Contractor',
  description: 'Get in touch with ARSD Construction Corporation at Figueroa St., Arevalo, Iloilo City. Office phone (033) 337 7347, mobile +63 918 991 1042. Request a construction quote for projects across Western Visayas.',
  alternates: { canonical: 'https://arsd.co/contact-us' },
};

export default function ContactUsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'GeneralContractor',
            '@id': 'https://arsd.co/#localbusiness',
            name: 'ARSD Construction Corporation',
            image: 'https://arsd.co/images/arsd-logo.png',
            telephone: '+63-33-337-7347',
            email: 'a_dupit@yahoo.com',
            contactPoint: [
              { '@type': 'ContactPoint', telephone: '+63-33-337-7347', contactType: 'customer service', areaServed: 'PH' },
              { '@type': 'ContactPoint', telephone: '+63-918-991-1042', contactType: 'customer service', areaServed: 'PH' },
            ],
            url: 'https://arsd.co',
            priceRange: '$$',
            parentOrganization: { '@id': 'https://arsd.co/#organization' },
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Figueroa St., Bonifacio, Arevalo',
              addressLocality: 'Iloilo City',
              addressRegion: 'Western Visayas',
              postalCode: '5000',
              addressCountry: 'PH',
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: 10.7202,
              longitude: 122.5621,
            },
            openingHoursSpecification: [
              { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '17:00' },
              { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '08:00', closes: '12:00' },
            ],
            areaServed: { '@type': 'AdministrativeArea', name: 'Western Visayas, Philippines' },
            hasCredential: [
              { '@type': 'EducationalOccupationalCredential', credentialCategory: 'PCAB License', name: 'PCAB Category A No. 36037' },
              { '@type': 'EducationalOccupationalCredential', credentialCategory: 'SEC Registration', name: 'CS 2007 28366' },
              { '@type': 'EducationalOccupationalCredential', credentialCategory: 'PhilGEPS Certificate', name: '2010-63063' },
            ],
          }),
        }}
      />
      <ContactUsPageClient />
    </>
  );
}
