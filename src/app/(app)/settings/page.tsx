'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getN8nConfig, upsertN8nConfig } from '@/lib/supabase/queries'
import type { N8nConfig } from '@/types'
import { Loader2, Save, CheckCircle, XCircle, Wifi } from 'lucide-react'
import { toast } from 'sonner'

interface FormState {
  instance_url: string
  api_key: string
  workflow_kats_veo3_id: string
  gemini_api_key: string
  openai_api_key: string
}

const EMPTY: FormState = {
  instance_url: '',
  api_key: '',
  workflow_kats_veo3_id: '',
  gemini_api_key: '',
  openai_api_key: '',
}

export default function SettingsPage() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [workflows, setWorkflows] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    getN8nConfig()
      .then((config) => {
        if (config) {
          setForm({
            instance_url: config.instance_url ?? '',
            api_key: config.api_key ?? '',
            workflow_kats_veo3_id: config.workflow_kats_veo3_id ?? '',
            gemini_api_key: config.gemini_api_key ?? '',
            openai_api_key: config.openai_api_key ?? '',
          })
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function set(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    setConnectionStatus('idle')
    setWorkflows([])
  }

  async function handleTest() {
    if (!form.instance_url || !form.api_key) {
      toast.error('Introduce la URL y la API key de n8n primero')
      return
    }
    setTesting(true)
    setConnectionStatus('idle')
    try {
      const res = await fetch('/api/n8n/workflows')
      const data = await res.json()
      if (res.ok && data.data) {
        setConnectionStatus('ok')
        setWorkflows(data.data.map((w: { id: string; name: string }) => ({ id: w.id, name: w.name })))
        toast.success(`Conectado — ${data.data.length} workflows encontrados`)
      } else {
        setConnectionStatus('error')
        toast.error(data.error ?? 'No se pudo conectar a n8n')
      }
    } catch {
      setConnectionStatus('error')
      toast.error('Error de red al conectar con n8n')
    } finally {
      setTesting(false)
    }
  }

  async function handleSave() {
    if (!form.instance_url.trim()) {
      toast.error('La URL de n8n es obligatoria')
      return
    }
    setSaving(true)
    try {
      await upsertN8nConfig({
        instance_url: form.instance_url.trim().replace(/\/$/, ''),
        api_key: form.api_key.trim(),
        workflow_kats_veo3_id: form.workflow_kats_veo3_id.trim() || null,
        gemini_api_key: form.gemini_api_key.trim() || null,
        openai_api_key: form.openai_api_key.trim() || null,
      } as Omit<N8nConfig, 'id' | 'updated_at'>)
      toast.success('Configuración guardada')
    } catch (err) {
      toast.error(String(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-sm text-muted-foreground">Conexiones y claves de API</p>
      </div>

      {/* n8n connection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">n8n</CardTitle>
          <CardDescription>Instancia de automatización para generar videos con Veo3</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>URL de la instancia *</Label>
            <Input
              value={form.instance_url}
              onChange={(e) => set('instance_url', e.target.value)}
              placeholder="https://tu-instancia.n8n.cloud"
            />
          </div>

          <div className="space-y-1.5">
            <Label>API Key</Label>
            <Input
              type="password"
              value={form.api_key}
              onChange={(e) => set('api_key', e.target.value)}
              placeholder="n8n_api_..."
            />
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              {testing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wifi className="w-4 h-4 mr-2" />
              )}
              Probar conexión
            </Button>
            {connectionStatus === 'ok' && (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" /> Conectado
              </span>
            )}
            {connectionStatus === 'error' && (
              <span className="flex items-center gap-1.5 text-sm text-destructive">
                <XCircle className="w-4 h-4" /> Sin conexión
              </span>
            )}
          </div>

          {workflows.length > 0 && (
            <div className="text-xs space-y-1 border rounded-md p-3 bg-muted/40">
              <p className="font-medium mb-2">Workflows disponibles:</p>
              {workflows.map((w) => (
                <div key={w.id} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground truncate">{w.name}</span>
                  <code className="shrink-0">{w.id}</code>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5 pt-1">
            <Label>
              ID del workflow Kats Veo3
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                (nombre esperado: Kats Talks Veo3 - kats-talks)
              </span>
            </Label>
            <Input
              value={form.workflow_kats_veo3_id}
              onChange={(e) => set('workflow_kats_veo3_id', e.target.value)}
              placeholder="ABC123xyz"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Copia el ID del workflow desde la lista de arriba después de probar la conexión.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Claves de API de IA</CardTitle>
          <CardDescription>Se almacenan en Supabase y se pasan al workflow n8n</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>
              Google AI Studio API Key
              <span className="ml-2 text-xs text-muted-foreground font-normal">(Gemini + Veo3)</span>
            </Label>
            <Input
              type="password"
              value={form.gemini_api_key}
              onChange={(e) => set('gemini_api_key', e.target.value)}
              placeholder="AIza..."
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              OpenAI API Key
              <span className="ml-2 text-xs text-muted-foreground font-normal">(script GPT — opcional)</span>
            </Label>
            <Input
              type="password"
              value={form.openai_api_key}
              onChange={(e) => set('openai_api_key', e.target.value)}
              placeholder="sk-..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Help */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-4 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground mb-2">Flujo de trabajo</p>
          <p>1. Introduce la URL de tu instancia n8n y la API key.</p>
          <p>2. Pulsa "Probar conexión" para ver los workflows disponibles.</p>
          <p>3. Copia el ID del workflow <em>Kats Talks Veo3 - kats-talks</em> y pégalo arriba.</p>
          <p>4. Añade tu Google AI Studio API key para que el workflow pueda llamar a Gemini y Veo3.</p>
          <p>5. Guarda la configuración.</p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Guardar configuración
        </Button>
      </div>
    </div>
  )
}