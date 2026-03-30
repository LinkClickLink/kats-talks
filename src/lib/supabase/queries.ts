import { createClient } from './client'
import type {
  CatBreed,
  CatCharacter,
  Scenario,
  Video,
  N8nConfig,
  DashboardStats,
  StudioFormState,
} from '@/types'

// ── Cat Breeds ─────────────────────────────────────────────

export async function getCatBreeds(): Promise<CatBreed[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cat_breeds')
    .select('*')
    .eq('active', true)
    .order('name')
  if (error) throw error
  return data ?? []
}

// ── Cat Characters ─────────────────────────────────────────

export async function getCatCharacters(): Promise<CatCharacter[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cat_characters')
    .select('*, breed:cat_breeds(*)')
    .eq('active', true)
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function getCatCharacter(id: string): Promise<CatCharacter | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cat_characters')
    .select('*, breed:cat_breeds(*)')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function createCatCharacter(
  input: Omit<CatCharacter, 'id' | 'created_at' | 'breed'>
): Promise<CatCharacter> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cat_characters')
    .insert(input)
    .select('*, breed:cat_breeds(*)')
    .single()
  if (error) throw error
  return data
}

export async function updateCatCharacter(
  id: string,
  input: Partial<Omit<CatCharacter, 'id' | 'created_at' | 'breed'>>
): Promise<CatCharacter> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cat_characters')
    .update(input)
    .eq('id', id)
    .select('*, breed:cat_breeds(*)')
    .single()
  if (error) throw error
  return data
}

export async function deleteCatCharacter(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('cat_characters')
    .update({ active: false })
    .eq('id', id)
  if (error) throw error
}

// ── Scenarios ──────────────────────────────────────────────

export async function getScenarios(): Promise<Scenario[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .eq('active', true)
    .order('name')
  if (error) throw error
  return data ?? []
}

// ── Videos ─────────────────────────────────────────────────

export async function getVideos(limit = 50): Promise<Video[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('videos')
    .select('*, character:cat_characters(*, breed:cat_breeds(*)), scenario:scenarios(*)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function getVideo(id: string): Promise<Video | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('videos')
    .select('*, character:cat_characters(*, breed:cat_breeds(*)), scenario:scenarios(*)')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function createVideo(
  form: StudioFormState,
  prompts: { frame1: string; frame2: string; veo3: string }
): Promise<Video> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('videos')
    .insert({
      character_id: form.character_id || null,
      scenario_id: form.scenario_id || null,
      title: form.title,
      topic_category: form.topic_category,
      spoken_script: form.spoken_script,
      script_tone: form.script_tone,
      accessories_override: form.accessories_override,
      animation_effects: form.animation_effects,
      camera_movements: form.camera_movements,
      prompt_frame1: prompts.frame1,
      prompt_frame2: prompts.frame2,
      prompt_veo3: prompts.veo3,
      status: 'draft',
    })
    .select('*, character:cat_characters(*, breed:cat_breeds(*)), scenario:scenarios(*)')
    .single()
  if (error) throw error
  return data
}

export async function updateVideoStatus(
  id: string,
  status: Video['status'],
  extra?: { n8n_execution_id?: string; video_url?: string; image_url?: string }
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('videos')
    .update({ status, ...extra })
    .eq('id', id)
  if (error) throw error
}

export async function deleteVideo(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('videos').delete().eq('id', id)
  if (error) throw error
}

// ── n8n Config ─────────────────────────────────────────────

export async function getN8nConfig(): Promise<N8nConfig | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('n8n_config')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ?? null
}

export async function upsertN8nConfig(
  input: Omit<N8nConfig, 'id' | 'updated_at'>
): Promise<void> {
  const supabase = createClient()
  const existing = await getN8nConfig()
  if (existing) {
    await supabase
      .from('n8n_config')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    await supabase.from('n8n_config').insert({ ...input })
  }
}

// ── Dashboard Stats ────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient()
  const [charsRes, videosRes] = await Promise.all([
    supabase.from('cat_characters').select('id', { count: 'exact' }).eq('active', true),
    supabase
      .from('videos')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const allVideos = (videosRes.data ?? []) as Video[]

  return {
    totalCharacters: charsRes.count ?? 0,
    totalVideos: videosRes.count ?? 0,
    videosGenerating: allVideos.filter((v) => v.status === 'generating').length,
    videosDone: allVideos.filter((v) => v.status === 'done').length,
    recentVideos: allVideos.slice(0, 4),
  }
}