'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getCatCharacters,
  getCatBreeds,
  createCatCharacter,
  updateCatCharacter,
  deleteCatCharacter,
} from '@/lib/supabase/queries'
import type { CatCharacter, CatBreed } from '@/types'
import { Loader2, Plus, Pencil, Trash2, Cat } from 'lucide-react'
import { toast } from 'sonner'

interface CharForm {
  name: string
  breed_id: string
  fur_color: string
  eye_color: string
  accessories: string[]
  personality: string
  catchphrase: string
  backstory: string
  prompt_description: string
}

const EMPTY_FORM: CharForm = {
  name: '',
  breed_id: '',
  fur_color: '',
  eye_color: '',
  accessories: [],
  personality: '',
  catchphrase: '',
  backstory: '',
  prompt_description: '',
}

export default function CatsPage() {
  const [characters, setCharacters] = useState<CatCharacter[]>([])
  const [breeds, setBreeds] = useState<CatBreed[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<CharForm>(EMPTY_FORM)
  const [accessoryInput, setAccessoryInput] = useState('')

  async function load() {
    const [chars, br] = await Promise.all([getCatCharacters(), getCatBreeds()])
    setCharacters(chars)
    setBreeds(br)
  }

  useEffect(() => {
    load().catch(console.error).finally(() => setLoading(false))
  }, [])

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setDialogOpen(true)
  }

  function openEdit(char: CatCharacter) {
    setForm({
      name: char.name,
      breed_id: char.breed_id ?? '',
      fur_color: char.fur_color,
      eye_color: char.eye_color,
      accessories: char.accessories,
      personality: char.personality,
      catchphrase: char.catchphrase,
      backstory: char.backstory,
      prompt_description: char.prompt_description,
    })
    setEditingId(char.id)
    setDialogOpen(true)
  }

  function set(key: keyof CharForm, value: string | string[]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function addAccessory() {
    const acc = accessoryInput.trim()
    if (!acc || form.accessories.includes(acc)) return
    set('accessories', [...form.accessories, acc])
    setAccessoryInput('')
  }

  function removeAccessory(acc: string) {
    set('accessories', form.accessories.filter((a) => a !== acc))
  }

  // Auto-build prompt_description from other fields
  function autoGeneratePrompt() {
    const breed = breeds.find((b) => b.id === form.breed_id)
    if (!breed) { toast.error('Selecciona una raza primero'); return }
    const accs = form.accessories.length > 0 ? `, wearing ${form.accessories.join(', ')}` : ''
    const generated = `${form.fur_color} ${breed.prompt_base} named ${form.name}${accs}, ${form.eye_color} eyes, ${form.personality.split(',')[0]?.trim() ?? ''} expression`
    set('prompt_description', generated)
    toast.success('Descripción generada')
  }

  async function handleSave() {
    if (!form.name.trim() || !form.fur_color.trim() || !form.prompt_description.trim()) {
      toast.error('Nombre, color y descripción de prompt son obligatorios')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        breed_id: form.breed_id || null,
        active: true,
      }
      if (editingId) {
        await updateCatCharacter(editingId, payload)
        toast.success('Personaje actualizado')
      } else {
        await createCatCharacter(payload)
        toast.success('Personaje creado')
      }
      await load()
      setDialogOpen(false)
    } catch (err) {
      toast.error(String(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar a ${name}?`)) return
    try {
      await deleteCatCharacter(id)
      await load()
      toast.success('Personaje eliminado')
    } catch {
      toast.error('Error al eliminar')
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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Personajes</h1>
          <p className="text-sm text-muted-foreground">Crea y gestiona tus gatos protagonistas</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo personaje
        </Button>
      </div>

      {characters.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center space-y-4">
            <div className="text-6xl">🐱</div>
            <p className="font-semibold text-lg">No tienes personajes todavía</p>
            <p className="text-sm text-muted-foreground">
              Crea tu primer gato Pixar para empezar a generar videos
            </p>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Crear personaje
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((char) => (
            <Card key={char.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="text-3xl">🐱</div>
                    <div>
                      <CardTitle className="text-base">{char.name}</CardTitle>
                      <CardDescription>{char.breed?.name ?? 'Sin raza'}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(char)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(char.id, char.name)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>🎨 {char.fur_color}</span>
                  <span>·</span>
                  <span>👁️ {char.eye_color}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{char.personality}</p>
                {char.accessories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {char.accessories.map((a) => (
                      <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
                    ))}
                  </div>
                )}
                {char.catchphrase && (
                  <p className="text-xs italic text-muted-foreground border-t pt-2">
                    &ldquo;{char.catchphrase}&rdquo;
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cat className="w-5 h-5" />
              {editingId ? 'Editar personaje' : 'Nuevo personaje'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nombre *</Label>
                <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Mochi" />
              </div>
              <div className="space-y-1.5">
                <Label>Raza</Label>
                <Select value={form.breed_id} onValueChange={(v) => { if (v) set('breed_id', v) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar raza" />
                  </SelectTrigger>
                  <SelectContent>
                    {breeds.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Color del pelaje *</Label>
                <Input value={form.fur_color} onChange={(e) => set('fur_color', e.target.value)} placeholder="cream and orange tabby" />
              </div>
              <div className="space-y-1.5">
                <Label>Color de ojos</Label>
                <Input value={form.eye_color} onChange={(e) => set('eye_color', e.target.value)} placeholder="big amber eyes" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Complementos permanentes</Label>
              <div className="flex gap-2">
                <Input
                  value={accessoryInput}
                  onChange={(e) => setAccessoryInput(e.target.value)}
                  placeholder="Ej: tiny glasses, bow tie"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAccessory())}
                />
                <Button variant="outline" type="button" onClick={addAccessory}>Añadir</Button>
              </div>
              {form.accessories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {form.accessories.map((a) => (
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
            </div>

            <div className="space-y-1.5">
              <Label>Personalidad</Label>
              <Input
                value={form.personality}
                onChange={(e) => set('personality', e.target.value)}
                placeholder="wise, sarcastic, secretly tender"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Catchphrase</Label>
              <Input
                value={form.catchphrase}
                onChange={(e) => set('catchphrase', e.target.value)}
                placeholder="Los humanos sois adorablemente complicados."
              />
            </div>

            <div className="space-y-1.5">
              <Label>Historia / Backstory</Label>
              <Textarea
                value={form.backstory}
                onChange={(e) => set('backstory', e.target.value)}
                placeholder="Ex-library cat who has read every book by osmosis..."
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Descripción para prompts * <span className="text-xs text-muted-foreground font-normal">(se usa en Gemini y Veo3)</span></Label>
                <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={autoGeneratePrompt} type="button">
                  ✨ Auto-generar
                </Button>
              </div>
              <Textarea
                value={form.prompt_description}
                onChange={(e) => set('prompt_description', e.target.value)}
                placeholder="cream and orange tabby Maine Coon cat named Mochi, wearing tiny vintage glasses and a small bow tie..."
                rows={3}
                className="resize-none text-xs font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Describe visualmente al gato en inglés. Este texto va directamente a los prompts de Gemini/Veo3.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingId ? 'Guardar cambios' : 'Crear personaje'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}