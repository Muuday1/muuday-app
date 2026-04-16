import type { MetadataRoute } from 'next'
import { getAppBaseUrl } from '@/lib/config/app-url'

const appUrl = getAppBaseUrl()

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
