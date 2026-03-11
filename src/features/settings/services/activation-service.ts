'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const activateCodeSchema = z.object({
  code: z.string().min(1).max(100),
})

export async function activateCode(code: string): Promise<{ error?: string }> {
  const parsed = activateCodeSchema.safeParse({ code })
  if (!parsed.success) return { error: 'Código inválido' }

  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'No autenticado' }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('studio_id')
    .eq('id', user.id)
    .single()
  if (profileError || !profile) return { error: 'Perfil no encontrado' }

  const { data: activationCode, error: codeError } = await supabase
    .from('activation_codes')
    .select('*')
    .eq('code', parsed.data.code)
    .is('used_by', null)
    .single()
  if (codeError || !activationCode) return { error: 'Código no válido o ya utilizado' }

  if (activationCode.expires_at && new Date(activationCode.expires_at) < new Date()) {
    return { error: 'El código ha expirado' }
  }

  if (activationCode.allowed_email && activationCode.allowed_email !== user.email) {
    return { error: 'Este código no está disponible para tu cuenta' }
  }

  const { error: updateCodeError } = await supabase
    .from('activation_codes')
    .update({ used_by: user.id, used_at: new Date().toISOString() })
    .eq('id', activationCode.id)
  if (updateCodeError) return { error: 'Error al activar el código' }

  const { error: updateStudioError } = await supabase
    .from('studios')
    .update({ plan: activationCode.plan })
    .eq('id', profile.studio_id)
  if (updateStudioError) return { error: 'Error al actualizar el plan' }

  return {}
}
