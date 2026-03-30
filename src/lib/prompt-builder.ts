import type {
  CatCharacter,
  Scenario,
  GeneratedPrompts,
  StudioFormState,
  ScriptTone,
} from '@/types'
import { ANIMATION_EFFECTS, CAMERA_MOVEMENTS, SCRIPT_TONE_LABELS } from '@/types'

// ── Tone → visual / acting description ────────────────────

const TONE_ACTING: Record<ScriptTone, string> = {
  sabio_tranquilo: 'calm and wise expression, serene posture, half-closed knowing eyes',
  dramatico: 'dramatic expressive face, paw on chest, intense eyes wide open',
  sarcastico: 'sarcastic smirk, one eyebrow raised, slightly tilted head',
  tierno: 'soft tender eyes, gentle smile, relaxed warm expression',
  misterioso: 'mysterious slightly narrowed eyes, secretive half-smile',
  divertido: 'playful wide grin, bright eyes, upbeat cheerful posture',
  reflexivo: 'thoughtful pensive expression, paw under chin, looking slightly up',
  urgente: 'urgent alert eyes, leaning forward, intense focused expression',
}

// ── Effect → prompt text ──────────────────────────────────

function effectsToPromptText(effectIds: string[]): string {
  const map = Object.fromEntries(ANIMATION_EFFECTS.map((e) => [e.id, e.label]))
  return effectIds.map((id) => map[id] ?? id).join(', ')
}

function cameraToPromptText(cameraIds: string[]): string {
  const descriptions: Record<string, string> = {
    gentle_zoom_in: 'gentle slow zoom in',
    dramatic_zoom: 'fast dramatic push in zoom',
    pan_left: 'smooth pan left',
    pan_right: 'smooth pan right',
    orbital: 'slow orbital rotation around subject',
    top_down: 'overhead bird-eye view angle',
    low_angle: 'low angle looking up at subject',
    dutch_angle: 'dutch tilt angle',
    smooth_follow: 'smooth tracking follow shot',
    static: 'locked off static camera',
  }
  return cameraIds.map((id) => descriptions[id] ?? id).join(', ')
}

// ── Accessories ────────────────────────────────────────────

function buildAccessoriesText(
  character: CatCharacter,
  overrides: string[]
): string {
  const all = [...character.accessories, ...overrides].filter(Boolean)
  if (all.length === 0) return ''
  return `wearing ${all.join(', ')}`
}

// ── Prompt builder ─────────────────────────────────────────

export function buildPrompts(
  form: StudioFormState,
  character: CatCharacter,
  scenario: Scenario
): GeneratedPrompts {
  const accessories = buildAccessoriesText(character, form.accessories_override)
  const toneActing = TONE_ACTING[form.script_tone]
  const toneLabel = SCRIPT_TONE_LABELS[form.script_tone].toLowerCase()
  const effects = effectsToPromptText(form.animation_effects)
  const camera = cameraToPromptText(form.camera_movements)

  // First line of script for frame 2 context
  const firstLine = form.spoken_script.split(/[.!?]/)[0].trim()

  // ── Frame 1: establishing shot ─────────────────────────
  const frame1 = [
    `Pixar Disney 3D animation style,`,
    `${character.prompt_description},`,
    accessories ? `${accessories},` : '',
    `sitting in ${scenario.visual_prompt},`,
    `${scenario.lighting},`,
    `looking directly at camera with curiosity and personality,`,
    `full body visible, big expressive eyes, ultra-detailed fur,`,
    `${toneActing},`,
    `cinematic quality, 9:16 vertical format, 1080x1920px,`,
    `no text on screen, no humans, photorealistic Pixar render`,
  ]
    .filter(Boolean)
    .join(' ')

  // ── Frame 2: mid-speech / expression ──────────────────
  const frame2 = [
    `Pixar Disney 3D animation style, EXACT SAME CHARACTER as previous image,`,
    `${character.prompt_description},`,
    accessories ? `${accessories},` : '',
    `in ${scenario.visual_prompt},`,
    `mouth slightly open as if speaking, animated ${toneLabel} facial expression,`,
    `${toneActing},`,
    `ready to say: "${firstLine}",`,
    `ultra-detailed fur, big expressive eyes, same lighting and setting,`,
    `full body visible, 9:16 vertical format, no text on screen`,
  ]
    .filter(Boolean)
    .join(' ')

  // ── Veo3: full animation prompt ────────────────────────
  const veo3Parts = [
    `Pixar Disney 3D animated short,`,
    `${character.name} the cat — ${character.prompt_description},`,
    accessories ? `${accessories},` : '',
    `in ${scenario.visual_prompt} with ${scenario.lighting}.`,
    ``,
    `The cat speaks in a ${toneLabel} tone:`,
    `"${form.spoken_script}"`,
    ``,
    `Perfect lip sync matching every word. Big expressive eyes, ultra-detailed fur animation.`,
    effects ? `Animation effects: ${effects}.` : '',
    camera ? `Camera: ${camera}.` : '',
    ``,
    `Pixar cinematic quality, 9:16 vertical format, no text overlay, no humans in frame,`,
    `smooth fluid animation, character remains CONSISTENT throughout entire video.`,
  ]
    .filter(Boolean)
    .join(' ')

  return { frame1, frame2, veo3: veo3Parts }
}

// ── Quick preview without full objects ───────────────────

export function buildQuickPreview(
  catDesc: string,
  scenarioDesc: string,
  script: string,
  tone: ScriptTone
): GeneratedPrompts {
  const toneActing = TONE_ACTING[tone]
  const toneLabel = SCRIPT_TONE_LABELS[tone].toLowerCase()
  const firstLine = script.split(/[.!?]/)[0].trim()

  const frame1 = `Pixar Disney 3D animation style, ${catDesc}, in ${scenarioDesc}, looking at camera, ${toneActing}, big expressive eyes, 9:16 format`
  const frame2 = `Pixar Disney 3D, SAME CHARACTER, ${catDesc}, mouth open speaking: "${firstLine}", ${toneLabel} expression, ${toneActing}`
  const veo3 = `Pixar 3D animated cat: ${catDesc}. Says: "${script}". ${toneLabel} tone, perfect lip sync, 9:16 format.`

  return { frame1, frame2, veo3 }
}