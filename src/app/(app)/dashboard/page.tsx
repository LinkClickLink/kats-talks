'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { getDashboardStats } from '@/lib/supabase/queries'
import type { DashboardStats } from '@/types'
import { Cat, Film, Loader2, Wand2, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

const STATUS_BADGE = {
  draft: { label: 'Borrador', variant: 'outline' as const },
  generating: { label: 'Generando', variant: 'secondary' as const },
  done: { label: 'Listo', variant: 'default' as const },
  error: { label: 'Error', variant: 'destructive' as const },
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen de tu canal @kats.talks</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <Cat className="w-8 h-8 text-primary shrink-0" />
            <div>
              <p className="text-2xl font-bold">{stats?.totalCharacters ?? 0}</p>
              <p className="text-xs text-muted-foreground">Personajes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <Film className="w-8 h-8 text-blue-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{stats?.totalVideos ?? 0}</p>
              <p className="text-xs text-muted-foreground">Videos totales</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{stats?.videosDone ?? 0}</p>
              <p className="text-xs text-muted-foreground">Completados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <Clock className="w-8 h-8 text-orange-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{stats?.videosGenerating ?? 0}</p>
              <p className="text-xs text-muted-foreground">Generando</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/studio" className={buttonVariants()}>
          <Wand2 className="w-4 h-4 mr-2" />
          Crear video
        </Link>
        <Link href="/cats" className={buttonVariants({ variant: 'outline' })}>
          <Cat className="w-4 h-4 mr-2" />
          Gestionar personajes
        </Link>
        <Link href="/videos" className={buttonVariants({ variant: 'outline' })}>
          <Film className="w-4 h-4 mr-2" />
          Ver videos
        </Link>
      </div>

      {/* Recent videos */}
      {stats?.recentVideos && stats.recentVideos.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Videos recientes</h2>
          <div className="grid gap-3">
            {stats.recentVideos.map((video) => {
              const badge = STATUS_BADGE[video.status]
              return (
                <Card key={video.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="py-3 px-4 flex items-center gap-4">
                    <div className="text-2xl">🐱</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{video.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {video.character?.name ?? '—'} · {video.scenario?.name ?? '—'}
                      </p>
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {new Date(video.created_at).toLocaleDateString('es', { month: 'short', day: 'numeric' })}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!stats || stats.totalVideos === 0) && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-3">
            <div className="text-5xl">🐱</div>
            <p className="font-semibold">Bienvenido a Kats Talks Manager</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Empieza creando un personaje gato y luego genera tu primer video Pixar 3D con Veo3.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link href="/cats" className={buttonVariants()}>Crear personaje</Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}