import { expect, test } from '@playwright/test'
import { stubSupabase } from './stub'

test.describe('game (Supabase stubbed)', () => {
  test('sign up with mobile + password, choose nickname, play 5 questions, see result', async ({ page }) => {
    const s = await stubSupabase(page)
    await page.goto('/en/play/')

    // Gate: create account (validation first)
    await expect(page.getByRole('heading', { name: 'Sign in to play' })).toBeVisible()
    await page.getByRole('button', { name: 'Create account' }).last().click()
    await expect(page.getByText('Please enter your name')).toBeVisible()
    await page.getByLabel('Your name').fill('Test Person')
    await page.getByLabel('Mobile number').fill('017-1234 5678')
    await page.getByLabel('Password', { exact: true }).fill('secret123')
    await page.getByRole('button', { name: 'Create account' }).last().click()
    expect(s.signedUp?.phone).toBe('+8801712345678') // normalized to E.164
    expect(s.signedUp?.full_name).toBe('Test Person')

    // Onboarding: taken name, then a free one
    await expect(page.getByRole('heading', { name: 'Choose your public nickname' })).toBeVisible()
    await page.getByLabel('Nickname').fill('Taken')
    await page.getByRole('checkbox').first().check()
    await page.getByRole('button', { name: 'Save and continue' }).click()
    await expect(page.getByText('That nickname is already taken')).toBeVisible()
    await page.getByLabel('Nickname').fill('Tester_01')
    await page.getByRole('button', { name: 'Save and continue' }).click()

    // Lobby → start
    await expect(page.getByRole('heading', { name: "Today's quiz is ready" })).toBeVisible()
    await page.getByRole('button', { name: /^Start/ }).click()

    // 5 questions: 4 right, 1 wrong
    for (let i = 1; i <= 5; i++) {
      await expect(page.getByText(`Question ${i} of 5`)).toBeVisible()
      const right = i !== 3
      await page.getByRole('button', { name: right ? /Option A/ : /Option B/ }).click()
      await expect(page.getByText(right ? 'Correct!' : 'Not quite')).toBeVisible()
      if (!right) await expect(page.getByText('Correct answer:')).toBeVisible()
      await page.getByRole('button', { name: i === 5 ? /See my result/ : /Next question/ }).click()
    }

    // Result (points, never a percentage) + poll + leaderboard with the player highlighted
    await expect(page.getByText("Today's score")).toBeVisible()
    await expect(page.locator('.result-score')).toContainText('3,600')
    await expect(page.locator('body')).not.toContainText('%')
    await page.getByRole('button', { name: 'Full-screen' }).click()
    await expect(page.getByText('Thank you for your feedback!')).toBeVisible()
    await expect(page.locator('.board-row.is-me')).toContainText('Tester_01')
    expect(s.calls.filter((c) => c === 'rpc:submit_answer')).toHaveLength(5)
  })

  test('sign in with a wrong password shows a clear error', async ({ page }) => {
    await stubSupabase(page, { signedUp: { phone: '+8801712345678', password: 'right-pass', full_name: 'X' } })
    await page.goto('/en/play/')
    await page.getByRole('tab', { name: 'Sign in' }).click()
    await page.getByLabel('Mobile number').fill('01712345678')
    await page.getByLabel('Password', { exact: true }).fill('wrong-pass')
    await page.getByRole('button', { name: 'Sign in' }).last().click()
    await expect(page.getByText('The mobile number or password is wrong.')).toBeVisible()
  })

  test('invalid phone number is rejected before calling the server', async ({ page }) => {
    const s = await stubSupabase(page)
    await page.goto('/bn/play/')
    await page.getByLabel('আপনার নাম').fill('রহিম')
    await page.getByLabel('মোবাইল নম্বর').fill('12345')
    await page.getByLabel('পাসওয়ার্ড', { exact: true }).fill('secret123')
    await page.getByRole('button', { name: 'অ্যাকাউন্ট খুলুন' }).last().click()
    await expect(page.getByText('বাংলাদেশি মোবাইল নম্বর লিখুন')).toBeVisible()
    expect(s.calls).not.toContain('auth:signup')
  })

  test('waitlist: sign up, consent, done (no game needed)', async ({ page }) => {
    const s = await stubSupabase(page)
    await page.goto('/en/waitlist/')
    await page.getByLabel('Your name').fill('Wait Lister')
    await page.getByLabel('Mobile number').fill('01812345678')
    await page.getByLabel('Password', { exact: true }).fill('secret123')
    await page.getByRole('button', { name: 'Create account' }).last().click()
    await page.getByRole('button', { name: 'Join the waitlist' }).click()
    await expect(page.getByText('Please tick the box')).toBeVisible()
    await page.getByRole('checkbox').first().check()
    await page.getByRole('button', { name: 'Join the waitlist' }).click()
    await expect(page.getByRole('heading', { name: "You're on the list!" })).toBeVisible()
    await expect(page.getByText('01812-345678')).toBeVisible()
    expect(s.waitlisted).toBe(true)
  })
})
