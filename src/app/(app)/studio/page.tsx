import { StudioForm } from '@/components/studio/studio-form'

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ resume?: string }>
}) {
  const { resume } = await searchParams
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Studio</h1>
        <p className="text-sm text-muted-foreground">
          {resume
            ? 'Retomando video guardado — revisa y envía a Veo3'
            : 'Crea un video de gato Pixar 3D en 5 pasos — Gemini + Veo3'}
        </p>
      </div>
      <StudioForm resumeVideoId={resume} />
    </div>
  )
}
