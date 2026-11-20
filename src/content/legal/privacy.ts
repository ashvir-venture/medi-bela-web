import type { Lang } from '@/i18n'
import type { LegalDoc, LegalSection } from '@/components/layout/LegalPage'
import { appPublic } from '@/content/app-public'

// First part: the Medi-Bela APP's own privacy text, word for word (app-public.ts).
// Second part: what this WEBSITE (quiz + waitlist) collects. The app text comes first so
// people see the same promise the app makes.
function appPart(lang: Lang, groupTitle: string): LegalSection[] {
  const s = appPublic[lang].privacySections[0]
  return [{ h: groupTitle, group: true }, { h: s.heading, ul: [...s.lines] }]
}

// DRAFT: needs legal review for Bangladesh (incl. any minimum age / guardian consent).
// Keep in sync with what the database actually stores (supabase/migrations/001_schema.sql).
// REVIEW: every Bangla string below needs a native-speaker check.

const UPDATED = '2026-11-18'

export const privacy: Record<Lang, LegalDoc> = {
  en: {
    title: 'Privacy policy',
    intro: 'What this website collects, why, who handles it and how to have it deleted. This covers the website, quiz and waitlist, not the Medi-Bela app.',
    updated: `Last updated: ${UPDATED}`,
    sections: [
      ...appPart('en', 'In the Medi-Bela app'),
      { h: 'On this website (quiz and waitlist)', group: true },
      {
        h: 'Who we are',
        p: [`This website is run by the Medi-Bela team. Contact us using the contact form on the home page.`],
      },
      {
        h: 'What we collect',
        ul: [
          'From your account (only if you play or join the waitlist): the name you type, your mobile number and an account id. Your password is stored only as a secure hash by our sign-in provider; nobody, including us, can read it.',
          'The public nickname and language you choose.',
          'Your consent choices and when you gave them (contest and waitlist; optional feedback).',
          'Your quiz tries: which questions you got, your answers, answer times and points.',
          'Your answers to optional feedback polls.',
          'Contact form messages: the name, email and message you type. These are delivered to our mailbox by Web3Forms.',
          'In your own browser: your sign-in session and language choice are kept in local storage. We use no advertising or analytics cookies.',
        ],
        p: ['We do not collect symptoms, prescriptions or any other health information on this website.'],
      },
      {
        h: 'Why we use it',
        ul: [
          'To run the contest: one try per day, scoring, the leaderboard and fair-play checks.',
          'To contact winners by phone call or SMS.',
          'To tell people on the waitlist (by SMS or phone) when the Medi-Bela app launches.',
          'To ask for feedback, only if you ticked the optional box.',
          'To reply to messages sent through the contact form.',
        ],
      },
      {
        h: 'What is public',
        p: [
          'Only your nickname, best score and rank appear on the leaderboard. Your name and mobile number are never shown publicly.',
        ],
      },
      {
        h: 'Who handles the data',
        ul: [
          'Supabase: database and sign-in service (servers in Tokyo, Japan).',
          'Web3Forms: delivers contact form messages to our email.',
          'Our website host, which serves the pages and keeps standard access logs.',
        ],
        p: ['We do not sell your data or share it with advertisers.'],
      },
      {
        h: 'How long we keep it',
        ul: [
          'Quiz, waitlist and poll data: until 6 months after the app launches, then deleted or made anonymous.',
          'Contact messages: up to 12 months in our mailbox.',
        ],
      },
      {
        h: 'Your choices and rights',
        p: [
          `You can ask to see, correct or delete your data, or withdraw a consent, by writing to us through the contact form on the home page, with the mobile number you registered. We will reply within 30 days. Deleting your data removes you from the waitlist and the leaderboard.`,
        ],
      },
      {
        h: 'Changes',
        p: ['If this policy changes, we will update this page and the date above.'],
      },
    ],
  },
  bn: {
    title: 'গোপনীয়তা নীতি',
    intro: 'এই ওয়েবসাইট কী তথ্য নেয়, কেন নেয়, কারা তা সামলায় আর কীভাবে মুছে ফেলতে বলবেন। এটি ওয়েবসাইট, কুইজ ও ওয়েটলিস্টের জন্য, Medi-Bela অ্যাপের জন্য নয়।',
    updated: `সর্বশেষ হালনাগাদ: ${UPDATED}`,
    sections: [
      ...appPart('bn', 'Medi-Bela অ্যাপে'),
      { h: 'এই ওয়েবসাইটে (কুইজ ও ওয়েটলিস্ট)', group: true },
      {
        h: 'আমরা কারা',
        p: [`এই ওয়েবসাইট পরিচালনা করে Medi-Bela টিম। যোগাযোগের জন্য হোম পেজের যোগাযোগ ফর্ম ব্যবহার করুন।`],
      },
      {
        h: 'আমরা কী তথ্য নিই',
        ul: [
          'আপনার অ্যাকাউন্ট থেকে (শুধু খেললে বা ওয়েটলিস্টে যোগ দিলে): আপনার লেখা নাম, মোবাইল নম্বর আর একটি অ্যাকাউন্ট আইডি। আপনার পাসওয়ার্ড আমাদের সাইন-ইন সেবা শুধু নিরাপদ হ্যাশ আকারে রাখে; আমরাসহ কেউ তা পড়তে পারে না।',
          'আপনার বেছে নেওয়া পাবলিক ডাকনাম ও ভাষা।',
          'আপনার সম্মতি আর কখন দিয়েছেন (প্রতিযোগিতা ও ওয়েটলিস্ট; ঐচ্ছিক মতামত)।',
          'আপনার কুইজের চেষ্টা: কোন প্রশ্ন পেয়েছেন, উত্তর, উত্তর দিতে কত সময় লেগেছে আর পয়েন্ট।',
          'ঐচ্ছিক মতামত-জরিপে আপনার উত্তর।',
          'যোগাযোগ ফর্মের বার্তা: আপনি যে নাম, ইমেইল আর বার্তা লেখেন। Web3Forms এগুলো আমাদের ইমেইলে পৌঁছে দেয়।',
          'আপনার নিজের ব্রাউজারে: সাইন-ইন সেশন আর ভাষার পছন্দ লোকাল স্টোরেজে থাকে। আমরা কোনো বিজ্ঞাপন বা অ্যানালিটিক্স কুকি ব্যবহার করি না।',
        ],
        p: ['এই ওয়েবসাইটে আমরা রোগের লক্ষণ, প্রেসক্রিপশন বা স্বাস্থ্য-সংক্রান্ত কোনো তথ্য নিই না।'],
      },
      {
        h: 'কেন ব্যবহার করি',
        ul: [
          'প্রতিযোগিতা চালাতে: দিনে একবার খেলা, স্কোর, লিডারবোর্ড আর ন্যায্য খেলা যাচাই।',
          'বিজয়ীদের সঙ্গে ফোন বা SMS-এ যোগাযোগ করতে।',
          'Medi-Bela অ্যাপ লঞ্চ হলে ওয়েটলিস্টের সবাইকে (SMS বা ফোনে) জানাতে।',
          'মতামত চাইতে, শুধু যদি আপনি ঐচ্ছিক বাক্সে টিক দিয়ে থাকেন।',
          'যোগাযোগ ফর্মে পাঠানো বার্তার উত্তর দিতে।',
        ],
      },
      {
        h: 'কী পাবলিক থাকে',
        p: ['লিডারবোর্ডে দেখা যায় শুধু আপনার ডাকনাম, সেরা স্কোর আর র‍্যাংক। আপনার নাম আর মোবাইল নম্বর কখনো পাবলিক করা হয় না।'],
      },
      {
        h: 'কারা তথ্য সামলায়',
        ul: [
          'Supabase: ডেটাবেস ও সাইন-ইন সেবা (সার্ভার জাপানের টোকিওতে)।',
          'Web3Forms: যোগাযোগ ফর্মের বার্তা আমাদের ইমেইলে পৌঁছে দেয়।',
          'আমাদের ওয়েবসাইট হোস্ট, যা পেজগুলো দেখায় এবং সাধারণ অ্যাক্সেস লগ রাখে।',
        ],
        p: ['আমরা আপনার তথ্য বিক্রি করি না, বিজ্ঞাপনদাতাদের সঙ্গেও শেয়ার করি না।'],
      },
      {
        h: 'কত দিন রাখি',
        ul: [
          'কুইজ, ওয়েটলিস্ট ও জরিপের তথ্য: অ্যাপ লঞ্চের ৬ মাস পর পর্যন্ত, তারপর মুছে ফেলা বা নাম-পরিচয়হীন করা হবে।',
          'যোগাযোগের বার্তা: আমাদের ইমেইলে সর্বোচ্চ ১২ মাস।',
        ],
      },
      {
        h: 'আপনার অধিকার',
        p: [
          `নিবন্ধিত মোবাইল নম্বর উল্লেখ করে হোম পেজের যোগাযোগ ফর্মে লিখে আপনার তথ্য দেখতে, ঠিক করতে বা মুছে ফেলতে, অথবা কোনো সম্মতি তুলে নিতে বলতে পারেন। আমরা ৩০ দিনের মধ্যে উত্তর দেব। তথ্য মুছে ফেললে আপনি ওয়েটলিস্ট ও লিডারবোর্ড থেকেও সরে যাবেন।`,
        ],
      },
      {
        h: 'পরিবর্তন',
        p: ['এই নীতি বদলালে আমরা এই পেজ আর ওপরের তারিখ হালনাগাদ করব।'],
      },
    ],
  },
}
