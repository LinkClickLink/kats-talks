'use client'

import { useEffect, useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getVideos, deleteVideo } from '@/lib/supabase/queries'
import type { Video, VideoStatus } from '@/types'
import { TOPIC_CATEGORY_LABELS, SCRIPT_TONE_LABELS } from '@/types'
import { Loader2, Trash2, Eye, Film, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const STATUS_CONFIG: Record<VideoStatus, { label: string; variant: 'outline' | 'secondary' | 'default' | 'destructive' }> = {
  draft: { label: 'Borrador', variant: 'outline' },
  generating: { label: 'Generando…', variant: 'secondary' },
  done: { label: 'Listo', variant: 'default' },
  error: { label: 'Error', variant: 'destructive' },
}

const STATUS_FILTERS: { value: VideoStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'done', label: 'Listos' },
  { value: 'generating', label: 'Generando' },
  { value: 'draft', label: 'Borradores' },
  { value: 'error', label: 'Error' },
]

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<VideoStatus | 'all'>('all')
  const [selected, setSelected] = useState<Video | null>(null)

  async function load() {
    const data = await getVideos(100)
    setVideos(data)
  }

  useEffect(() => {
    load().catch(console.error).finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string, title: string) {
    if (!confirm(`¿Eliminar el video "${title}"?`)) return
    try {
      await deleteVideo(id)
      await load()
      toast.success('Video eliminado')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const filtered = filter === 'all' ? videos : videos.filter((v) => v.status === filter)

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Videos</h1>
          <p className="text-sm text-muted-foreground">{videos.length} videos generados</p>
        </div>
        <Link href="/studio" className={buttonVariants()}>+ Nuevo video</Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            {f.value !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({videos.filter((v) => v.status === f.value).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center space-y-4">
            <div className="text-6xl">🎬</div>
            <p className="font-semibold text-lg">No hay videos aquí</p>
            <p className="text-sm text-muted-foreground">
              {filter === 'all'
                ? 'Crea tu primer video en el Studio'
                : `No hay videos con estado "${STATUS_FILTERS.find((f) => f.value === filter)?.label}"`}
            </p>
            {filter === 'all' && (
              <Link href="/studio" className={buttonVariants()}>Ir al Studio</Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((video) => {
            const badge = STATUS_CONFIG[video.status]
            return (
              <Card key={video.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-3 px-4 flex items-center gap-4">
                  <div className="text-2xl shrink-0">
                    {video.status === 'done' ? '🎬' : video.status === 'generating' ? '⏳' : '📋'}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="font-medium text-sm truncate">{video.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {video.character?.name ?? '—'} · {video.scenario?.name ?? '—'}
                    </p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>{TOPIC_CATEGORY_LABELS[video.topic_category]}</span>
                      <span>·</span>
                      <span>{SCRIPT_TONE_LABELS[video.script_tone]}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {new Date(video.created_at).toLocaleDateString('es', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    {video.video_url && (
                      <a
                        href={video.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setSelected(video)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(video.id, video.title)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Film className="w-5 h-5" />
              {selected?.title}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 pt-2 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant={STATUS_CONFIG[selected.status].variant}>
                  {STATUS_CONFIG[selected.status].label}
                </Badge>
                <Badge variant="outline">{TOPIC_CATEGORY_LABELS[selected.topic_category]}</Badge>
                <Badge variant="outline">{SCRIPT_TONE_LABELS[selected.script_tone]}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-medium text-muted-foreground mb-0.5">Personaje</p>
                  <p>{selected.character?.name ?? '—'}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground mb-0.5">Escenario</p>
                  <p>{selected.scenario?.name ?? '—'}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground mb-0.5">Efectos</p>
                  <p>{selected.animation_effects.join(', ') || '—'}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground mb-0.5">Cámara</p>
                  <p>{selected.camera_movements.join(', ') || '—'}</p>
                </div>
              </div>

              {selected.spoken_script && (
                <div>
                  <p className="font-medium text-muted-foreground mb-1">Guión</p>
                  <p className="text-xs bg-muted rounded p-2 whitespace-pre-wrap">{selected.spoken_script}</p>
                </div>
              )}

              {selected.prompt_veo3 && (
                <div>
                  <p className="font-medium text-muted-foreground mb-1">Prompt Veo3</p>
                  <p className="text-xs font-mono bg-muted rounded p-2 whitespace-pre-wrap">{selected.prompt_veo3}</p>
                </div>
              )}

              {selected.video_url && (
                <div>
                  <p className="font-medium text-muted-foreground mb-1">Video</p>
                  <a
                    href={selected.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline break-all"
                  >
                    {selected.video_url}
                  </a>
                </div>
              )}

              {selected.n8n_execution_id && (
                <p className="text-xs text-muted-foreground">
                  Ejecución n8n: {selected.n8n_execution_id}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}