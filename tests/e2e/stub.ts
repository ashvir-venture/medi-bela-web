import type { Page, Route } from '@playwright/test'

/**
 * A fake Supabase (Auth + RPC) living inside the test. Every request to
 * https://stub.supabase.co is answered here, so the UI is exercised end to end
 * without a real project. The real rules are tested in supabase/tests/game_test.sql.
 */
export type StubState = {
  signedUp: { phone: string; password: string; full_name: string } | null
  onboarded: boolean
  waitlisted: boolean
  displayName: string | null
  attemptId: string | null
  position: number
  total: number
  completed: boolean
  calls: string[]
  takenNames: string[]
}

const USER_ID = '11111111-1111-4111-8111-111111111111'

function fakeJwt() {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: USER_ID, role: 'authenticated', aud: 'authenticated', exp: now + 3600, iat: now })}.sig`
}

function session(phone: string, fullName: string) {
  const now = Math.floor(Date.now() / 1000)
  return {
    access_token: fakeJwt(),
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: now + 3600,
    refresh_token: 'stub-refresh',
    user: {
      id: USER_ID,
      aud: 'authenticated',
      role: 'authenticated',
      phone: phone.replace('+', ''),
      app_metadata: { provider: 'phone', providers: ['phone'] },
      user_metadata: { full_name: fullName },
      identities: [],
      created_at: new Date().toISOString(),
    },
  }
}

const QUESTIONS = [1, 2, 3, 4, 5].map((n) => ({
  id: `q${n}`,
  text_en: `Stub question ${n}?`,
  text_bn: `নমুনা প্রশ্ন ${n}?`,
  options: ['a', 'b', 'c', 'd'].map((k) => ({ key: k, en: `Option ${k.toUpperCase()}${k === 'a' ? ' (right)' : ''}`, bn: `বিকল্প ${k}` })),
}))

export async function stubSupabase(page: Page, init: Partial<StubState> = {}) {
  const s: StubState = {
    signedUp: null,
    onboarded: false,
    waitlisted: false,
    displayName: null,
    attemptId: null,
    position: 1,
    total: 0,
    completed: false,
    calls: [],
    takenNames: ['Taken'],
    ...init,
  }

  const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body), headers: { 'access-control-allow-origin': '*' } })
  const pgError = (route: Route, message: string) => json(route, { code: 'P0001', message, details: null, hint: null }, 400)

  await page.route('https://stub.supabase.co/**', async (route) => {
    const req = route.request()
    if (req.method() === 'OPTIONS') {
      return route.fulfill({
        status: 200,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
          'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
        },
      })
    }
    const url = new URL(req.url())
    const body = req.postData() ? JSON.parse(req.postData() || '{}') : {}
    s.calls.push(url.pathname.replace('/rest/v1/rpc/', 'rpc:').replace('/auth/v1/', 'auth:'))

    // ---- Auth ----
    if (url.pathname === '/auth/v1/signup') {
      if (s.signedUp && s.signedUp.phone === body.phone) {
        return json(route, { code: 'user_already_exists', error_code: 'user_already_exists', msg: 'User already registered' }, 422)
      }
      s.signedUp = { phone: body.phone, password: body.password, full_name: body.data?.full_name }
      return json(route, session(body.phone, body.data?.full_name))
    }
    if (url.pathname === '/auth/v1/token') {
      if (!s.signedUp || s.signedUp.phone !== body.phone || s.signedUp.password !== body.password) {
        return json(route, { code: 'invalid_credentials', error_code: 'invalid_credentials', msg: 'Invalid login credentials' }, 400)
      }
      return json(route, session(body.phone, s.signedUp.full_name))
    }
    if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } })
    if (url.pathname === '/auth/v1/user') return json(route, session(s.signedUp?.phone || '+8801711111111', 'x').user)

    // ---- RPC ----
    const fn = url.pathname.replace('/rest/v1/rpc/', '')
    switch (fn) {
      case 'get_leaderboard':
        return json(route, [
          { rank: 1, display_name: 'Rahim', best_score: 4500, completed_at: new Date().toISOString() },
          { rank: 2, display_name: s.displayName || 'Karim', best_score: s.completed ? s.total : 3900, completed_at: new Date().toISOString() },
        ])
      case 'get_my_status':
        return json(route, {
          onboarded: s.onboarded,
          waitlisted: s.waitlisted,
          display_name: s.displayName,
          full_name: s.signedUp?.full_name ?? null,
          language: 'en',
          phone: s.signedUp?.phone.replace('+', '') ?? null,
          played_today: !!s.attemptId,
          attempt_id: s.attemptId,
          attempt_status: s.attemptId ? (s.completed ? 'completed' : 'in_progress') : null,
          today_score: s.completed ? s.total : null,
          best_score: s.completed ? s.total : null,
          my_rank: s.completed ? 2 : null,
          next_reset_at: new Date(Date.now() + 5 * 3600_000).toISOString(),
          contest_open: true,
        })
      case 'complete_profile':
        if (s.takenNames.includes(body.p_display_name)) return pgError(route, 'name_taken')
        if (!body.p_consent_waitlist) return pgError(route, 'consent_required')
        s.onboarded = true
        s.waitlisted = true
        s.displayName = body.p_display_name
        return json(route, null)
      case 'join_waitlist':
        s.waitlisted = true
        return json(route, { joined: true, already: false })
      case 'start_attempt':
        s.attemptId = s.attemptId || 'attempt-1'
        return json(route, s.attemptId)
      case 'get_current_question':
        if (s.completed) return json(route, { status: 'completed', total_score: s.total, total_time_ms: 15_000 })
        return json(route, {
          status: 'in_progress',
          position: s.position,
          total: 5,
          question: QUESTIONS[s.position - 1],
          remaining_ms: 20_000,
          seconds_limit: 20,
        })
      case 'submit_answer': {
        const correct = body.p_key === 'a'
        const points = correct ? 900 : 0
        s.total += points
        const finished = s.position >= 5
        if (finished) s.completed = true
        else s.position += 1
        return json(route, {
          is_correct: correct,
          correct_key: 'a',
          points,
          elapsed_ms: 3000,
          too_fast: false,
          late: body.p_key === null,
          explanation_en: 'Because A is right.',
          explanation_bn: 'কারণ A ঠিক।',
          finished,
          total_score: s.total,
        })
      }
      case 'get_polls':
        return json(route, [
          { id: 'p1', text_en: 'Which style?', text_bn: 'কোনটি?', options: [{ key: 'a', en: 'Full-screen', bn: 'পুরো' }, { key: 'b', en: 'Banner', bn: 'ব্যানার' }] },
        ])
      case 'submit_poll':
        return json(route, null)
    }
    return json(route, { message: `unstubbed ${url.pathname}` }, 404)
  })

  // Web3Forms (contact form)
  await page.route('https://api.web3forms.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }), headers: { 'access-control-allow-origin': '*' } }),
  )

  return s
}
