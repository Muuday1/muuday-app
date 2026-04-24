// Common GROQ queries for Sanity CMS
// Used for guides, blog posts, landing blocks, and legal documents.

export const guidesByMarketQuery = `
  *[_type == "guide" && market == $market && locale == $locale] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    "category": category->name,
    publishedAt,
    "coverImage": coverImage.asset->url
  }
`

export const guideBySlugQuery = `
  *[_type == "guide" && slug.current == $slug && locale == $locale][0] {
    _id,
    title,
    slug,
    content,
    excerpt,
    "category": category->name,
    market,
    locale,
    seoTitle,
    seoDescription,
    ogImage,
    publishedAt,
    updatedAt,
    tags,
    "coverImage": coverImage.asset->url
  }
`

export const landingBlocksByMarketQuery = `
  *[_type == "landingBlock" && market == $market && locale == $locale] | order(order asc) {
    _id,
    _type,
    blockType,
    title,
    subtitle,
    cta,
    ctaLink,
    image,
    stats,
    features,
    testimonials,
    faqItems,
    order
  }
`

export const legalDocumentByTypeQuery = `
  *[_type == "legalDocument" && type == $type && locale == $locale] | order(effectiveDate desc)[0] {
    _id,
    type,
    title,
    content,
    locale,
    version,
    effectiveDate
  }
`

export const blogPostsByMarketQuery = `
  *[_type == "blogPost" && market == $market && locale == $locale] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    "author": author->{name, avatar},
    publishedAt,
    "coverImage": coverImage.asset->url,
    tags
  }
`

export const blogPostBySlugQuery = `
  *[_type == "blogPost" && slug.current == $slug && locale == $locale][0] {
    _id,
    title,
    slug,
    content,
    excerpt,
    "author": author->{name, avatar, bio},
    market,
    locale,
    seoTitle,
    seoDescription,
    ogImage,
    publishedAt,
    updatedAt,
    tags,
    "coverImage": coverImage.asset->url
  }
`
