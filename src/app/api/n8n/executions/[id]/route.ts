import { NextRequest, NextResponse } from 'next/server'
import { getN8nConfig } from '@/lib/supabase/queries'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const config = await getN8nConfig()

    if (!config?.instance_url || !config?.api_key) {
      return NextResponse.json({ error: 'n8n not configured' }, { status: 400 })
    }

    const url = `${config.instance_url.replace(/\/$/, '')}/api/v1/executions/${id}`
    const res = await fetch(url, {
      headers: { 'X-N8N-API-KEY': config.api_key },
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return NextResponse.json({ error: data.message ?? 'Execution not found' }, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}