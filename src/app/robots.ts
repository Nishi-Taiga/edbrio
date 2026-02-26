import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/teacher/', '/guardian/', '/admin/', '/api/'],
      },
    ],
    sitemap: 'https://edbrio.com/sitemap.xml',
  }
}
