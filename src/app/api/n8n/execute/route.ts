import { NextRequest, NextResponse } from 'next/server'
import { getN8nConfig } from '@/lib/supabase/queries'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const config = await getN8nConfig()

    if (!config?.instance_url || !config?.api_key) {
      return NextResponse.json({ error: 'n8n not configured' }, { status: 400 })
    }

    if (!config.workflow_kats_veo3_id) {
      return NextResponse.json({ error: 'Workflow ID not configured' }, { status: 400 })
    }

    const webhookUrl = `${config.instance_url.replace(/\/$/, '')}/webhook/kats-talks-veo3`

    let res: Response
    try {
      res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      })
    } catch (fetchErr) {
      const cause = fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
      return NextResponse.json(
        { error: `No se pudo conectar con n8n (${webhookUrl}): ${cause}` },
        { status: 502 }
      )
    }

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message ?? `n8n respondió ${res.status}` },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}