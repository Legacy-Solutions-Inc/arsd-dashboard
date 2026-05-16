import type { Metadata } from "next";
import { Barlow_Condensed, Figtree } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "ARSD",
  description: "ARSD Construction Corporation ",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" type="image/png" href="/images/arsd-logo.png" />
        </head>
      <body className={`${barlowCondensed.variable} ${figtree.variable} font-body`} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              '@id': 'https://arsd.co/#organization',
              name: 'ARSD Construction Corporation',
              url: 'https://arsd.co',
              logo: 'https://arsd.co/images/arsd-logo.png',
              foundingDate: '1998',
              sameAs: [
                'https://www.facebook.com/ARSDConCorp',
              ],
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Figueroa St., Bonifacio, Arevalo',
                addressLocality: 'Iloilo City',
                addressRegion: 'Western Visayas',
                postalCode: '5000',
                addressCountry: 'PH',
              },
              contactPoint: [
                { '@type': 'ContactPoint', telephone: '+63-33-337-7347', contactType: 'customer service', areaServed: 'PH' },
                { '@type': 'ContactPoint', telephone: '+63-918-991-1042', contactType: 'customer service', areaServed: 'PH' },
              ],
            }),
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
