import { site } from '@/config/site'
import type { Lang } from '@/i18n'
import type { LegalDoc } from '@/components/layout/LegalPage'

// DRAFT: needs legal review for Bangladesh.
// Numbers here must match contest_settings and the scoring in supabase/migrations/003_functions.sql.
// REVIEW: every Bangla string below needs a native-speaker check.

const UPDATED = '2026-11-18'

export const rules: Record<Lang, LegalDoc> = {
  en: {
    title: 'Contest rules',
    intro: 'The Medi-Bela "Play & Win" daily quiz: how it works, how points are counted and how winners are chosen.',
    updated: `Last updated: ${UPDATED}`,
    draft: 'Draft: subject to legal review',
    sections: [
      {
        h: '1. Organizer',
        p: [`The contest is run by the Medi-Bela team. Contact: ${site.contactEmail}.`],
      },
      {
        h: '2. Dates',
        p: [
          'The contest runs from the day this website opens until the Medi-Bela app launches on Google Play. We will announce the closing on this website. After it closes, no new tries can be started; the leaderboard stays visible.',
        ],
      },
      {
        h: '3. Who can take part',
        p: [
          'Anyone with a Bangladeshi mobile number can create an account and play. One person may take part with one account, using their own mobile number. Playing is free and needs no purchase.',
        ],
      },
      {
        h: '4. How to play',
        ul: [
          'Create an account with your mobile number and a password, choose a public nickname and agree to these rules and the waitlist.',
          'You get one try per Bangladesh calendar day (Asia/Dhaka time). A new day starts at 12:00 midnight.',
          'Pressing Start uses that day’s try, even if you leave before the end. Questions you don’t answer score 0.',
          'Each try has 5 questions chosen at random: 2 easy, 2 medium and 1 hard. Everyone gets the same mix.',
          'You have 20 seconds for each question. Refreshing the page does not stop or reset the timer.',
        ],
      },
      {
        h: '5. Points',
        ul: [
          'A correct answer scores between 500 and 975 points. The faster you answer, the more points you get.',
          'Formula: points = 500 + 500 × (1 − t ÷ 20), rounded down, where t is your answer time in seconds minus 0.8 seconds for network delay, counted as at least 1 second and at most 20 seconds.',
          'So the most for one question is 975 and the most for one day is 4,875. A perfect 5,000 is not possible by design.',
          'A wrong answer, no answer or an answer that arrives after the time limit (with 2.3 seconds of allowance) scores 0.',
          'Answers given in under 0.7 seconds are flagged, score 0 and are reviewed. A flagged try does not appear on the leaderboard unless the review clears it.',
          'Time is measured by our server, not by your device.',
        ],
      },
      {
        h: '6. Leaderboard',
        ul: [
          'Your best single finished try counts. Only your nickname, best score and rank are shown publicly.',
          'If two players have the same best score, the one who finished that try earlier ranks higher.',
        ],
      },
      {
        h: '7. Prizes',
        p: [
          'When the app launches, the three players ranked 1, 2 and 3 on the leaderboard each win an attractive prize. Prize details will be announced on this website.',
        ],
      },
      {
        h: '8. Winners',
        ul: [
          'We contact winners by phone call or SMS on the mobile number they registered with, within 14 days after the contest closes.',
          'A winner who does not reply within 14 days may lose the prize, and it may go to the next eligible player.',
          'We may ask a winner to confirm that the mobile number and the account are their own.',
        ],
      },
      {
        h: '9. Fair play',
        ul: [
          'We may disqualify players who use bots or scripts, more than one account, someone else’s mobile number, shared answers in an organised way, or offensive or impersonating nicknames.',
          'Suspicious tries are reviewed by the Medi-Bela team. Our decision after review is final.',
        ],
      },
      {
        h: '10. Feedback polls',
        p: ['After a try you may answer short feedback polls. They are optional and do not change your score.'],
      },
      {
        h: '11. Changes',
        p: [
          'We may change or end the contest if needed (for example because of a technical problem or abuse). Changes will be posted on this page.',
        ],
      },
    ],
  },
  bn: {
    title: 'প্রতিযোগিতার নিয়ম',
    intro: 'Medi-Bela-র “খেলুন ও জিতুন” প্রতিদিনের কুইজ: কীভাবে খেলবেন, পয়েন্ট কীভাবে গোনা হয় আর বিজয়ী কীভাবে বাছাই হয়।',
    updated: `সর্বশেষ হালনাগাদ: ${UPDATED}`,
    draft: 'খসড়া: আইনি পর্যালোচনা বাকি',
    sections: [
      {
        h: '১. আয়োজক',
        p: [`প্রতিযোগিতাটি পরিচালনা করছে Medi-Bela টিম। যোগাযোগ: ${site.contactEmail}।`],
      },
      {
        h: '২. সময়কাল',
        p: [
          'এই ওয়েবসাইট চালু হওয়ার দিন থেকে Google Play-তে Medi-Bela অ্যাপ লঞ্চ হওয়া পর্যন্ত প্রতিযোগিতা চলবে। শেষ হওয়ার ঘোষণা এই ওয়েবসাইটেই দেওয়া হবে। শেষ হওয়ার পর নতুন করে খেলা শুরু করা যাবে না; লিডারবোর্ড দেখা যাবে।',
        ],
      },
      {
        h: '৩. কারা অংশ নিতে পারবেন',
        p: [
          'বাংলাদেশি মোবাইল নম্বর আছে এমন যে কেউ অ্যাকাউন্ট খুলে খেলতে পারবেন। একজন মানুষ নিজের মোবাইল নম্বর দিয়ে শুধু একটি অ্যাকাউন্টেই অংশ নিতে পারবেন। খেলা বিনামূল্যে, কিছু কিনতে হয় না।',
        ],
      },
      {
        h: '৪. কীভাবে খেলবেন',
        ul: [
          'মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে অ্যাকাউন্ট খুলুন, একটি পাবলিক ডাকনাম বেছে নিন, আর এই নিয়ম ও ওয়েটলিস্টে সম্মতি দিন।',
          'বাংলাদেশ সময় (Asia/Dhaka) অনুযায়ী প্রতিদিন একবার খেলতে পারবেন। রাত ১২টায় নতুন দিন শুরু হয়।',
          '“শুরু করুন” চাপলেই সেদিনের সুযোগ ব্যবহার হয়ে যায়, মাঝপথে চলে গেলেও। যে প্রশ্নের উত্তর দেননি, তাতে ০।',
          'প্রতিবার এলোমেলোভাবে ৫টি প্রশ্ন আসে: ২টি সহজ, ২টি মাঝারি, ১টি কঠিন। সবার জন্য একই অনুপাত।',
          'প্রতিটি প্রশ্নে ২০ সেকেন্ড সময়। পেজ রিফ্রেশ করলে টাইমার থামে না, নতুন করেও শুরু হয় না।',
        ],
      },
      {
        h: '৫. পয়েন্ট',
        ul: [
          'সঠিক উত্তরে ৫০০ থেকে ৯৭৫ পয়েন্ট। যত দ্রুত উত্তর, তত বেশি পয়েন্ট।',
          'সূত্র: পয়েন্ট = ৫০০ + ৫০০ × (১ − t ÷ ২০), নিচের পূর্ণসংখ্যায়; এখানে t হলো সেকেন্ডে আপনার উত্তরের সময় থেকে নেটওয়ার্কের জন্য ০.৮ সেকেন্ড বাদ দিয়ে, কমপক্ষে ১ আর সর্বোচ্চ ২০ সেকেন্ড ধরে।',
          'তাই এক প্রশ্নে সর্বোচ্চ ৯৭৫ আর এক দিনে সর্বোচ্চ ৪,৮৭৫। পুরো ৫,০০০ পাওয়া ইচ্ছা করেই অসম্ভব রাখা হয়েছে।',
          'ভুল উত্তর, উত্তর না দেওয়া, অথবা সময়সীমার পর (২.৩ সেকেন্ড ছাড়সহ) পৌঁছানো উত্তরে ০।',
          '০.৭ সেকেন্ডের কম সময়ে দেওয়া উত্তর চিহ্নিত হয়, ০ পায় এবং পর্যালোচনা করা হয়। পর্যালোচনায় ঠিক প্রমাণিত না হলে চিহ্নিত চেষ্টা লিডারবোর্ডে আসে না।',
          'সময় মাপে আমাদের সার্ভার, আপনার ডিভাইস নয়।',
        ],
      },
      {
        h: '৬. লিডারবোর্ড',
        ul: [
          'আপনার সেরা একটি সম্পূর্ণ চেষ্টাই গোনা হয়। পাবলিকভাবে দেখা যায় শুধু ডাকনাম, সেরা স্কোর আর র‍্যাংক।',
          'দুজনের সেরা স্কোর সমান হলে, যিনি সেই চেষ্টা আগে শেষ করেছেন তিনি এগিয়ে থাকবেন।',
        ],
      },
      {
        h: '৭. পুরস্কার',
        p: [
          'অ্যাপ লঞ্চের সময় লিডারবোর্ডের ১, ২ ও ৩ নম্বর খেলোয়াড় প্রত্যেকে পাবেন আকর্ষণীয় পুরস্কার। পুরস্কারের বিস্তারিত এই ওয়েবসাইটে জানানো হবে।',
        ],
      },
      {
        h: '৮. বিজয়ী',
        ul: [
          'প্রতিযোগিতা শেষ হওয়ার ১৪ দিনের মধ্যে, নিবন্ধিত মোবাইল নম্বরে ফোন বা SMS করে বিজয়ীদের সঙ্গে যোগাযোগ করা হবে।',
          'কোনো বিজয়ী ১৪ দিনের মধ্যে উত্তর না দিলে পুরস্কার বাতিল হতে পারে এবং তা পরের যোগ্য খেলোয়াড়কে দেওয়া হতে পারে।',
          'মোবাইল নম্বর ও অ্যাকাউন্টটি যে বিজয়ীর নিজের, তা নিশ্চিত করতে বলা হতে পারে।',
        ],
      },
      {
        h: '৯. ন্যায্য খেলা',
        ul: [
          'বট বা স্ক্রিপ্ট ব্যবহার, একাধিক অ্যাকাউন্ট, অন্যের মোবাইল নম্বর, সংগঠিতভাবে উত্তর ভাগাভাগি, অথবা আপত্তিকর বা অন্যের পরিচয় নকল করা ডাকনাম ব্যবহার করলে বাতিল করা হতে পারে।',
          'সন্দেহজনক চেষ্টা Medi-Bela টিম পর্যালোচনা করবে। পর্যালোচনার পর আমাদের সিদ্ধান্তই চূড়ান্ত।',
        ],
      },
      {
        h: '১০. মতামত জরিপ',
        p: ['খেলার পর ছোট কিছু মতামত-প্রশ্নের উত্তর দিতে পারেন। এগুলো ঐচ্ছিক, স্কোরে কোনো প্রভাব নেই।'],
      },
      {
        h: '১১. পরিবর্তন',
        p: [
          'প্রয়োজনে (যেমন কারিগরি সমস্যা বা অপব্যবহার হলে) আমরা প্রতিযোগিতা বদলাতে বা বন্ধ করতে পারি। পরিবর্তন এই পেজে জানানো হবে।',
        ],
      },
    ],
  },
}
