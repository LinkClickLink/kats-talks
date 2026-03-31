import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const instance_url = searchParams.get('instance_url')
    const api_key = searchParams.get('api_key')

    if (!instance_url || !api_key) {
      return NextResponse.json({ error: 'n8n not configured' }, { status: 400 })
    }

    const url = `${instance_url.replace(/\/$/, '')}/api/v1/workflows?limit=50`
    const res = await fetch(url, {
      headers: { 'X-N8N-API-KEY': api_key },
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