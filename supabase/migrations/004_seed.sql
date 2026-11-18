-- 004_seed.sql: blocked nickname words, 13 quiz questions (5 easy, 5 medium, 3 hard), 6 polls.
--
-- Content source: the app's CLAUDE.md only (snapshot: docs/app-CLAUDE.md, app commit 32cd472).
-- source_section = the heading (and bullet label) that proves the answer. Re-check in Phase 6.
-- Every question is answerable from the landing page (same source) or basic healthcare common sense.
-- -- REVIEW: every Bangla string below needs a native-speaker review before launch.
-- The client shuffles option order for display; keys stay stable.

-- Lower-case, no spaces (complete_profile strips spaces, dots and underscores before matching).
-- Add Bangla words here too (insert into public.blocked_words values ('...');).
insert into public.blocked_words (word) values
  ('admin'), ('administrator'), ('moderator'), ('official'), ('medibela'), ('support'), ('staff'),
  ('fuck'), ('shit'), ('bitch'), ('porn'), ('nude'), ('dick'), ('pussy'), ('asshole'), ('bastard')
on conflict do nothing;

insert into public.questions (difficulty, text_en, text_bn, options, correct_key, explanation_en, explanation_bn, source_section) values

-- ============================== EASY (5) ==============================
('easy',
 'Who checks your prescription before Medi-Bela turns it into reminders?',
 'Medi-Bela প্রেসক্রিপশনকে রিমাইন্ডারে বদলানোর আগে কে সেটি যাচাই করেন?', -- REVIEW
 $j$[
  {"key":"a","en":"A pharmacist","bn":"একজন ফার্মাসিস্ট"},
  {"key":"b","en":"An AI robot, automatically","bn":"একটি AI রোবট, নিজে থেকেই"},
  {"key":"c","en":"Your neighbour","bn":"আপনার প্রতিবেশী"},
  {"key":"d","en":"Nobody checks it","bn":"কেউ যাচাই করে না"}
 ]$j$::jsonb,
 'a',
 'A pharmacist checks every prescription and prepares the medicine list before any reminder is made.',
 'রিমাইন্ডার তৈরির আগে একজন ফার্মাসিস্ট প্রতিটি প্রেসক্রিপশন যাচাই করে ওষুধের তালিকা তৈরি করেন।', -- REVIEW
 '1. Project overview (intro; 0.1.0 does: Prescription photo upload -> pharmacist prepares it)'),

('easy',
 'In Medi-Bela, what happens if a dose is still missed after the reminders?',
 'Medi-Bela-তে রিমাইন্ডারের পরও কোনো ডোজ বাদ পড়লে কী হয়?', -- REVIEW
 $j$[
  {"key":"a","en":"Your family is alerted","bn":"আপনার পরিবারকে জানানো হয়"},
  {"key":"b","en":"The medicine is deleted from the app","bn":"অ্যাপ থেকে ওষুধটি মুছে যায়"},
  {"key":"c","en":"Your phone switches off","bn":"ফোন বন্ধ হয়ে যায়"},
  {"key":"d","en":"Nothing at all","bn":"কিছুই হয় না"}
 ]$j$::jsonb,
 'a',
 'Family members are alerted when a dose is missed, so someone can check on you.',
 'কোনো ডোজ বাদ পড়লে পরিবারের সদস্যরা সতর্কবার্তা পান, যাতে কেউ আপনার খোঁজ নিতে পারেন।', -- REVIEW
 '1. Project overview (intro: family members are alerted when a dose is missed; Family care)'),

('easy',
 'Which two languages does Medi-Bela work in?',
 'Medi-Bela কোন দুটি ভাষায় চলে?', -- REVIEW
 $j$[
  {"key":"a","en":"Bangla and English","bn":"বাংলা ও ইংরেজি"},
  {"key":"b","en":"Hindi and English","bn":"হিন্দি ও ইংরেজি"},
  {"key":"c","en":"English only","bn":"শুধু ইংরেজি"},
  {"key":"d","en":"Arabic and Bangla","bn":"আরবি ও বাংলা"}
 ]$j$::jsonb,
 'a',
 'Medi-Bela is fully bilingual: Bangla and English. A new install opens in Bangla.',
 'Medi-Bela পুরোপুরি দুই ভাষার: বাংলা ও ইংরেজি। নতুন করে ইনস্টল করলে বাংলায় খোলে।', -- REVIEW
 '1. Project overview › Bilingual; Round 14 (Bangla first)'),

('easy',
 'How does a Medi-Bela medicine reminder get your attention?',
 'Medi-Bela-র ওষুধের রিমাইন্ডার কীভাবে আপনার মনোযোগ টানে?', -- REVIEW
 $j$[
  {"key":"a","en":"It rings with an alarm tone","bn":"অ্যালার্মের সুরে বেজে ওঠে"},
  {"key":"b","en":"A doctor phones you","bn":"একজন ডাক্তার ফোন করেন"},
  {"key":"c","en":"It sends you an email","bn":"আপনাকে ইমেইল পাঠায়"},
  {"key":"d","en":"It makes no sound","bn":"কোনো শব্দ হয় না"}
 ]$j$::jsonb,
 'a',
 'Reminders ring like an alarm, even when the app is closed.',
 'অ্যাপ বন্ধ থাকলেও রিমাইন্ডার অ্যালার্মের মতো বেজে ওঠে।', -- REVIEW
 '1. Project overview › Alarm-style medicine reminders'),

('easy',
 'Before changing the dose of a medicine, who should you ask?',
 'কোনো ওষুধের ডোজ বদলানোর আগে কার পরামর্শ নেওয়া উচিত?', -- REVIEW
 $j$[
  {"key":"a","en":"Your doctor","bn":"আপনার ডাক্তার"},
  {"key":"b","en":"A friend on social media","bn":"সোশ্যাল মিডিয়ার কোনো বন্ধু"},
  {"key":"c","en":"No one, just change it","bn":"কাউকে না, নিজেই বদলে নিন"},
  {"key":"d","en":"Whoever is nearby","bn":"কাছে যিনি আছেন"}
 ]$j$::jsonb,
 'a',
 'Doses are decided by your doctor. Medi-Bela''s assistant never tells you a dose.',
 'ডোজ ঠিক করেন আপনার ডাক্তার। Medi-Bela-র সহকারী কখনো ডোজ বলে না।', -- REVIEW
 '1. Project overview › AI assistant (never ... states a dose); healthcare common sense'),

-- ============================== MEDIUM (5) ==============================
('medium',
 'What does the lock screen show when a Medi-Bela medicine reminder rings?',
 'Medi-Bela-র ওষুধের রিমাইন্ডার বাজলে লক স্ক্রিনে কী দেখায়?', -- REVIEW
 $j$[
  {"key":"a","en":"Only the time and how many medicines, not their names","bn":"শুধু সময় আর কয়টি ওষুধ, নাম নয়"},
  {"key":"b","en":"Every medicine name and dose","bn":"প্রতিটি ওষুধের নাম ও ডোজ"},
  {"key":"c","en":"A photo of your prescription","bn":"আপনার প্রেসক্রিপশনের ছবি"},
  {"key":"d","en":"Your doctor''s name and phone number","bn":"ডাক্তারের নাম ও ফোন নম্বর"}
 ]$j$::jsonb,
 'a',
 'Phones are often shared, so the lock screen shows neutral text: the time and the number of medicines.',
 'অনেক সময় ফোন ভাগাভাগি করে ব্যবহার হয়, তাই লক স্ক্রিনে থাকে সাধারণ লেখা: সময় আর ওষুধের সংখ্যা।', -- REVIEW
 '1. Project overview › Alarm-style medicine reminders (neutral lock-screen text: count + time, no names); 6. Medical privacy'),

('medium',
 'Which two buttons can you tap right on a Medi-Bela medicine reminder?',
 'Medi-Bela-র ওষুধের রিমাইন্ডারে সরাসরি কোন দুটি বোতাম চাপা যায়?', -- REVIEW
 $j$[
  {"key":"a","en":"Taken and Later","bn":"Taken আর Later"},
  {"key":"b","en":"Buy and Sell","bn":"কিনুন আর বিক্রি করুন"},
  {"key":"c","en":"Like and Share","bn":"লাইক আর শেয়ার"},
  {"key":"d","en":"Call and Message","bn":"কল আর মেসেজ"}
 ]$j$::jsonb,
 'a',
 'Tap Taken when you have taken it, or Later to be reminded again shortly.',
 'খাওয়া হলে Taken চাপুন, অথবা একটু পরে আবার মনে করাতে Later চাপুন।', -- REVIEW
 '1. Project overview › Round 13 (full-screen reminders: Later red / Taken green); Round 14 (Taken / Later)'),

('medium',
 'What does Medi-Bela''s medicine box do?',
 'Medi-Bela-র ওষুধের বাক্স কী কাজ করে?', -- REVIEW
 $j$[
  {"key":"a","en":"Counts how many medicines are left and warns when you are running low","bn":"কয়টি ওষুধ বাকি আছে গোনে, আর ফুরিয়ে এলে জানায়"},
  {"key":"b","en":"Orders medicines from a shop automatically","bn":"নিজে থেকে দোকান থেকে ওষুধ অর্ডার করে"},
  {"key":"c","en":"Chooses new medicines for you","bn":"আপনার জন্য নতুন ওষুধ বেছে দেয়"},
  {"key":"d","en":"Prints your prescription","bn":"আপনার প্রেসক্রিপশন প্রিন্ট করে"}
 ]$j$::jsonb,
 'a',
 'You enter how many you have; the count goes down with each dose taken and you get a notice when it is low.',
 'কয়টি আছে তা লিখে রাখুন; প্রতিটি ডোজ খাওয়ার সঙ্গে গুনতি কমে, আর কমে এলে নোটিশ পান।', -- REVIEW
 '1. Project overview › Round 13 (medicine box: count per medicine, notice when low, Refill when out)'),

('medium',
 'What can the family caregiver do in Medi-Bela?',
 'Medi-Bela-তে পরিবারের কেয়ারগিভার কী করতে পারেন?', -- REVIEW
 $j$[
  {"key":"a","en":"Help manage a member''s medicines and get missed-dose alerts","bn":"সদস্যের ওষুধ সামলাতে সাহায্য করা আর ডোজ বাদ পড়ার সতর্কবার্তা পাওয়া"},
  {"key":"b","en":"Write new prescriptions","bn":"নতুন প্রেসক্রিপশন লেখা"},
  {"key":"c","en":"Change the doctor''s diagnosis","bn":"ডাক্তারের রোগ নির্ণয় বদলে দেওয়া"},
  {"key":"d","en":"Nothing, the role is only a name","bn":"কিছুই না, এটি শুধু একটি নাম"}
 ]$j$::jsonb,
 'a',
 'A caregiver can upload and confirm prescriptions and manage medicines for members who don''t hide from family, and gets missed-dose alerts.',
 'কেয়ারগিভার, যাঁরা পরিবার থেকে লুকাননি এমন সদস্যদের জন্য প্রেসক্রিপশন আপলোড ও নিশ্চিত করতে এবং ওষুধ সামলাতে পারেন, আর ডোজ বাদ পড়লে সতর্কবার্তা পান।', -- REVIEW
 '1. Project overview › Caregiver; Family care'),

('medium',
 'Which of these will Medi-Bela''s AI assistant never do?',
 'Medi-Bela-র AI সহকারী নিচের কোনটি কখনো করে না?', -- REVIEW
 $j$[
  {"key":"a","en":"Diagnose you or tell you a dose","bn":"রোগ নির্ণয় করা বা ডোজ বলে দেওয়া"},
  {"key":"b","en":"Answer in Bangla","bn":"বাংলায় উত্তর দেওয়া"},
  {"key":"c","en":"Give general health tips","bn":"সাধারণ স্বাস্থ্য-পরামর্শ দেওয়া"},
  {"key":"d","en":"Explain warning signs to watch for","bn":"কোন লক্ষণে সতর্ক হতে হবে তা বলা"}
 ]$j$::jsonb,
 'a',
 'The assistant gives general information only. It never diagnoses, names a medicine for your problem or states a dose.',
 'সহকারী শুধু সাধারণ তথ্য দেয়। এটি কখনো রোগ নির্ণয় করে না, আপনার সমস্যার জন্য ওষুধের নাম বলে না, ডোজও বলে না।', -- REVIEW
 '1. Project overview › AI assistant (never diagnoses, names a medicine for the user''s problem, or states a dose)'),

-- ============================== HARD (3) ==============================
('hard',
 'After the pharmacist prepares your prescription, what must happen before the reminders start?',
 'ফার্মাসিস্ট প্রেসক্রিপশন তৈরি করার পর রিমাইন্ডার শুরু হওয়ার আগে কী করতে হয়?', -- REVIEW
 $j$[
  {"key":"a","en":"You confirm it (you can adjust times, or ask for an edit)","bn":"আপনি নিশ্চিত করেন (সময় বদলাতে বা সংশোধন চাইতে পারেন)"},
  {"key":"b","en":"You pay the pharmacist inside the app","bn":"অ্যাপের ভেতরে ফার্মাসিস্টকে টাকা দেন"},
  {"key":"c","en":"Your doctor signs it again in the app","bn":"ডাক্তার অ্যাপে আবার সই করেন"},
  {"key":"d","en":"Nothing, reminders start before the pharmacist checks it","bn":"কিছুই না, ফার্মাসিস্ট যাচাইয়ের আগেই রিমাইন্ডার শুরু হয়"}
 ]$j$::jsonb,
 'a',
 'You (or your caregiver) confirm the prepared list: you may change dose times, start date or meal timing, or send it back with "Request edit".',
 'আপনি (বা কেয়ারগিভার) তৈরি তালিকাটি নিশ্চিত করেন: চাইলে ডোজের সময়, শুরুর তারিখ বা খাবারের আগে-পরে বদলাতে পারেন, অথবা "Request edit" দিয়ে ফেরত পাঠাতে পারেন।', -- REVIEW
 '1. Project overview › 0.1.0 does ("Confirm or Edit"); Round 12 (Request edit); 5. Prescription statuses (AWAITING_CONFIRMATION -> ACTIVE)'),

('hard',
 'What does Medi-Bela''s Easy mode give you?',
 'Medi-Bela-র সহজ মোডে কী থাকে?', -- REVIEW
 $j$[
  {"key":"a","en":"Big text, one big Taken button and quick calls to your caregiver or 999","bn":"বড় লেখা, একটি বড় Taken বোতাম আর কেয়ারগিভার বা ৯৯৯-এ দ্রুত কল"},
  {"key":"b","en":"A way to turn off all reminders","bn":"সব রিমাইন্ডার বন্ধ করার উপায়"},
  {"key":"c","en":"A quiz game inside the app","bn":"অ্যাপের ভেতরে একটি কুইজ খেলা"},
  {"key":"d","en":"Automatic medicine orders","bn":"নিজে থেকে ওষুধ অর্ডার"}
 ]$j$::jsonb,
 'a',
 'Easy mode shows today''s medicine with one big Taken button, big text, a call-the-caregiver button and 999.',
 'সহজ মোডে আজকের ওষুধ দেখায় একটি বড় Taken বোতামসহ, বড় লেখা, কেয়ারগিভারকে কল করার বোতাম আর ৯৯৯।', -- REVIEW
 '1. Project overview › Round 14 (easy mode: big text, today''s medicine with one big Taken, call the caregiver, 999)'),

('hard',
 'If the pharmacist can''t use your prescription photo, what happens?',
 'ফার্মাসিস্ট যদি আপনার প্রেসক্রিপশনের ছবি ব্যবহার করতে না পারেন, তাহলে কী হয়?', -- REVIEW
 $j$[
  {"key":"a","en":"It is sent back with a note, and you can re-upload it","bn":"নোটসহ ফেরত আসে, আর আপনি আবার আপলোড করতে পারেন"},
  {"key":"b","en":"Your account is closed","bn":"আপনার অ্যাকাউন্ট বন্ধ হয়ে যায়"},
  {"key":"c","en":"The app guesses the medicines","bn":"অ্যাপ নিজে ওষুধ আন্দাজ করে নেয়"},
  {"key":"d","en":"It is shared with your family","bn":"এটি আপনার পরিবারের সঙ্গে শেয়ার হয়"}
 ]$j$::jsonb,
 'a',
 'A rejected prescription shows the pharmacist''s note and a Re-upload button; the new photo is linked to the old one.',
 'বাতিল হওয়া প্রেসক্রিপশনে ফার্মাসিস্টের নোট আর একটি Re-upload বোতাম দেখায়; নতুন ছবিটি আগেরটির সঙ্গে যুক্ত থাকে।', -- REVIEW
 '1. Project overview › 0.1.0 does (pharmacist rejects it with feedback); Re-upload');

-- ============================== POLLS (6, unscored) ==============================
-- Drawn from current app UI (Round 13 full-screen reminders, Round 14 Home / text size / Bangla first, Family care).
insert into public.polls (sort, text_en, text_bn, options) values
(1,
 'When a medicine reminder rings, which style would you prefer?',
 'ওষুধের রিমাইন্ডার বাজলে কোন ধরনটি আপনার পছন্দ?', -- REVIEW
 $j$[
  {"key":"a","en":"Full-screen alarm","bn":"পুরো স্ক্রিন জুড়ে অ্যালার্ম"},
  {"key":"b","en":"A normal notification","bn":"সাধারণ নোটিফিকেশন"},
  {"key":"c","en":"Not sure yet","bn":"এখনো নিশ্চিত নই"}
 ]$j$::jsonb),
(2,
 'On the Home screen, which would you tap first?',
 'হোম স্ক্রিনে প্রথমে কোনটিতে চাপবেন?', -- REVIEW
 $j$[
  {"key":"a","en":"Today's medicine","bn":"আজকের ওষুধ"},
  {"key":"b","en":"Medicine box","bn":"ওষুধের বাক্স"},
  {"key":"c","en":"Prescriptions","bn":"প্রেসক্রিপশন"},
  {"key":"d","en":"Health records","bn":"স্বাস্থ্যের রেকর্ড"}
 ]$j$::jsonb),
(3,
 'Which Medi-Bela feature do you want most?',
 'Medi-Bela-র কোন ফিচারটি আপনার সবচেয়ে বেশি দরকার?', -- REVIEW
 $j$[
  {"key":"a","en":"Alarm-style medicine reminders","bn":"অ্যালার্মের মতো ওষুধের রিমাইন্ডার"},
  {"key":"b","en":"Missed-dose alerts to family","bn":"ডোজ বাদ পড়লে পরিবারকে সতর্কবার্তা"},
  {"key":"c","en":"Health readings and records","bn":"স্বাস্থ্যের রিডিং ও রেকর্ড"},
  {"key":"d","en":"The AI health assistant","bn":"AI স্বাস্থ্য সহকারী"}
 ]$j$::jsonb),
(4,
 'Who would you add as your family caregiver?',
 'পরিবারের কেয়ারগিভার হিসেবে কাকে যোগ করবেন?', -- REVIEW
 $j$[
  {"key":"a","en":"My son or daughter","bn":"ছেলে বা মেয়ে"},
  {"key":"b","en":"My husband or wife","bn":"স্বামী বা স্ত্রী"},
  {"key":"c","en":"My parent","bn":"মা বা বাবা"},
  {"key":"d","en":"Someone else / no one","bn":"অন্য কেউ / কেউ না"}
 ]$j$::jsonb),
(5,
 'Which text size would you use in the app?',
 'অ্যাপে কোন আকারের লেখা ব্যবহার করবেন?', -- REVIEW
 $j$[
  {"key":"a","en":"Normal","bn":"সাধারণ"},
  {"key":"b","en":"Large","bn":"বড়"},
  {"key":"c","en":"Larger","bn":"আরও বড়"}
 ]$j$::jsonb),
(6,
 'Which language would you use the app in?',
 'অ্যাপটি কোন ভাষায় ব্যবহার করবেন?', -- REVIEW
 $j$[
  {"key":"a","en":"Bangla","bn":"বাংলা"},
  {"key":"b","en":"English","bn":"ইংরেজি"},
  {"key":"c","en":"Both, depending on the screen","bn":"দুটোই, প্রয়োজন অনুযায়ী"}
 ]$j$::jsonb);
