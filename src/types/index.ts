// ============================================================
// KATS-TALKS — Type Definitions
// ============================================================

export type VideoStatus = 'draft' | 'generating' | 'done' | 'error'

export type ScenarioCategory = 'interior' | 'exterior' | 'fantasy' | 'studio'

export type TopicCategory =
  | 'consejos_vida'
  | 'reflexiones_humanos'
  | 'datos_gatos'
  | 'cuidados_felinos'
  | 'filosofia_gatuna'
  | 'comentarios_sociales'
  | 'moda_estetica'
  | 'recetas_comida'
  | 'humor'
  | 'motivacion'

export type ScriptTone =
  | 'sabio_tranquilo'
  | 'dramatico'
  | 'sarcastico'
  | 'tierno'
  | 'misterioso'
  | 'divertido'
  | 'reflexivo'
  | 'urgente'

export const TOPIC_CATEGORY_LABELS: Record<TopicCategory, string> = {
  consejos_vida: 'Consejos de vida',
  reflexiones_humanos: 'Reflexiones sobre humanos',
  datos_gatos: 'Datos sobre gatos',
  cuidados_felinos: 'Cuidados felinos',
  filosofia_gatuna: 'Filosofía gatuna',
  comentarios_sociales: 'Comentarios sociales',
  moda_estetica: 'Moda y estética',
  recetas_comida: 'Recetas y comida',
  humor: 'Humor y parodia',
  motivacion: 'Motivación',
}

export const SCRIPT_TONE_LABELS: Record<ScriptTone, string> = {
  sabio_tranquilo: 'Sabio y tranquilo',
  dramatico: 'Dramático',
  sarcastico: 'Sarcástico',
  tierno: 'Tierno',
  misterioso: 'Misterioso',
  divertido: 'Divertido',
  reflexivo: 'Reflexivo',
  urgente: 'Urgente',
}

export const ANIMATION_EFFECTS = [
  { id: 'soft_bounce', label: 'Rebote suave', emoji: '🫧' },
  { id: 'head_tilt', label: 'Giro de cabeza', emoji: '🐱' },
  { id: 'expressive_blink', label: 'Parpadeo expresivo', emoji: '👁️' },
  { id: 'dramatic_whisper', label: 'Susurro dramático', emoji: '🤫' },
  { id: 'pointing_paw', label: 'Pata señalando', emoji: '👉' },
  { id: 'surprise_jump', label: 'Salto de sorpresa', emoji: '😱' },
  { id: 'visible_purr', label: 'Ronroneo visible', emoji: '💜' },
  { id: 'wide_eyes', label: 'Ojos desorbitados', emoji: '👀' },
  { id: 'tail_wag', label: 'Movimiento de cola', emoji: '🐾' },
  { id: 'approval_gesture', label: 'Gesto de aprobación', emoji: '✅' },
] as const

export const CAMERA_MOVEMENTS = [
  { id: 'gentle_zoom_in', label: 'Zoom suave entrada', emoji: '🔍' },
  { id: 'dramatic_zoom', label: 'Zoom dramático', emoji: '🎯' },
  { id: 'pan_left', label: 'Pan lateral izquierda', emoji: '⬅️' },
  { id: 'pan_right', label: 'Pan lateral derecha', emoji: '➡️' },
  { id: 'orbital', label: 'Giro orbital', emoji: '🌀' },
  { id: 'top_down', label: 'Picado', emoji: '⬇️' },
  { id: 'low_angle', label: 'Contrapicado', emoji: '⬆️' },
  { id: 'dutch_angle', label: 'Ángulo holandés', emoji: '📐' },
  { id: 'smooth_follow', label: 'Seguimiento suave', emoji: '🎬' },
  { id: 'static', label: 'Estático', emoji: '🎞️' },
] as const

export type AnimationEffectId = typeof ANIMATION_EFFECTS[number]['id']
export type CameraMovementId = typeof CAMERA_MOVEMENTS[number]['id']

// ── Video versions ─────────────────────────────────────────

export interface VideoVersion {
  id: string
  video_id: string
  video_url: string
  created_at: string
}

// ── Database entities ──────────────────────────────────────

export interface CatBreed {
  id: string
  name: string
  description: string
  visual_traits: string
  personality: string
  prompt_base: string
  active: boolean
  created_at: string
}

export interface CatCharacter {
  id: string
  name: string
  breed_id: string | null
  fur_color: string
  eye_color: string
  accessories: string[]
  personality: string
  catchphrase: string
  backstory: string
  prompt_description: string
  active: boolean
  created_at: string
  breed?: CatBreed
}

export interface Scenario {
  id: string
  name: string
  category: ScenarioCategory
  description: string
  visual_prompt: string
  lighting: string
  props: string[]
  active: boolean
  created_at: string
}

export interface Video {
  id: string
  character_id: string | null
  scenario_id: string | null
  title: string
  topic_category: TopicCategory
  spoken_script: string
  script_tone: ScriptTone
  accessories_override: string[]
  animation_effects: string[]
  camera_movements: string[]
  prompt_frame1: string | null
  prompt_frame2: string | null
  prompt_veo3: string | null
  n8n_execution_id: string | null
  status: VideoStatus
  video_url: string | null
  image_url: string | null
  notes: string | null
  created_at: string
  character?: CatCharacter
  scenario?: Scenario
  versions?: VideoVersion[]
}

export interface N8nConfig {
  id: string
  instance_url: string
  api_key: string
  workflow_kats_veo3_id: string | null
  gemini_api_key: string | null
  openai_api_key: string | null
  updated_at: string
}

// ── Studio form state ──────────────────────────────────────

export interface StudioFormState {
  character_id: string
  scenario_id: string
  title: string
  topic_category: TopicCategory
  spoken_script: string
  script_tone: ScriptTone
  accessories_override: string[]
  animation_effects: string[]
  camera_movements: string[]
}

// ── Prompt builder output ──────────────────────────────────

export interface GeneratedPrompts {
  frame1: string
  frame2: string
  veo3: string
}

export interface DashboardStats {
  totalCharacters: number
  totalVideos: number
  videosGenerating: number
  videosDone: number
  recentVideos: Video[]
}