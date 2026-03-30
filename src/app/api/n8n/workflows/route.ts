import { NextResponse } from 'next/server'
import { getN8nConfigServer } from '@/lib/supabase/queries-server'

export async function GET() {
  try {
    const config = await getN8nConfigServer()

    if (!config?.instance_url || !config?.api_key) {
      return NextResponse.json({ error: 'n8n not configured' }, { status: 400 })
    }

    const url = `${config.instance_url.replace(/\/$/, '')}/api/v1/workflows?limit=50`
    const res = await fetch(url, {
      headers: { 'X-N8N-API-KEY': config.api_key },
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return NextResponse.json({ error: data.message ?? 'Failed to list workflows' }, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}