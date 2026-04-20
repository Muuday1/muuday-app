'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function getBlogComments(articleSlug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_comments')
    .select('id, name, content, created_at')
    .eq('article_slug', articleSlug)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getBlogComments error:', error)
    return []
  }
  return data || []
}

export async function getBlogLikeCount(articleSlug: string) {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('blog_likes')
    .select('*', { count: 'exact', head: true })
    .eq('article_slug', articleSlug)

  if (error) {
    console.error('getBlogLikeCount error:', error)
    return 0
  }
  return count || 0
}

export async function addBlogComment(
  articleSlug: string,
  name: string,
  email: string,
  content: string
) {
  const supabase = await createClient()

  if (!name.trim() || !email.trim() || !content.trim()) {
    return { success: false, error: 'Preencha todos os campos.' }
  }
  if (content.length > 2000) {
    return { success: false, error: 'Comentário muito longo.' }
  }

  const { error } = await supabase.from('blog_comments').insert({
    article_slug: articleSlug,
    name: name.trim(),
    email: email.trim(),
    content: content.trim(),
  })

  if (error) {
    console.error('addBlogComment error:', error)
    return { success: false, error: 'Erro ao enviar comentário.' }
  }

  return { success: true }
}

export async function toggleBlogLike(articleSlug: string, visitorId: string) {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('blog_likes')
    .select('id')
    .eq('article_slug', articleSlug)
    .eq('visitor_id', visitorId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('blog_likes')
      .delete()
      .eq('id', existing.id)

    if (error) {
      console.error('toggleBlogLike delete error:', error)
      return { success: false, liked: true }
    }
    return { success: true, liked: false }
  }

  const { error } = await supabase.from('blog_likes').insert({
    article_slug: articleSlug,
    visitor_id: visitorId,
  })

  if (error) {
    console.error('toggleBlogLike insert error:', error)
    return { success: false, liked: false }
  }

  return { success: true, liked: true }
}
