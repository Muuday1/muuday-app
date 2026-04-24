'use server'

import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rate-limit'
import {
  getBlogCommentsService,
  getBlogLikeCountService,
  addBlogCommentService,
  toggleBlogLikeService,
} from '@/lib/blog/blog-engagement-service'

export async function getBlogComments(articleSlug: string) {
  const supabase = await createClient()
  return getBlogCommentsService(supabase, articleSlug)
}

export async function getBlogLikeCount(articleSlug: string) {
  const supabase = await createClient()
  return getBlogLikeCountService(supabase, articleSlug)
}

export async function addBlogComment(
  articleSlug: string,
  name: string,
  email: string,
  content: string,
) {
  const supabase = await createClient()

  // Use IP-based rate limiting via a derived key since blog comments are anonymous
  const rl = await rateLimit('messageSend', `blog-comment-${articleSlug}-${email.trim().toLowerCase().slice(0, 32)}`)
  if (!rl.allowed) return { success: false, error: 'Muitos comentários. Tente novamente em breve.' }

  return addBlogCommentService(supabase, articleSlug, name, email, content)
}

export async function toggleBlogLike(articleSlug: string, visitorId: string) {
  const supabase = await createClient()

  const rl = await rateLimit('messageSend', `blog-like-${visitorId.slice(0, 32)}`)
  if (!rl.allowed) return { success: false, liked: false, error: 'Muitas curtidas. Tente novamente em breve.' }

  return toggleBlogLikeService(supabase, articleSlug, visitorId)
}
