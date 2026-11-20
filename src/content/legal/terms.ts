import type { Lang } from '@/i18n'
import type { LegalDoc, LegalSection } from '@/components/layout/LegalPage'
import { appPublic } from '@/content/app-public'

// First part: the Medi-Bela APP's "Terms of use and medical note", word for word (app-public.ts).
function appPart(lang: Lang, groupTitle: string): LegalSection[] {
  const s = appPublic[lang].privacySections[1]
  return [{ h: groupTitle, group: true }, { h: s.heading, ul: [...s.lines] }]
}

// DRAFT: needs legal review for Bangladesh.
// REVIEW: every Bangla string below needs a native-speaker check.

const UPDATED = '2026-11-18'

export const terms: Record<Lang, LegalDoc> = {
  en: {
    title: 'Terms of use',
    intro: 'The rules for using this website, the quiz and the waitlist.',
    updated: `Last updated: ${UPDATED}`,
    sections: [
      ...appPart('en', 'In the Medi-Bela app'),
      { h: 'On this website (quiz and waitlist)', group: true },
      {
        h: '1. About this website',
        p: [
          'This website introduces the Medi-Bela app, runs a waitlist and a daily quiz contest until the app launches. By using it you agree to these terms, the contest rules and the privacy policy.',
        ],
      },
      {
        h: '2. Not medical advice',
        p: [
          'Nothing on this website, including quiz questions and explanations, is medical advice. Always follow your doctor’s advice about your health and medicines. In an emergency in Bangladesh, call 999.',
        ],
      },
      {
        h: '3. Your account',
        ul: [
          'You create an account with your own mobile number and a password. Keep your password safe; you are responsible for what happens under your account.',
          'Use one account only. Your nickname must not be offensive, misleading or impersonate anyone, including Medi-Bela staff.',
          'You cannot change your nickname after choosing it.',
        ],
      },
      {
        h: '4. Acceptable use',
        ul: [
          'No bots, scripts or automated play.',
          'No attempts to break, overload or get around the website’s security or the contest limits.',
          'No copying the quiz questions in bulk or publishing answer lists.',
        ],
        p: ['We may suspend access or disqualify players who break these terms.'],
      },
      {
        h: '5. Content and trademarks',
        p: [
          'The Medi-Bela name, logo, website text and quiz content belong to the Medi-Bela team. You may share links to this website freely.',
        ],
      },
      {
        h: '6. Availability and liability',
        p: [
          'We try to keep the website running, but it may sometimes be unavailable. The website is provided “as is”. To the extent the law allows, we are not responsible for losses caused by using or not being able to use it.',
        ],
      },
      {
        h: '7. Law',
        p: ['These terms are governed by the laws of Bangladesh.'],
      },
      {
        h: '8. Changes and contact',
        p: [`We may update these terms and will post changes on this page. Questions: use the contact form on the home page.`],
      },
    ],
  },
  bn: {
    title: 'ব্যবহারের শর্তাবলি',
    intro: 'এই ওয়েবসাইট, কুইজ আর ওয়েটলিস্ট ব্যবহারের নিয়ম।',
    updated: `সর্বশেষ হালনাগাদ: ${UPDATED}`,
    sections: [
      ...appPart('bn', 'Medi-Bela অ্যাপে'),
      { h: 'এই ওয়েবসাইটে (কুইজ ও ওয়েটলিস্ট)', group: true },
      {
        h: '১. এই ওয়েবসাইট সম্পর্কে',
        p: [
          'এই ওয়েবসাইট Medi-Bela অ্যাপের পরিচয় দেয়, একটি ওয়েটলিস্ট রাখে আর অ্যাপ লঞ্চ পর্যন্ত প্রতিদিনের কুইজ প্রতিযোগিতা চালায়। ব্যবহার করলে আপনি এই শর্তাবলি, প্রতিযোগিতার নিয়ম ও গোপনীয়তা নীতি মেনে নিচ্ছেন।',
        ],
      },
      {
        h: '২. এটি চিকিৎসা-পরামর্শ নয়',
        p: [
          'কুইজের প্রশ্ন ও ব্যাখ্যাসহ এই ওয়েবসাইটের কোনো কিছুই চিকিৎসা-পরামর্শ নয়। আপনার স্বাস্থ্য ও ওষুধের ব্যাপারে সবসময় ডাক্তারের পরামর্শ মেনে চলুন। বাংলাদেশে জরুরি প্রয়োজনে ৯৯৯-এ কল করুন।',
        ],
      },
      {
        h: '৩. আপনার অ্যাকাউন্ট',
        ul: [
          'আপনি নিজের মোবাইল নম্বর ও একটি পাসওয়ার্ড দিয়ে অ্যাকাউন্ট খুলবেন। পাসওয়ার্ড নিরাপদে রাখুন; আপনার অ্যাকাউন্টে যা ঘটে তার দায় আপনার।',
          'শুধু একটি অ্যাকাউন্ট ব্যবহার করুন। ডাকনাম আপত্তিকর, বিভ্রান্তিকর বা কারও (Medi-Bela কর্মীসহ) পরিচয় নকল করা হতে পারবে না।',
          'একবার বেছে নেওয়ার পর ডাকনাম আর বদলানো যাবে না।',
        ],
      },
      {
        h: '৪. গ্রহণযোগ্য ব্যবহার',
        ul: [
          'বট, স্ক্রিপ্ট বা স্বয়ংক্রিয়ভাবে খেলা যাবে না।',
          'ওয়েবসাইট ভাঙা, অতিরিক্ত চাপ দেওয়া, বা নিরাপত্তা ও প্রতিযোগিতার সীমা এড়ানোর চেষ্টা করা যাবে না।',
          'কুইজের প্রশ্ন একসাথে কপি করা বা উত্তরের তালিকা প্রকাশ করা যাবে না।',
        ],
        p: ['এই শর্ত ভাঙলে আমরা প্রবেশাধিকার স্থগিত বা খেলোয়াড়কে বাতিল করতে পারি।'],
      },
      {
        h: '৫. কনটেন্ট ও ট্রেডমার্ক',
        p: ['Medi-Bela নাম, লোগো, ওয়েবসাইটের লেখা আর কুইজের কনটেন্ট Medi-Bela টিমের। এই ওয়েবসাইটের লিংক আপনি নির্দ্বিধায় শেয়ার করতে পারেন।'],
      },
      {
        h: '৬. প্রাপ্যতা ও দায়',
        p: [
          'আমরা ওয়েবসাইট চালু রাখার চেষ্টা করি, তবে মাঝে মাঝে বন্ধ থাকতে পারে। ওয়েবসাইটটি “যেমন আছে” সেভাবেই দেওয়া হয়। আইন যতটুকু অনুমতি দেয়, এটি ব্যবহার করে বা ব্যবহার করতে না পেরে কোনো ক্ষতি হলে আমরা দায়ী নই।',
        ],
      },
      {
        h: '৭. প্রযোজ্য আইন',
        p: ['এই শর্তাবলি বাংলাদেশের আইন অনুযায়ী পরিচালিত।'],
      },
      {
        h: '৮. পরিবর্তন ও যোগাযোগ',
        p: [`আমরা এই শর্তাবলি হালনাগাদ করতে পারি এবং পরিবর্তন এই পেজে জানাব। প্রশ্ন থাকলে হোম পেজের যোগাযোগ ফর্ম ব্যবহার করুন।`],
      },
    ],
  },
}
