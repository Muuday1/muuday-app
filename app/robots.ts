import type { MetadataRoute } from 'next'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.muuday.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard', '/agenda', '/admin', '/configuracoes'],
    },
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl,
  }
}
