import type { SocialPlatform } from '../types/marketing'

// ---------------------------------------------------------------------------
// Best Posting Times (hour values in 24h format)
// ---------------------------------------------------------------------------

export interface TimeSlot {
  day: number  // 0=Sunday, 1=Monday ... 6=Saturday
  hour: number // 0-23
  score: number // 0=worst, 1=ok, 2=good, 3=best
}

function generateSlots(
  days: number[],
  hours: number[],
  score: number
): TimeSlot[] {
  return days.flatMap((day) => hours.map((hour) => ({ day, hour, score })))
}

export const INSTAGRAM_BEST_TIMES: TimeSlot[] = [
  // Tue-Thu 11am-1pm (best)
  ...generateSlots([2, 3, 4], [11, 12, 13], 3),
  // Tue-Thu 7pm-9pm (best)
  ...generateSlots([2, 3, 4], [19, 20, 21], 3),
  // Sat 10am-12pm (good)
  ...generateSlots([6], [10, 11, 12], 2),
  // Weekday afternoons 2-5pm (ok)
  ...generateSlots([1, 2, 3, 4, 5], [14, 15, 16, 17], 1),
]

export const TIKTOK_BEST_TIMES: TimeSlot[] = [
  // Tue-Thu 10am-12pm (best)
  ...generateSlots([2, 3, 4], [10, 11, 12], 3),
  // Tue-Thu 7pm-9pm (best)
  ...generateSlots([2, 3, 4], [19, 20, 21], 3),
  // Fri-Sat 8pm-10pm (good)
  ...generateSlots([5, 6], [20, 21, 22], 2),
]

// ---------------------------------------------------------------------------
// Content Strategy Types (ordered by engagement for tattoo artists)
// ---------------------------------------------------------------------------

export interface ContentStrategy {
  rank: number
  type: string
  label: string
  engagementMultiplier: number
  tip: string
}

export const CONTENT_STRATEGIES: ContentStrategy[] = [
  {
    rank: 1,
    type: 'process_reel',
    label: 'Reels de proceso',
    engagementMultiplier: 2.0,
    tip: 'Graba el proceso de tatuaje en timelapse. Los reels tienen 2x mas engagement que posts estaticos.',
  },
  {
    rank: 2,
    type: 'before_after',
    label: 'Antes/Despues',
    engagementMultiplier: 1.8,
    tip: 'Muestra la transformacion. Funciona especialmente bien con cover-ups.',
  },
  {
    rank: 3,
    type: 'healed_vs_fresh',
    label: 'Curado vs Fresco',
    engagementMultiplier: 1.6,
    tip: 'Demuestra la calidad de tu trabajo mostrando como se ve curado.',
  },
  {
    rank: 4,
    type: 'wip_sketch',
    label: 'Bocetos / Work in Progress',
    engagementMultiplier: 1.4,
    tip: 'Comparte tu proceso creativo. A la gente le encanta ver el origen del diseno.',
  },
  {
    rank: 5,
    type: 'testimonial',
    label: 'Testimonios de clientes',
    engagementMultiplier: 1.3,
    tip: 'Videos cortos de clientes satisfechos generan confianza.',
  },
  {
    rank: 6,
    type: 'behind_scenes',
    label: 'Detras de camaras',
    engagementMultiplier: 1.2,
    tip: 'Muestra tu estudio, tu setup, tu dia a dia.',
  },
  {
    rank: 7,
    type: 'flash_available',
    label: 'Flash / Disenos disponibles',
    engagementMultiplier: 1.1,
    tip: 'Publica disenos disponibles para impulsar reservas directas.',
  },
]

// ---------------------------------------------------------------------------
// Hashtag Sets by Tattoo Style
// ---------------------------------------------------------------------------

export interface PresetHashtagSet {
  name: string
  category: string
  hashtags: string[]
}

export const PRESET_HASHTAG_SETS: PresetHashtagSet[] = [
  {
    name: 'General Tattoo',
    category: 'general',
    hashtags: [
      '#tattoo', '#tattooartist', '#tattooideas', '#inked',
      '#tattoodesign', '#tattooinspiration', '#tattooart',
      '#tattoolife', '#tattooed', '#tattooink',
    ],
  },
  {
    name: 'Realismo',
    category: 'realismo',
    hashtags: [
      '#realistictattoo', '#portraittattoo', '#blackandgreytattoo',
      '#realismtattoo', '#realisticink', '#photorealistictattoo',
      '#realismo', '#tatuajerealista',
    ],
  },
  {
    name: 'Blackwork',
    category: 'blackwork',
    hashtags: [
      '#blackworktattoo', '#blackwork', '#darkart', '#blacktattoo',
      '#btattooing', '#blackworkers', '#blackworkerssubmission',
      '#blacktattooart',
    ],
  },
  {
    name: 'Japones',
    category: 'japones',
    hashtags: [
      '#japanesetattoo', '#irezumi', '#orientaltattoo',
      '#japanesestyle', '#japanesetattooart', '#irezumicollective',
      '#tattoojapones',
    ],
  },
  {
    name: 'Geometrico',
    category: 'geometrico',
    hashtags: [
      '#geometrictattoo', '#sacredgeometry', '#dotworktattoo',
      '#geometricart', '#geometrictattoodesign', '#tatuajegeometrico',
    ],
  },
  {
    name: 'Fine Line',
    category: 'fineline',
    hashtags: [
      '#finelinetattoo', '#minimalisttattoo', '#delicatetattoo',
      '#thinlinetattoo', '#finelinetattooartist', '#minimalismtattoo',
    ],
  },
  {
    name: 'Neo-Tradicional',
    category: 'neotradicional',
    hashtags: [
      '#neotraditionaltattoo', '#neotraditional', '#neotrad',
      '#neotradsub', '#neotradeu', '#tatuajeneotradicional',
    ],
  },
  {
    name: 'Acuarela',
    category: 'acuarela',
    hashtags: [
      '#watercolortattoo', '#aquarelletattoo', '#watercolourtattoo',
      '#tatuajeacuarela', '#watercolortattooartist',
    ],
  },
  {
    name: 'Tradicional / Old School',
    category: 'tradicional',
    hashtags: [
      '#traditionaltattoo', '#oldschooltattoo',
      '#americantraditionaltattoo', '#tradtattoo',
      '#boldwillhold', '#traditionaltattooing',
    ],
  },
  {
    name: 'Engagement Boost',
    category: 'engagement',
    hashtags: [
      '#tattooinspo', '#tattoolove', '#tattooflash',
      '#tattoosofinstagram', '#tattoooftheday', '#inkedmag',
      '#tattoomodel', '#tattooculture',
    ],
  },
]

// ---------------------------------------------------------------------------
// Benchmarks for Tattoo Industry
// ---------------------------------------------------------------------------

export const ENGAGEMENT_BENCHMARKS = {
  engagement_rate: { low: 1, average: 3, good: 6, great: 10 },
  save_rate: { low: 0.5, average: 1, good: 2, great: 5 },
  weekly_follower_growth: { low: 0.2, average: 1, good: 3, great: 5 },
} as const

export const PLATFORM_LIMITS: Record<
  SocialPlatform,
  { captionMaxLength: number; hashtagsMax: number }
> = {
  instagram: { captionMaxLength: 2200, hashtagsMax: 30 },
  tiktok: { captionMaxLength: 4000, hashtagsMax: 100 },
}

// ---------------------------------------------------------------------------
// Day names (Spanish)
// ---------------------------------------------------------------------------

export const DAY_NAMES_ES = [
  'Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab',
] as const

export const DAY_NAMES_FULL_ES = [
  'Domingo', 'Lunes', 'Martes', 'Miercoles',
  'Jueves', 'Viernes', 'Sabado',
] as const

// ---------------------------------------------------------------------------
// Platform display info
// ---------------------------------------------------------------------------

export const PLATFORM_INFO: Record<
  SocialPlatform,
  { label: string; color: string; bgColor: string }
> = {
  instagram: {
    label: 'Instagram',
    color: 'text-pink-600',
    bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
  },
  tiktok: {
    label: 'TikTok',
    color: 'text-cyan-600',
    bgColor: 'bg-gradient-to-r from-cyan-500 to-blue-500',
  },
}

// ---------------------------------------------------------------------------
// Post type labels
// ---------------------------------------------------------------------------

export const POST_TYPE_LABELS: Record<string, string> = {
  image: 'Imagen',
  carousel: 'Carrusel',
  reel: 'Reel',
  story: 'Historia',
  tiktok_video: 'Video TikTok',
}

export const POST_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  idea: { label: 'Idea', color: 'bg-gray-400' },
  draft: { label: 'Borrador', color: 'bg-yellow-400' },
  scheduled: { label: 'Programado', color: 'bg-blue-400' },
  posted: { label: 'Publicado', color: 'bg-green-400' },
  archived: { label: 'Archivado', color: 'bg-gray-300' },
}
