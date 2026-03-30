import { createClient } from './server'
import type { N8nConfig } from '@/types'

export async function getN8nConfigServer(): Promise<N8nConfig | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('n8n_config')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ?? null
}