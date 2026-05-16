import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://arsd.co';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/sign-up',
          '/sign-in',
          '/forgot-password',
          '/reset-password',
          '/pending-approval',
          '/dashboard/',
          '/api/',
          '/auth/',
        ],
      },
      // AI crawler stance: allow retrieval bots so the brand surfaces in AI answers; block CCBot (training-only)
      { userAgent: 'GPTBot', allow: ['/'] },
      { userAgent: 'ClaudeBot', allow: ['/'] },
      { userAgent: 'Claude-Web', allow: ['/'] },
      { userAgent: 'PerplexityBot', allow: ['/'] },
      { userAgent: 'Google-Extended', allow: ['/'] },
      { userAgent: 'CCBot', disallow: ['/'] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
