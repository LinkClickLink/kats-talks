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

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message ?? 'Workflow execution failed' },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}