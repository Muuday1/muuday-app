import imageUrlBuilder from '@sanity/image-url'
import { sanityClient } from './client'

const builder = imageUrlBuilder(sanityClient)

/**
 * Build a Sanity CDN image URL from an image asset reference.
 *
 * Example:
 *   <img src={urlFor(guide.coverImage).width(800).height(400).fit('crop').url()} />
 */
export function urlFor(source: Parameters<typeof builder.image>[0]) {
  return builder.image(source)
}
