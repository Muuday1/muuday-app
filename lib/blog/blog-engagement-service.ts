import type { SupabaseClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

export async function getBlogCommentsService(supabase: SupabaseClient, articleSlug: string) {
  const { data, error } = await supabase
    .from('blog_comments')
    .select('id, name, content, created_at')
    .eq('article_slug', articleSlug)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    Sentry.captureException(error, { tags: { area: 'blog_comments' }, extra: { articleSlug } })
    return []
  }
  return data || []
}

export async function getBlogLikeCountService(supabase: SupabaseClient, articleSlug: string) {
  const { count, error } = await supabase
    .from('blog_likes')
    .select('*', { count: 'exact', head: true })
    .eq('article_slug', articleSlug)

  if (error) {
    Sentry.captureException(error, { tags: { area: 'blog_likes' }, extra: { articleSlug } })
    return 0
  }
  return count || 0
}

export async function addBlogCommentService(
  supabase: SupabaseClient,
  articleSlug: string,
  name: string,
  email: string,
  content: string,
) {
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
    Sentry.captureException(error, { tags: { area: 'blog_comment_add' }, extra: { articleSlug } })
    return { success: false, error: 'Erro ao enviar comentário.' }
  }

  return { success: true }
}

export async function toggleBlogLikeService(supabase: SupabaseClient, articleSlug: string, visitorId: string) {
  const { data: existing, error: existingError } = await supabase
    .from('blog_likes')
    .select('id')
    .eq('article_slug', articleSlug)
    .eq('visitor_id', visitorId)
    .maybeSingle()

  if (existingError) {
    Sentry.captureException(existingError, { tags: { area: 'blog_like_query' }, extra: { articleSlug } })
  }

  if (existing) {
    const { error } = await supabase
      .from('blog_likes')
      .delete()
      .eq('id', existing.id)

    if (error) {
      Sentry.captureException(error, { tags: { area: 'blog_like_delete' }, extra: { articleSlug } })
      return { success: false, liked: true }
    }
    return { success: true, liked: false }
  }

  const { error } = await supabase.from('blog_likes').insert({
    article_slug: articleSlug,
    visitor_id: visitorId,
  })

  if (error) {
    Sentry.captureException(error, { tags: { area: 'blog_like_insert' }, extra: { articleSlug } })
    return { success: false, liked: false }
  }

  return { success: true, liked: true }
}
