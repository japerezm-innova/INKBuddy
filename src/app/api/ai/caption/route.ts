import { generateText } from 'ai'
import { openrouter, VISION_FALLBACKS } from '@/lib/ai/openrouter'
import { z } from 'zod'
import {
  INSTAGRAM_BEST_TIMES,
  TIKTOK_BEST_TIMES,
  DAY_NAMES_FULL_ES,
  type TimeSlot,
} from '@/features/marketing/constants/tattoo-marketing'

const requestSchema = z.object({
  imageUrl: z.string().url(),
  tone: z.enum(['profesional', 'casual', 'artistico']),
  platform: z.enum(['instagram', 'tiktok']).default('instagram'),
  editInstruction: z.string().optional(),
  currentCaption: z.string().optional(),
  currentHashtags: z.string().optional(),
})

const TONE_INSTRUCTIONS: Record<string, string> = {
  profesional:
    'Usa un tono profesional y elegante. Destaca la calidad del trabajo, la tecnica y la experiencia del artista.',
  casual:
    'Usa un tono cercano y relajado. Habla como si le contaras a un amigo sobre el tatuaje. Usa lenguaje coloquial chileno sutil.',
  artistico:
    'Usa un tono poetico y artistico. Enfocate en la emocion, el significado y la estetica del diseno.',
}

function getBestPostingTime(platform: 'instagram' | 'tiktok'): string {
  const slots = platform === 'instagram' ? INSTAGRAM_BEST_TIMES : TIKTOK_BEST_TIMES
  const bestSlots = slots.filter((s: TimeSlot) => s.score === 3)

  if (bestSlots.length === 0) return 'Martes a Jueves, 11:00 - 13:00'

  const grouped: Record<number, number[]> = {}
  for (const slot of bestSlots) {
    if (!grouped[slot.day]) grouped[slot.day] = []
    grouped[slot.day].push(slot.hour)
  }

  const recommendations: string[] = []
  for (const [day, hours] of Object.entries(grouped)) {
    const dayName = DAY_NAMES_FULL_ES[Number(day)]
    const sortedHours = hours.sort((a, b) => a - b)
    const from = `${sortedHours[0]}:00`
    const to = `${sortedHours[sortedHours.length - 1] + 1}:00`
    recommendations.push(`${dayName} ${from}-${to}`)
  }

  return recommendations.slice(0, 3).join(' | ')
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' },
        { status: 400 }
      )
    }

    const { imageUrl, tone, platform, editInstruction, currentCaption, currentHashtags } = parsed.data

    const isEdit = editInstruction && currentCaption

    const generatePrompt = `Eres un experto en marketing de redes sociales para estudios de tatuaje en Chile.

Analiza esta imagen de un tatuaje y genera un caption para ${platform === 'instagram' ? 'Instagram' : 'TikTok'}.

TONO: ${TONE_INSTRUCTIONS[tone]}

INSTRUCCIONES:
1. Describe brevemente el tatuaje (estilo, ubicacion en el cuerpo si se ve, colores/tecnica)
2. Genera un caption de 2-3 oraciones que enganche a la audiencia
3. Incluye un call-to-action sutil (ej: "Agenda tu sesion", "Escribe para consultar")
4. Genera exactamente 20 hashtags relevantes mezclando:
   - 5 hashtags generales de tatuaje (#tattoo, #inked, etc.)
   - 5 hashtags del estilo especifico del tatuaje
   - 5 hashtags de ubicacion Chile (#tattoochile, #tattooartistchile, etc.)
   - 5 hashtags de engagement (#tattoooftheday, #inkspiration, etc.)

FORMATO DE RESPUESTA (respeta exactamente este formato):
CAPTION:
[El caption aqui]

HASHTAGS:
[Los 20 hashtags separados por espacios]

ESTILO:
[El estilo detectado del tatuaje en una palabra: realismo, blackwork, fineline, neotradicional, japones, geometrico, acuarela, tradicional, lettering, otro]`

    const editPrompt = `Eres un experto en marketing de redes sociales para estudios de tatuaje en Chile.

Tienes un caption existente que necesita ser editado segun las instrucciones del usuario.

CAPTION ACTUAL:
${currentCaption}

HASHTAGS ACTUALES:
${currentHashtags ?? ''}

INSTRUCCION DEL USUARIO: ${editInstruction}

TONO: ${TONE_INSTRUCTIONS[tone]}

Aplica los cambios solicitados manteniendo el formato profesional para ${platform === 'instagram' ? 'Instagram' : 'TikTok'}.
Si el usuario pide cambios solo al caption, mantiene los hashtags iguales. Si pide cambios a los hashtags, actualiza solo los hashtags.

FORMATO DE RESPUESTA (respeta exactamente este formato):
CAPTION:
[El caption editado]

HASHTAGS:
[Los 20 hashtags separados por espacios]

ESTILO:
[El estilo del tatuaje en una palabra]`

    const prompt = isEdit ? editPrompt : generatePrompt

    const messages = isEdit
      ? [{ role: 'user' as const, content: prompt }]
      : [
          {
            role: 'user' as const,
            content: [
              { type: 'text' as const, text: prompt },
              { type: 'image' as const, image: new URL(imageUrl) },
            ],
          },
        ]

    // Try each vision model until one works
    let text = ''
    let lastError: unknown = null
    for (const modelId of VISION_FALLBACKS) {
      try {
        const result = await generateText({
          model: openrouter(modelId),
          messages,
          maxOutputTokens: 800,
        })
        text = result.text
        break
      } catch (err) {
        lastError = err
        continue
      }
    }

    if (!text) {
      throw lastError ?? new Error('Todos los modelos fallaron')
    }

    const captionMatch = text.match(/CAPTION:\s*\n([\s\S]*?)(?=\nHASHTAGS:)/i)
    const hashtagsMatch = text.match(/HASHTAGS:\s*\n([\s\S]*?)(?=\nESTILO:)/i)
    const styleMatch = text.match(/ESTILO:\s*\n?(.*)/i)

    const caption = captionMatch?.[1]?.trim() ?? text
    const hashtags = hashtagsMatch?.[1]?.trim() ?? ''
    const style = styleMatch?.[1]?.trim().toLowerCase() ?? 'otro'
    const bestTime = getBestPostingTime(platform)

    return Response.json({
      caption,
      hashtags,
      style,
      bestTime,
      full: `${caption}\n\n${hashtags}`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Caption generation error:', message, error)
    return Response.json(
      { error: `Error: ${message}` },
      { status: 500 }
    )
  }
}
