'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getCatCharacters, getScenarios, createVideo, updateVideoStatus, getN8nConfig } from '@/lib/supabase/queries'
import { buildPrompts } from '@/lib/prompt-builder'
import type {
  CatCharacter,
  Scenario,
  StudioFormState,
  TopicCategory,
  ScriptTone,
} from '@/types'
import {
  ANIMATION_EFFECTS,
  CAMERA_MOVEMENTS,
  TOPIC_CATEGORY_LABELS,
  SCRIPT_TONE_LABELS,
} from '@/types'
import { Loader2, Wand2, Copy, Check, ChevronRight, Cat, MapPin, FileText, Sparkles, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 1, label: 'Gato', icon: Cat },
  { id: 2, label: 'Escenario', icon: MapPin },
  { id: 3, label: 'Guión', icon: FileText },
  { id: 4, label: 'Animación', icon: Sparkles },
  { id: 5, label: 'Revisar', icon: Eye },
]

const EMPTY_FORM: StudioFormState = {
  character_id: '',
  scenario_id: '',
  title: '',
  topic_category: 'reflexiones_humanos',
  spoken_script: '',
  script_tone: 'sarcastico',
  accessories_override: [],
  animation_effects: ['head_tilt', 'expressive_blink'],
  camera_movements: ['gentle_zoom_in'],
}

export function StudioForm() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<StudioFormState>(EMPTY_FORM)
  const [characters, setCharacters] = useState<CatCharacter[]>([])
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [accessoryInput, setAccessoryInput] = useState('')
  const [copied, setCopied] = useState<'frame1' | 'frame2' | 'veo3' | null>(null)

  useEffect(() => {
    Promise.all([getCatCharacters(), getScenarios()])
      .then(([chars, scens]) => {
        setCharacters(chars)
        setScenarios(scens)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const selectedCharacter = characters.find((c) => c.id === form.character_id) ?? null
  const selectedScenario = scenarios.find((s) => s.id === form.scenario_id) ?? null

  const prompts = useMemo(() => {
    if (!selectedCharacter || !selectedScenario) return null
    return buildPrompts(form, selectedCharacter, selectedScenario)
  }, [form, selectedCharacter, selectedScenario])

  function set<K extends keyof StudioFormState>(key: K, value: StudioFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function toggleEffect(id: string) {
    set(
      'animation_effects',
      form.animation_effects.includes(id)
        ? form.animation_effects.filter((e) => e !== id)
        : [...form.animation_effects, id]
    )
  }

  function toggleCamera(id: string) {
    set(
      'camera_movements',
      form.camera_movements.includes(id)
        ? form.camera_movements.filter((c) => c !== id)
        : [...form.camera_movements, id]
    )
  }

  function addAccessory() {
    const acc = accessoryInput.trim()
    if (!acc || form.accessories_override.includes(acc)) return
    set('accessories_override', [...form.accessories_override, acc])
    setAccessoryInput('')
  }

  function removeAccessory(acc: string) {
    set('accessories_override', form.accessories_override.filter((a) => a !== acc))
  }

  async function copyToClipboard(text: string, key: 'frame1' | 'frame2' | 'veo3') {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
    toast.success('Prompt copiado')
  }

  async function handleGenerate() {
    if (!prompts || !selectedCharacter || !selectedScenario) return
    if (!form.title.trim()) { toast.error('Añade un título'); return }
    if (!form.spoken_script.trim()) { toast.error('Escribe el guión'); return }

    setGenerating(true)
    try {
      const video = await createVideo(form, prompts)

      const payload = {
        video_id: video.id,
        personaje: selectedCharacter.name,
        raza: selectedCharacter.breed?.name ?? '',
        descripcion_gato: selectedCharacter.prompt_description,
        escenario: selectedScenario.name,
        descripcion_escenario: selectedScenario.visual_prompt,
        guion_hablado: form.spoken_script,
        tono: SCRIPT_TONE_LABELS[form.script_tone],
        efectos_animacion: form.animation_effects.join(', '),
        movimientos_camara: form.camera_movements.join(', '),
        prompt_frame1: prompts.frame1,
        prompt_frame2: prompts.frame2,
        prompt_veo3: prompts.veo3,
        titulo: form.title,
      }

      const n8nConfig = await getN8nConfig()
      if (!n8nConfig?.instance_url) {
        throw new Error('n8n no configurado. Ve a Configuración y guarda la URL de n8n.')
      }
      const webhookUrl = `${n8nConfig.instance_url.replace(/\/$/, '')}/webhook/kats-talks-veo3`

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`n8n respondió ${res.status}: ${text.slice(0, 200)}`)
      }

      const result = await res.json().catch(() => ({}))
      const executionId = result.executionId ?? result.id ?? null

      await updateVideoStatus(video.id, 'generating', {
        n8n_execution_id: executionId ?? undefined,
      })

      toast.success('¡Enviado a n8n! El video se está generando.')
      setForm(EMPTY_FORM)
      setStep(1)
    } catch (err) {
      toast.error(String(err))
    } finally {
      setGenerating(false)
    }
  }

  const canAdvance = {
    1: !!form.character_id,
    2: !!form.scenario_id,
    3: !!form.spoken_script.trim() && !!form.title.trim(),
    4: form.animation_effects.length > 0 || form.camera_movements.length > 0,
    5: true,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const done = step > s.id
          const active = step === s.id
          return (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => done && setStep(s.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  active && 'bg-primary text-primary-foreground',
                  done && 'text-primary cursor-pointer hover:bg-muted',
                  !active && !done && 'text-muted-foreground cursor-not-allowed'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{s.label}</span>
                {done && <Check className="w-3 h-3" />}
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />
              )}
            </div>
          )
        })}
      </div>

      <Separator />

      {/* ── Step 1: Select character ────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">1. Elige el gato protagonista</h2>
          {characters.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-muted-foreground">
                <Cat className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No tienes personajes creados todavía.</p>
                <p className="text-sm mt-1">Ve a <strong>Personajes</strong> para crear tu primer gato.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {characters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => set('character_id', char.id)}
                  className={cn(
                    'text-left p-4 rounded-xl border-2 transition-all hover:shadow-md',
                    form.character_id === char.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/40'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">🐱</div>
                    <div className="min-w-0">
                      <p className="font-semibold">{char.name}</p>
                      <p className="text-xs text-muted-foreground">{char.breed?.name ?? 'Sin raza'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{char.personality}</p>
                      {char.accessories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {char.accessories.map((a) => (
                            <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {form.character_id === char.id && (
                      <Check className="w-5 h-5 text-primary shrink-0 ml-auto" />
                    )}
                  </div>
                  {char.catchphrase && (
                    <p className="mt-2 text-xs italic text-muted-foreground border-t border-border/50 pt-2">
                      &ldquo;{char.catchphrase}&rdquo;
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Select scenario ─────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">2. Elige el escenario</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scenarios.map((sc) => (
              <button
                key={sc.id}
                onClick={() => set('scenario_id', sc.id)}
                className={cn(
                  'text-left p-4 rounded-xl border-2 transition-all hover:shadow-md',
                  form.scenario_id === sc.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/40'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {sc.category === 'interior' ? '🏠' :
                     sc.category === 'exterior' ? '🌿' :
                     sc.category === 'fantasy' ? '✨' : '🎬'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">{sc.name}</p>
                    <Badge variant="outline" className="text-xs mt-0.5">{sc.category}</Badge>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{sc.description}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1 italic">💡 {sc.lighting}</p>
                  </div>
                  {form.scenario_id === sc.id && (
                    <Check className="w-5 h-5 text-primary shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 3: Script ──────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold">3. Guión y contexto</h2>

          <div className="space-y-1.5">
            <Label>Título del video</Label>
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Ej: Por qué los humanos duermen la siesta mal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Categoría del tema</Label>
              <Select
                value={form.topic_category}
                onValueChange={(v) => { if (v) set('topic_category', v as TopicCategory) }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TOPIC_CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Tono del gato</Label>
              <Select
                value={form.script_tone}
                onValueChange={(v) => { if (v) set('script_tone', v as ScriptTone) }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SCRIPT_TONE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              Guión hablado
              <span className="text-muted-foreground font-normal ml-2 text-xs">
                ({form.spoken_script.length} chars · ~{Math.ceil(form.spoken_script.split(/\s+/).filter(Boolean).length / 2.5)}s)
              </span>
            </Label>
            <Textarea
              value={form.spoken_script}
              onChange={(e) => set('spoken_script', e.target.value)}
              placeholder="Escribe exactamente lo que dirá el gato. Máximo ~30 segundos de lectura."
              rows={5}
              className="resize-none font-medium"
            />
            <p className="text-xs text-muted-foreground">
              Tip: empieza con el hook, luego el mensaje principal. El gato hará lip sync perfecto.
            </p>
          </div>

          {/* Extra accessories for this video */}
          <div className="space-y-1.5">
            <Label>Complementos extra (opcionales para este video)</Label>
            <div className="flex gap-2">
              <Input
                value={accessoryInput}
                onChange={(e) => setAccessoryInput(e.target.value)}
                placeholder="Ej: sombrero de chef, delantal"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAccessory())}
              />
              <Button variant="outline" onClick={addAccessory} type="button">
                Añadir
              </Button>
            </div>
            {form.accessories_override.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {form.accessories_override.map((a) => (
                  <Badge
                    key={a}
                    variant="secondary"
                    className="gap-1 cursor-pointer"
                    onClick={() => removeAccessory(a)}
                  >
                    {a} ✕
                  </Badge>
                ))}
              </div>
            )}
            {selectedCharacter?.accessories && selectedCharacter.accessories.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Permanentes del personaje: {selectedCharacter.accessories.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Step 4: Animation & Camera ──────────────────── */}
      {step === 4 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">4. Animación y cámara</h2>

          <div className="space-y-3">
            <Label className="text-base">Efectos de animación</Label>
            <p className="text-xs text-muted-foreground -mt-1">Selecciona los efectos que tendrá el gato durante el video</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ANIMATION_EFFECTS.map((effect) => {
                const active = form.animation_effects.includes(effect.id)
                return (
                  <button
                    key={effect.id}
                    onClick={() => toggleEffect(effect.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left',
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className="text-base">{effect.emoji}</span>
                    <span className="text-xs leading-tight">{effect.label}</span>
                    {active && <Check className="w-3 h-3 ml-auto shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base">Movimientos de cámara</Label>
            <p className="text-xs text-muted-foreground -mt-1">Define cómo se mueve la cámara durante el video</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CAMERA_MOVEMENTS.map((cam) => {
                const active = form.camera_movements.includes(cam.id)
                return (
                  <button
                    key={cam.id}
                    onClick={() => toggleCamera(cam.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left',
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className="text-base">{cam.emoji}</span>
                    <span className="text-xs leading-tight">{cam.label}</span>
                    {active && <Check className="w-3 h-3 ml-auto shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 5: Preview prompts ─────────────────────── */}
      {step === 5 && (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold">5. Revisar prompts generados</h2>

          {!prompts ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                Completa los pasos anteriores para generar los prompts
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <Card className="bg-muted/30">
                <CardContent className="py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Gato</p>
                    <p className="text-sm font-medium">{selectedCharacter?.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedCharacter?.breed?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Escenario</p>
                    <p className="text-sm font-medium">{selectedScenario?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tono</p>
                    <p className="text-sm font-medium">{SCRIPT_TONE_LABELS[form.script_tone]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Efectos</p>
                    <p className="text-sm font-medium">{form.animation_effects.length + form.camera_movements.length} seleccionados</p>
                  </div>
                </CardContent>
              </Card>

              {/* Prompt cards */}
              {([
                { key: 'frame1' as const, label: '📷 Frame 1 (Gemini — plano establecido)', text: prompts.frame1 },
                { key: 'frame2' as const, label: '📷 Frame 2 (Gemini — boca abierta / expresión)', text: prompts.frame2 },
                { key: 'veo3' as const, label: '🎬 Veo3 (animación completa con lip sync)', text: prompts.veo3 },
              ]).map(({ key, label, text }) => (
                <Card key={key}>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{label}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(text, key)}
                        className="h-7 w-7 p-0"
                      >
                        {copied === key ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-3 font-mono whitespace-pre-wrap">
                      {text}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Navigation ─────────────────────────────────── */}
      <Separator />
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          Atrás
        </Button>

        <div className="flex items-center gap-2">
          {step < 5 && (
            <Button
              onClick={() => setStep((s) => Math.min(5, s + 1))}
              disabled={!canAdvance[step as keyof typeof canAdvance]}
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}

          {step === 5 && (
            <Button
              onClick={handleGenerate}
              disabled={generating || !prompts || !form.title.trim() || !form.spoken_script.trim()}
              className="bg-primary"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generando...</>
              ) : (
                <><Wand2 className="w-4 h-4 mr-2" />Generar con Veo3</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}