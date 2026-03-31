import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Client passes webhookUrl directly (reads n8n config from Supabase client-side)
    const webhookUrl: string | undefined = body._webhookUrl
    if (!webhookUrl) {
      return NextResponse.json({ error: 'n8n not configured' }, { status: 400 })
    }
    delete body._webhookUrl

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