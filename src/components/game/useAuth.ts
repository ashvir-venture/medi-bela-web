'use client'

import { useEffect, useState } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'

export type AuthState =
  | { status: 'loading' }
  | { status: 'not_configured' }
  | { status: 'signed_out'; sb: SupabaseClient }
  | { status: 'signed_in'; sb: SupabaseClient; session: Session }

/** Session state from supabase-js (stored in localStorage). UX only: the RPCs are the real guard. */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    let alive = true
    let unsubscribe: (() => void) | undefined

    void getSupabase().then(async (sb) => {
      if (!alive) return
      if (!sb) {
        setState({ status: 'not_configured' })
        return
      }
      const { data } = await sb.auth.getSession()
      if (!alive) return
      setState(data.session ? { status: 'signed_in', sb, session: data.session } : { status: 'signed_out', sb })

      const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
        if (!alive) return
        setState(session ? { status: 'signed_in', sb, session } : { status: 'signed_out', sb })
      })
      unsubscribe = () => sub.subscription.unsubscribe()
    })

    return () => {
      alive = false
      unsubscribe?.()
    }
  }, [])

  return state
}

/**
 * Mobile + password sign-up (Supabase Auth phone provider). Phone confirmations are OFF
 * until the SMS gateway is connected, so this returns a session straight away.
 * The name goes into user metadata; the sign-up trigger copies it into profiles.full_name.
 */
export async function signUpWithPhone(sb: SupabaseClient, phone: string, password: string, fullName: string) {
  const { data, error } = await sb.auth.signUp({ phone, password, options: { data: { full_name: fullName } } })
  if (error) throw error
  if (data.session) return
  // No session back: try signing straight in with the same details, so registering works
  // without any code. If "Confirm phone" is ON in Supabase this fails with verification_needed.
  const { error: signInError } = await sb.auth.signInWithPassword({ phone, password })
  if (signInError) throw signInError
}

export async function signInWithPhone(sb: SupabaseClient, phone: string, password: string) {
  const { error } = await sb.auth.signInWithPassword({ phone, password })
  if (error) throw error
}
