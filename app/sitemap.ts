import type { MetadataRoute } from 'next'
import { getAppBaseUrl } from '@/lib/config/app-url'

const appUrl = getAppBaseUrl()

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${appUrl}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${appUrl}/buscar`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    {
      url: `${appUrl}/registrar-profissional`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    { url: `${appUrl}/cadastro`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${appUrl}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${appUrl}/ajuda`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${appUrl}/termos`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${appUrl}/privacidade`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]
}
