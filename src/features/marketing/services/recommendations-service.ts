import type { SocialPlatform } from '../types/marketing'
import {
  INSTAGRAM_BEST_TIMES,
  TIKTOK_BEST_TIMES,
  CONTENT_STRATEGIES,
  ENGAGEMENT_BENCHMARKS,
  PRESET_HASHTAG_SETS,
  DAY_NAMES_ES,
  type TimeSlot,
} from '../constants/tattoo-marketing'

// ---------------------------------------------------------------------------
// Heatmap
// ---------------------------------------------------------------------------

/**
 * Returns a 7x24 matrix (7 days x 24 hours) with scores 0-3.
 * Index: matrix[day][hour], day 0=Sunday, hour 0-23.
 */
export function getHeatmapData(platform: SocialPlatform): number[][] {
  const slots: TimeSlot[] =
    platform === 'instagram' ? INSTAGRAM_BEST_TIMES : TIKTOK_BEST_TIMES

  // Initialize with 0
  const matrix: number[][] = Array.from({ length: 7 }, () =>
    new Array<number>(24).fill(0)
  )

  for (const slot of slots) {
    matrix[slot.day][slot.hour] = slot.score
  }

  return matrix
}

// ---------------------------------------------------------------------------
// Best posting times
// ---------------------------------------------------------------------------

/**
 * Returns the top N time slots sorted by score descending.
 */
export function getBestPostingTimes(
  platform: SocialPlatform,
  count = 5
): { day: string; time: string; score: number }[] {
  const slots: TimeSlot[] =
    platform === 'instagram' ? INSTAGRAM_BEST_TIMES : TIKTOK_BEST_TIMES

  // Deduplicate by day+hour keeping highest score
  const slotMap = new Map<string, TimeSlot>()
  for (const slot of slots) {
    const key = `${slot.day}-${slot.hour}`
    const existing = slotMap.get(key)
    if (!existing || slot.score > existing.score) {
      slotMap.set(key, slot)
    }
  }

  const sorted = Array.from(slotMap.values()).sort((a, b) => b.score - a.score)
  const top = sorted.slice(0, count)

  return top.map((slot) => ({
    day: DAY_NAMES_ES[slot.day] as string,
    time: `${String(slot.hour).padStart(2, '0')}:00`,
    score: slot.score,
  }))
}

// ---------------------------------------------------------------------------
// Hashtag suggestions
// ---------------------------------------------------------------------------

/**
 * Suggests up to 30 hashtags based on the given tattoo style.
 * Combines style-specific hashtags with general tattoo hashtags.
 */
export function suggestHashtags(style: string | null): string[] {
  const generalSet = PRESET_HASHTAG_SETS.find((s) => s.category === 'general')
  const generalHashtags = generalSet?.hashtags ?? []

  if (!style) return generalHashtags.slice(0, 30)

  const normalized = style.toLowerCase()

  const styleSet = PRESET_HASHTAG_SETS.find(
    (s) =>
      s.category === normalized ||
      s.name.toLowerCase().includes(normalized) ||
      normalized.includes(s.category)
  )

  if (!styleSet) return generalHashtags.slice(0, 30)

  // Merge style hashtags + general hashtags, deduplicated
  const combined = Array.from(new Set([...styleSet.hashtags, ...generalHashtags]))
  return combined.slice(0, 30)
}

// ---------------------------------------------------------------------------
// Engagement rate evaluation
// ---------------------------------------------------------------------------

type EngagementLevel = 'low' | 'average' | 'good' | 'great'

interface EngagementEvaluation {
  level: EngagementLevel
  label: string
  color: string
}

/**
 * Evaluates an engagement rate percentage against industry benchmarks.
 */
export function evaluateEngagementRate(rate: number): EngagementEvaluation {
  const { low, good, great } = ENGAGEMENT_BENCHMARKS.engagement_rate

  if (rate >= great) {
    return { level: 'great', label: 'Excelente', color: 'text-emerald-500' }
  }
  if (rate >= good) {
    return { level: 'good', label: 'Bueno', color: 'text-green-500' }
  }
  if (rate >= low) {
    return { level: 'average', label: 'Promedio', color: 'text-yellow-500' }
  }
  return { level: 'low', label: 'Bajo', color: 'text-red-500' }
}

// ---------------------------------------------------------------------------
// Next content suggestion
// ---------------------------------------------------------------------------

/**
 * Suggests the highest-ranked content type not in the recent post types list.
 * Falls back to rank-1 strategy if all types have been posted recently.
 */
export function getNextContentSuggestion(
  recentTypes: string[]
): (typeof CONTENT_STRATEGIES)[number] {
  const recentSet = new Set(recentTypes)

  const suggestion = CONTENT_STRATEGIES.find(
    (strategy) => !recentSet.has(strategy.type)
  )

  // Fallback: the #1 strategy (process_reel)
  return suggestion ?? CONTENT_STRATEGIES[0]!
}

// ---------------------------------------------------------------------------
// Engagement rate calculator
// ---------------------------------------------------------------------------

/**
 * Calculates engagement rate as a percentage.
 * Formula: ((likes + comments + saves + shares) / followers) * 100
 */
export function calculateEngagementRate(
  likes: number,
  comments: number,
  saves: number,
  shares: number,
  followers: number
): number {
  if (followers === 0) return 0
  return ((likes + comments + saves + shares) / followers) * 100
}
