import { expect, test } from '@playwright/test'
import { stubSupabase } from './stub'

test.describe('public site (no login anywhere)', () => {
  for (const lang of ['bn', 'en'] as const) {
    test(`landing ${lang} renders every section without asking to sign in`, async ({ page }) => {
      await stubSupabase(page)
      await page.goto(`/${lang}/`)
      await expect(page.locator('html')).toHaveAttribute('lang', lang)
      await expect(page.locator('h1')).toBeVisible()
      for (const id of ['about', 'features', 'how', 'screens', 'play', 'faq', 'contact']) {
        await expect(page.locator(`#${id}`)).toBeAttached()
      }
      // No password field or sign-in form on the public page.
      await expect(page.locator('input[type="password"]')).toHaveCount(0)
      // Public leaderboard (anon RPC) shows nicknames.
      await page.locator('#play').scrollIntoViewIfNeeded()
      await expect(page.locator('.board-row').first()).toContainText('Rahim')
      // hreflang alternates
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1)
      await expect(page.locator('link[rel="alternate"][hreflang="bn"]')).toHaveCount(1)
    })

    for (const path of ['rules', 'privacy', 'terms']) {
      test(`${lang}/${path} is public`, async ({ page }) => {
        await page.goto(`/${lang}/${path}/`)
        await expect(page.locator('h1')).toBeVisible()
        await expect(page.locator('.prose h2').first()).toBeVisible()
      })
    }
  }

  test("about page uses the app's own About us text, team and contacts", async ({ page }) => {
    await page.goto('/en/about/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Care for your family, even from far away.')
    await expect(page.getByText('Health, On Time')).toBeVisible()
    await expect(page.getByText('Ashraful Alam')).toBeVisible()
    await expect(page.getByText('Tanvir Hossain')).toBeVisible()
    await expect(page.locator('a[href="tel:+8801810314801"]')).toBeVisible()
  })

  test("privacy and terms start with the app's own text", async ({ page }) => {
    await page.goto('/en/privacy/')
    await expect(page.getByText('Your data is stored under strong monitoring and a strict access policy.')).toBeVisible()
    await expect(page.getByText('On this website (quiz and waitlist)')).toBeVisible()
    await page.goto('/bn/terms/')
    await expect(page.getByText('মেডি-বেলা আপনার নিয়মিত ডাক্তার বা স্বাস্থ্যসেবার বিকল্প নয়।')).toBeVisible()
  })

  test('app screenshots replace the placeholders', async ({ page }) => {
    await page.goto('/en/')
    await expect(page.locator('.placeholder-slot')).toHaveCount(0)
    await expect(page.locator('.shots img')).toHaveCount(5)
  })

  test('no horizontal scroll at 320px', async ({ page }) => {
    await stubSupabase(page)
    await page.setViewportSize({ width: 320, height: 700 })
    for (const path of ['/bn/', '/en/', '/bn/rules/', '/en/play/', '/bn/about/', '/en/privacy/']) {
      await page.goto(path)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, path).toBeLessThanOrEqual(0)
    }
  })

  test('language toggle keeps the page and remembers the choice', async ({ page }) => {
    await page.goto('/bn/rules/')
    await page.getByRole('link', { name: 'EN' }).click()
    await expect(page).toHaveURL(/\/en\/rules\/$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    expect(await page.evaluate(() => localStorage.getItem('mb-lang'))).toBe('en')
    await page.goto('/')
    await expect(page).toHaveURL(/\/en\/$/)
  })

  test('root defaults to Bangla for a Bangla browser', async ({ browser }) => {
    const ctx = await browser.newContext({ locale: 'bn-BD' })
    const page = await ctx.newPage()
    await page.goto('http://localhost:4173/')
    await expect(page).toHaveURL(/\/bn\/$/)
    await ctx.close()
  })

  test('unknown page shows the bilingual 404', async ({ page }) => {
    const res = await page.goto('/en/does-not-exist/')
    expect(res?.status()).toBe(404)
    await expect(page.getByText('404')).toBeVisible()
  })

  test('contact form validates, blocks the honeypot and sends', async ({ page }) => {
    await stubSupabase(page)
    await page.goto('/en/#contact')
    const form = page.locator('#contact form')
    await form.getByRole('button', { name: 'Send message' }).click()
    await expect(form.getByText('Please enter your name.')).toBeVisible()
    await form.getByLabel('Your name').fill('Test Person')
    await form.getByLabel('Email').fill('test@example.com')
    await form.getByLabel('Message').fill('Hello, this is a test message.')
    let sent = 0
    page.on('request', (r) => r.url().startsWith('https://api.web3forms.com') && sent++)
    await form.getByRole('button', { name: 'Send message' }).click()
    await expect(form.getByText('Thank you. Your message has been sent')).toBeVisible()
    expect(sent).toBe(1)
  })
})
