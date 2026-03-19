import { createClient } from '@/lib/supabase/client'

export async function uploadPostImage(
  file: File,
  studioId: string
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient()

  const ext = file.name.split('.').pop() ?? 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = `${studioId}/${fileName}`

  const { error } = await supabase.storage
    .from('posts')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) {
    return { url: null, error: error.message }
  }

  const { data } = supabase.storage.from('posts').getPublicUrl(path)

  return { url: data.publicUrl, error: null }
}
