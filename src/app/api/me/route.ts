import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'profile_not_found' }, { status: 401 })
    }

    // Fetch studio data for settings (settings, calendar_token)
    const { data: studio } = await supabase
      .from('studios')
      .select('settings, calendar_token')
      .eq('id', profile.studio_id)
      .single()

    return NextResponse.json({
      profile: {
        ...profile,
        studio: studio ?? null,
      },
    })
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
