import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, status')
      .eq('id', user.id)
      .maybeSingle()

    if (!existingProfile) {
      // Profile doesn't exist, create it with approved status
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          role: 'user',
          status: 'approved',
        })
        .select()
        .single()

      if (createError || !newProfile) {
        console.error('Failed to create profile:', createError)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Profile created and auto-approved',
      })
    }

    // Profile exists, update to approved if pending
    if (existingProfile.status !== 'approved') {
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', user.id)
        .select()
        .single()

      if (updateError || !updatedProfile) {
        console.error('Failed to approve user:', updateError)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'User auto-approved',
      })
    }

    return NextResponse.json({
      success: true,
      message: 'User already approved',
    })
  } catch (error) {
    console.error('Auto-approval error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
