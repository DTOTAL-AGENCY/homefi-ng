HomeFi.ng
…simplifying mortgage access & homeownership for You in Nigeria 
own your Home. Financed simply. 
HomeFi website UX /Website Content brief (11.2026)
Website copy, information architecture and backend specification for HomeFi.ng, the intelligent mortgage prequalification and processing platform for Nigerians at home and in the diaspora.

Item
Detail
Prepared for
Product, design and engineering teams, HomeFi Africa Technologies Ltd (RC 7494763)
Product owner
David Oloruntobi (DT), Co-Founder and Product Lead
Engineering lead
Semiloore Akilo (Semi), Head of Engineering
Version and date
Version 1.0, 22 November 2026
Status
Draft for review. Items marked [Confirm] need a decision before build (see Open decisions).

Contents
	•	Executive summary
	•	Where we are today
	•	What we are borrowing from Habito and MortgageMarket
	•	Who we are designing for, and how we measure success
	•	Voice, tone and words
	•	Sitemap and navigation
	•	The core journey
	•	Page copy: Home
	•	Page copy: Prequalification flow
	•	Page copy: Your estimate (result screen)
	•	Page copy: Sign up, sign in and verification
	•	Page copy: Applicant dashboard
	•	Page copy: Mortgage advisors and booking
	•	Page copy: Supporting pages
	•	Emails and notifications
	•	System messages and empty states
	•	Responsive design and accessibility
	•	System architecture
	•	Prequalification engine
	•	Report generation pipeline
	•	Data model
	•	API
	•	Integrations and webhooks
	•	Security, privacy and compliance
	•	Analytics events
	•	Moving the existing applicants across
	•	Delivery phases and acceptance criteria
	•	Open decisions
	•	Appendix A: Database schema (PostgreSQL)
	•	Appendix B: Sample API response
	•	Appendix C: Engine test fixtures
Executive summary
HomeFi.ng should replace the Google Form, CSV export and hand-sent emails with a single on-site journey: a visitor answers about 15 questions, sees an instant mortgage estimate in under 5 minutes, creates an account to receive the full PDF report by email, and books a paid 1-on-1 session with a vetted Mortgage Advisor from a public directory. Every step that is manual today (collating responses, running the AI engine, generating the PDF, emailing it, sending the booking link) becomes an automated job.
The case for doing this now is volume. On 17 November 2026 a single post sent over 2,200 applicants to the current form in 24 hours. Each of those reports was then produced and sent by hand, in batches. The same demand on the new platform would be served in minutes, with no batch work and no re-sends.
This brief has two halves. The first half is the user experience: sitemap, journey and finished copy for every page, form field, result state and email. The second half is the build specification: architecture, the calculation rules of the prequalification engine, the report pipeline, the database schema, the API and the integrations. A developer should be able to set up the backend and database from this document alone, and a designer should be able to lay out every screen without inventing copy.
What ships first (Phase 1)
On-site prequalification with instant results for FG concessionary rates (NHF and MREIF) and the commercial range from PMBs and banks.
"Send me the PDF" prompt that leads to sign up or sign in, then an automatic branded PDF report sent by email and saved in the dashboard.
Applicant dashboard with the 1st Mortgage Prequalification Report, next steps and an advisor booking entry point.
Mortgage Advisor directory with profiles, track record, verified reviews, live availability and paid booking.
Admin tools to update rates and engine settings without a code release, approve advisors and moderate reviews.

Where we are today
The current process
	•	An applicant opens the Google Form (8 pages, about 2 to 3 minutes by the form's own estimate) and submits their details.
	•	Responses collect in a Google Sheet, which the team downloads as CSV.
	•	The CSV is fed to the AI prequalification engine, which produces the 1st Mortgage Prequalification Report as a branded 6 page PDF for each applicant.
	•	Each report is emailed by hand to the address the applicant typed on the form.
	•	The report links to the Cal.com and Mainstack pages where the applicant books and pays for a 30 minute 1-on-1 Mortgage Advisory Session (currently USD 25).
What breaks at scale
	•	Speed. Applicants wait hours or days for a number they could see instantly. Interest is highest at the moment they submit.
	•	Errors. Free-text fields arrive messy (emails typed into the wrong box, phone numbers without country codes, street addresses in the email field). Each one needs a human rule, and each wrong report means a correction and a re-send.
	•	No account, no relationship. The applicant has nothing to log in to. Their report lives only in their inbox, and the team cannot see who opened it, who booked, or who went quiet.
	•	Booking is disconnected. Mainstack and Cal.com do not know which report or advisor the applicant came from, so the advisor starts each call without context.
	•	No proof for advisors. There is nowhere to show an advisor's track record or reviews, which is what makes a paid session feel worth booking.
Rules the team already uses that the platform must keep
Second person voice for the applicant ("you"), first person plural for HomeFi ("we").
Reference codes in the format HF-PQ-YYYY-MMDD-[INITIALS]. The platform adds a 4 digit sequence to keep codes unique: HF-PQ-2026-1122-DO-0042.
Report file name: "MortgagePrequalification Report1 [DD.Mon.YY]_HomeFi-[Surname First-name]".
Processing fee wording: "3% of the Mortgage approved" for processing only, or "4% of the Mortgage approved" if HomeFi also searches for and verifies the property. Never converted to a Naira figure.
Wherever "Book a 1-on-1 Advisory call Here" appears, the word "Here" carries the booking link.

What we are borrowing from Habito and MortgageMarket
Both platforms prove the same point: people will give detailed financial information online if the first answer comes back fast and a real person is one click away.
Pattern
Where it comes from
How HomeFi uses it
Short input, then a human
Habito asks for about 10 minutes of information, then a 5 minute chat with an adviser by phone or online to confirm needs.
Our form targets under 5 minutes. The advisor session is the next step on every result, not a buried link.
Results first, sign up second
MortgageMarket shows pre-approval results first and then lets customers sign up to save them on their profile.
The estimate shows without an account. Creating an account is the price of the PDF and the dashboard, which is a fair trade the user understands.
One application, many lenders
MortgageMarket gives access to several banks through one online application.
One HomeFi application is matched to NHF, MREIF, PMB and bank options, and later submitted to the chosen lender.
Free to the user up front
Habito is free to the borrower and is paid by lender commission.
The 1st report stays free. Revenue comes from the advisory session and the processing fee on the Mortgage approved.
Track the customer after the first answer
Habito keeps customers on the platform after completion and flags cheaper rates.
The dashboard tracks the application from prequalification to keys, and becomes the place for the 2nd report and documents.

Where HomeFi goes further
	•	Two rate worlds side by side. Nigerian buyers need to see the gap between concessionary money (NHF at 6%, MREIF at 9.75%) and commercial rates, which press reports put around 27% or more. Showing both is the core insight of the product.
	•	Diaspora as a first class path. Income in pounds, dollars or euros, converted at today's rate and stress-tested, with NHF Diaspora shown where it applies.
	•	Named advisors with a track record. Instead of a faceless "adviser", applicants choose a person, see what they have processed and read verified reviews.
	•	Property help. HomeFi can search for and verify the property, which neither benchmark does in the same way.
Who we are designing for, and how we measure success
Segment
What they need to hear
Design implication
Salaried professional in Nigeria
"How much can I get, and how long will it take?"
Fast form, clear monthly repayment, NHF eligibility explained in one line.
Nigerian in the diaspora (UK, USA, Canada, Europe, UAE)
"Can I buy at home without flying home, and will the exchange rate ruin my numbers?"
Income in their currency, stressed FX shown openly, video advisory sessions in their time zone.
Self-employed or business owner
"Will a lender take my income seriously without a payslip?"
Income source question with reassurance copy, document checklist in the report.
Joint applicants (couples)
"Can we combine our incomes?"
Joint toggle that adds a co-applicant income without a second form.
Non-interest (Sharia-compliant) seekers
"Is there an option without interest?"
A preference question that routes them to Ijarah-based options and changes "interest" to "profit rate" in their results.

Success metrics
Metric
Definition
Phase 1 target
Form completion
Visitors who submit the form ÷ visitors who start step 1
60% or more
Time to estimate
Median time from step 1 to the result screen
Under 5 minutes
Result to account
Accounts created from the "send my report" prompt ÷ results shown
45% or more
Report delivery
Reports emailed within 3 minutes of account creation
95% or more
Report quality
Reports that pass automated checks on the first attempt
98% or more
Account to booking
Paid advisory sessions ÷ accounts with a report, within 14 days
8% or more [Confirm]
Session attendance
Completed sessions ÷ booked sessions
85% or more

Voice, tone and words
HomeFi sounds like a knowledgeable friend who works in mortgages: warm, direct and specific. We explain, we do not lecture. We are confident about the process and honest about the limits of an estimate.
Do
Avoid
"You could access up to ₦34.6m."
"You are approved for ₦34.6m." (it is an estimate, not an approval)
"Based on what you told us"
"Guaranteed", "instant approval", "100%"
Plain words: "deposit (equity)", "monthly repayment"
Unexplained jargon: "LTV", "DTI", "amortisation" without a tooltip
Numerals and the ₦ symbol: "₦50,000,000", "6%"
"NGN 50 million", "six percent"
"We" for HomeFi, "you" for the applicant
"The applicant", "the user", "HomeFi will"
Claims we can prove: "2,300+ Nigerians have prequalified with us" [Confirm count]
Unverified superlatives such as "largest platform in Nigeria" until we have the data to back them

Pidgin and playful lines ("Mortgage na wetin?", "Don't air me!") work in social content, the Learn section and a few emails. Keep them out of the form, the results and anything about money or fees.
Brand application on the website
	•	Colours: Midnight Navy #0D2240 (primary, header, footer), Amber Gold #E8A020 (primary buttons and highlights only), Sapphire Blue #1A3A5C (secondary surfaces), Warm White #F7F4EE (page background and cards).
	•	Type: Cormorant Garamond Bold for display headlines; Plus Jakarta Sans for everything else, including all numbers in results.
	•	Logo: "The Roofspan" mark. White and gold version on navy surfaces; navy on cream elsewhere.
	•	Buttons: gold fill with navy text for the single primary action on a screen; navy outline for secondary actions.
Sitemap and navigation
Public site (homefi.ng)
Route
Page
Purpose
/
Home
Explain the promise and start the prequalification
/prequalify
Prequalification flow
4 short steps, saved as you go
/prequalify/result/:id
Your estimate
Instant result and the "send my report" prompt
/how-it-works
How it works
The 4 stages from estimate to keys
/mortgage-options
Mortgage options hub
NHF, NHF Diaspora, MREIF, commercial, non-interest
/mortgage-options/:slug
Option detail
Rates, limits, who qualifies, documents
/advisors
Mortgage Advisors
Directory with filters
/advisors/:slug
Advisor profile
Bio, track record, reviews, availability, booking
/diaspora
For Nigerians abroad
Diaspora path and FX explanation
/pricing
Pricing and fees
Free report, session fee, processing fee
/learn and /learn/:slug
Learn (Mortgage na wetin?)
Education articles and the 7-part series
/faq
FAQ
Common questions
/about, /contact
About, Contact
Story, team, advisory board; support channels
/legal/privacy, /legal/terms, /legal/disclaimer
Legal
Privacy notice (NDPA 2023), terms, estimate disclaimer

Accounts and app (app.homefi.ng or /app)
Route
Page
Who
/signup, /signin, /forgot-password, /verify
Authentication
Everyone
/app
Dashboard overview
Applicant
/app/reports and /app/reports/:id
My reports
Applicant
/app/advisors and /app/book/:advisorSlug
Book an advisor
Applicant
/app/sessions
My sessions
Applicant
/app/application
Application tracker (Phase 2)
Applicant
/app/documents
Documents (Phase 2)
Applicant
/app/settings
Profile, password, notifications, data and privacy
Applicant
/advisor
Advisor portal: schedule, applicants, session notes, 2nd reports, profile
Advisor
/admin
Admin: applications, reports, advisors, reviews, rates and engine settings, payments, exports
Admin, Ops

Navigation
Area
Content
Header (desktop)
Logo · How it works · Mortgage options · Advisors · Diaspora · Learn · Sign in · [Get Prequalified] (gold button)
Header (mobile)
Logo, menu icon, and a compact "Get Prequalified" button. The menu opens full screen with the same links.
Sticky mobile bar
On Home, Mortgage options and Diaspora pages, a bottom bar after the first scroll: "See how much you can get in 5 minutes" [Start]
Footer
Columns: Product (Prequalify, Mortgage options, Advisors, Pricing) · Company (About, Contact, Careers) · Learn (Mortgage na wetin?, FAQ) · Legal (Privacy, Terms, Disclaimer). Social: Instagram @homefi_ng, X @HomeFi_Ng. Line: "HomeFi Africa Technologies Ltd · RC 7494763 · Abuja, Nigeria · support.homefi@gmail.com"
Signed-in header
Logo · Dashboard · Reports · Advisors · Sessions · avatar menu (Settings, Sign out)

The core journey
This is the path the platform must make effortless. Each row is a screen or system step. The system column is what the backend does at that moment.
Step
What the user sees and does
What the system does
1. Land
Home page. Clicks "Get Prequalified".
Creates an anonymous session token (stored in an httpOnly cookie and local storage). Records the UTM source.
2. Answer
4 steps: About you, Your income, The home you want, Final details. Progress saved after each step.
Saves a draft application against the anonymous token after each step, so a refresh or a dropped connection loses nothing.
3. Get Prequalified
Clicks "Get Prequalified". Sees a 2 to 4 second loading state.
Validates the payload, runs the engine for each eligible product, stores results, sets status "estimated".
4. See the estimate
Headline amount, FG concessionary card, commercial card, short insight.
Returns computed results. No AI call is needed here, so the response is fast.
5. The prompt
"Want your full report as a PDF in your inbox?" [Yes, send my report] [Not now]
Logs the choice.
6a. Yes
Goes to sign up (or sign in if they already have an account). Name and phone are prefilled.
On account creation or sign in, claims the anonymous application for the user (sets user_id), records consent, and queues report generation.
6b. Not now
Stays on the result. Sees "Talk to an advisor" and "Save for later" options.
Keeps the anonymous application for 30 days. If the user signs up later on the same device, it is claimed automatically.
7. Report
Dashboard shows "Your report is on its way" and then the report card. Email arrives with the PDF.
Job runs: AI narrative, HTML render, PDF, automated checks, storage, email. Status moves from queued to emailed.
8. Choose an advisor
Browses advisors, filtered and sorted with "Recommended for you" at the top.
Scores advisors against the application (diaspora, self-employed, joint, non-interest, state, language).
9. Book and pay
Picks a time, confirms the topic, pays.
Holds the slot, takes payment by Paystack, creates the Cal.com booking, shares the report with the advisor.
10. Session and after
Gets reminders, joins the call, then receives the 2nd (precise) report and a review request.
Cal.com marks the meeting ended; advisor uploads notes and triggers Report 2; review invitation sent 2 hours after.

Page copy: Home
Hero
Element
Copy
Eyebrow
For Nigerians at home and in the diaspora
Headline (H1)
Find out how much mortgage you can get, in under 5 minutes.
Headline A/B alternates
1) Own your home. Financed simply.
2) Stop guessing. See what mortgage you qualify for today.
Subheadline
Tell us about your income and the home you want. We'll show you what you could access through FG concessionary schemes like NHF and MREIF, and what commercial mortgage banks may offer, side by side. Free.
Primary button
Get Prequalified
Microcopy under button
Free · About 4 minutes · No documents needed
Secondary link
See how it works
Hero visual
A phone mockup showing a result card ("You could access up to ₦34.6m") next to a family at the door of a home. Real Nigerian homes and people, no stock clichés.

Trust strip
Element
Copy
Stat 1
2,300+ Nigerians prequalified [Confirm live count; pull from the database]
Stat 2
Options from FMBN (NHF), MREIF partner banks and Primary Mortgage Banks [Replace with "Working with X lenders" once MOUs are signed]
Stat 3
Applicants in Nigeria, the UK, USA, Canada, Europe and the UAE

How it works (4 steps)
Element
Copy
Section title
From "how much can I get?" to your keys
Step 1
Get prequalified. Answer a few questions about you, your income and the home you want. It takes under 5 minutes.
Step 2
Get your free report. We email you a detailed Mortgage Prequalification Report: what you can access, at what rate, and the deposit you'll need.
Step 3
Talk to a Mortgage Advisor. Book a 30 minute 1-on-1 session with a vetted advisor who knows your situation, whether you're salaried, self-employed or abroad.
Step 4
We process your mortgage. From application to offer letter, property appraisal, underwriting and disbursement, we handle the lender and the paperwork. You step out to collect your keys.
Button
Start step 1

Mortgage options
Element
Copy
Section title
Every serious mortgage option in Nigeria, in one place
Intro
Most people only hear about one or two banks. We compare across the schemes and lenders that matter, and tell you which ones fit you.
Card: NHF
National Housing Fund (FMBN). 6% a year, up to ₦50m. For workers contributing to the NHF. Lowest rate, longer to process.
Card: NHF Diaspora
NHF Diaspora. The FMBN route for Nigerians working abroad.
Card: MREIF
MREIF. 9.75% a year through partner banks. A strong option when NHF limits are too low for the home you want.
Card: Commercial
Commercial mortgages. From Primary Mortgage Banks and commercial banks. Higher rates, but often faster and more flexible.
Card: Non-interest
Non-interest home finance. Sharia-compliant options based on Ijarah (lease to own), from non-interest banks.
Link
Compare all options

Why HomeFi
Element
Copy
Section title
You focus on choosing your home. We handle the rest.
Point 1
One application, many lenders. No more visiting mortgage banks one by one. Apply once and we match you to the options that fit.
Point 2
A real advisor, not just a calculator. Your advisor explains your options, refines your numbers and tells you exactly what to do next.
Point 3
We do the heavy lifting. We prepare and submit your application, chase the lender and keep you updated until disbursement.
Point 4
Help finding the right home. Tell us your budget and preferred location. We'll find and verify suitable properties so you get real value for your money.

Advisors teaser, diaspora band, education band, FAQ and closing
Element
Copy
Advisors title
Meet the people who'll walk with you
Advisors body
Every HomeFi Mortgage Advisor is vetted by our team. See their track record and verified reviews, then pick the one who fits you.
Advisors cards
3 live advisor cards (photo, name, specialism, rating, "Next available")
Advisors button
Browse advisors
Testimonials title
What applicants say
Testimonials rule
Show only real, verified reviews from completed sessions, with the reviewer's consent. If there are fewer than 3, hide the section. Never write or seed testimonials.
Diaspora title
Living abroad? Buy at home without flying home.
Diaspora body
Tell us what you earn in pounds, dollars, euros or any currency. We convert at today's rate and test your numbers against a weaker rate, so your estimate still holds if the Naira moves. Your advisor meets you on video, in your time zone.
Diaspora button
See the diaspora path
Education title
Mortgage na wetin?
Education body
Our 7-part series explains mortgages in Nigeria in plain language: NHF, MREIF, equity, what lenders look for, and how to avoid the common mistakes.
Education button
Start learning
FAQ teaser
4 questions from the FAQ page, then "See all questions"
Closing title
Your home is closer than you think.
Closing body
Find out what you can afford in under 5 minutes. It's free, and there's no obligation.
Closing button
Get Prequalified

Page copy: Prequalification flow
Four steps, one topic per step. On mobile each step is one screen with the button pinned to the bottom. Every answer is saved as the user moves on. The form never asks for anything the engine, the report or the advisor does not use.
Element
Copy
Page title
Let's see what you can get
Intro
Answer a few quick questions. We only use your answers to prepare your mortgage estimate and report.
Progress bar
Step {n} of 4 · About {m} minutes left
Back link
Back
Next button
Continue (steps 1 to 3), Get Prequalified (step 4)
Save note
Your answers are saved on this device as you go.

Step 1 of 4: About you
Step heading: "First, a little about you". Helper: "This helps us check which schemes you qualify for."
Field key
Label and options
Helper or placeholder
Rules and error message
first_name, last_name, other_names
First name / Surname / Other names (optional)
As they appear on your ID
Required (first and surname). 2 to 50 letters. "Please enter your first name."
age
How old are you?
e.g. 34
Required, whole number 18 to 65. "You need to be between 18 and 65 to apply." Above 55: show note "Lenders limit how long you can repay, so your estimate will reflect a shorter term."
nationality
Nationality: Nigerian (first, preselected) · Dual citizen (Nigerian and another) · Other (searchable country list)

Required. If "Other": show "Some schemes like NHF are only for Nigerians. We'll show you the options that fit."
residence
Where do you live now? In Nigeria · Outside Nigeria (diaspora)

Required.
residence_state
State of residence (if in Nigeria)
Choose your state
Dropdown of 36 states and FCT. Required if in Nigeria.
residence_country, residence_city
Country and city (if outside Nigeria)
e.g. United Kingdom, Manchester
Country dropdown required; city optional.
phone
Phone number (WhatsApp preferred)
+234 801 234 5678
Required. Country code picker defaults from residence. Validate with libphonenumber; store E.164. "Please check your phone number, including the country code."
title
Title: Mr · Mrs · Ms · Dr · Prefer not to say
We use this to address you in your report
Optional.
marital_status
Marital status: Single · Married · Divorced · Separated · Widowed

Required.
is_joint
Are you applying with your spouse or partner? Yes, jointly · No, just me
Applying together can increase what you can access
Required. "Yes" reveals co-applicant fields in step 2.

Step 2 of 4: Your income
Step heading: "Now, your income". Helper: "Use your take-home pay after tax. An exact figure gives you a more accurate estimate."
Field key
Label and options
Helper or placeholder
Rules and error message
income_source
How do you earn? Salaried (government) · Salaried (private) · Self-employed or business owner · Both salary and business · Part-time or contract · Pension · Other

Required. Self-employed shows: "Lenders accept business income. Your advisor will tell you which statements to prepare."
income_currency
Currency: NGN (default in Nigeria), GBP, USD, CAD, EUR, AED, Other

Required. Default from residence country.
monthly_income
Average monthly take-home income
₦ 0
Required, whole number above 0. Numeric keyboard; live thousand separators. Below ₦70,000 equivalent: "Please check this figure. It should be your monthly, not weekly, income."
existing_obligations
Monthly loan repayments you already make (if any)
₦ 0
Optional, defaults to 0. Helper: "Car loans, salary advances, other mortgages."
co_income_source, co_monthly_income, co_currency
Your spouse or partner's income source and monthly take-home income (if joint)

Required if joint. Same rules as above.
nhf_contributor
Do you contribute to the National Housing Fund (NHF)? Yes · No · Not sure
Usually 2.5% of your salary, deducted by your employer
Required for residents. Hidden for diaspora (NHF Diaspora is explained in results instead).
has_rsa
Do you have a pension (RSA) account? Yes · No · Not sure
You may be able to use part of it towards your deposit
Required.
equity_available
How much could you put down as a deposit today?
₦ 0
Optional. Helper: "Most lenders ask for at least 10% of the property price."

Step 3 of 4: The home you want
Step heading: "Tell us about the home you want". Helper: "Not sure yet? That's fine. Pick the closest option."
Field key
Label and options
Helper or placeholder
Rules and error message
property_type
What type of property? Flat or apartment · Terrace · Semi-detached duplex · Detached duplex · Bungalow · Land to build on · Not sure yet

Required. Shown as large tappable tiles with icons.
intended_use
What is it for? To live in · To rent out · For family · Other

Required.
preferred_state, preferred_city
Where do you want to buy? State, then city or area
e.g. FCT, Lugbe
State required (multi-select up to 3); city or area optional.
target_value
What is your budget for the property? Below ₦10m · ₦10m to ₦20m · ₦20m to ₦30m · ₦30m to ₦50m · ₦50m to ₦75m · ₦75m to ₦100m · Above ₦100m · I have an exact price

Required. "Exact price" reveals a number field.
property_status
Have you found the property? Yes, I've found it · Still looking · I'd like HomeFi to find one for me

Required. Drives the 3% or 4% fee wording in the report.
timeline
When would you like to move or buy? Within 3 months · 3 to 6 months · 6 to 12 months · Over 12 months · Just exploring

Required.

Step 4 of 4: Final details
Step heading: "Almost done". Helper: "Two last questions, then your estimate."
Field key
Label and options
Helper or placeholder
Rules and error message
non_interest_preference
Would you prefer a non-interest (Sharia-compliant) option? Yes · No · Open to it

Required. "Yes" switches result wording from "interest" to "profit rate" and adds non-interest partners.
source_channel
How did you hear about HomeFi? Instagram · X (Twitter) · WhatsApp · A friend or family member · Someone I follow online · Google · Event · Other

Optional. Prefill from UTM if present.
notes
Anything else your advisor should know? (optional)
e.g. I already have an offer letter from a developer
Optional, 500 characters.
consent_processing
Checkbox: "I agree that HomeFi can use these details to prepare my mortgage estimate, in line with the Privacy Notice."

Required to submit. Store version and timestamp.
turnstile
Invisible bot check (Cloudflare Turnstile)

Required server-side.

Element
Copy
Submit button
Get Prequalified
Under button
Free. No credit check. This does not affect your chances with any lender.

Page copy: Your estimate (result screen)
Loading state (2 to 4 seconds)
Rotate three lines with a progress animation of the Roofspan mark:
	•	Checking your income against lender rules…
	•	Comparing NHF, MREIF and commercial options…
	•	Preparing your estimate…
Main result
Element
Copy
Headline
{FirstName}, you could access up to {headline_amount}.
Supporting line
Based on a monthly take-home income of {assessed_income} and repayments of no more than a third of it ({affordable_monthly} a month).
Card 1 title
FG concessionary mortgages
Card 1 tag
Lowest rates · Longer to process
Card 1 rows (per product)
{product_name} · {rate}% a year · up to {years} years
You could borrow: {max_loan}
Monthly repayment from: {first_monthly_repayment}
Property value you can target: up to {max_property_value}
Deposit (10% equity): {equity_required}
Card 2 title
Commercial mortgages (PMBs and banks)
Card 2 tag
Higher rates · Often faster
Card 2 rows
Typical rates: {rate_low}% to {rate_high}% a year · up to {years} years
You could borrow: {loan_at_high_rate} to {loan_at_low_rate}
Monthly repayment from: {first_monthly_repayment}
Insight box title
What this means for you
Insight box body (rules-based)
One to three sentences chosen by rules. Example: "NHF gives you the most for your money, but it is capped at ₦50m. For the ₦75m to ₦100m home you want, MREIF or a joint application gets you closer."
Disclaimer (always visible)
This is an estimate based on what you told us. It is not a loan offer or an approval. Final terms depend on each lender's checks, your documents and the property.

Example with the rules in this brief: a salaried applicant earning ₦1,000,000 a month at age 35 sees "You could access up to ₦34,610,000" (NHF), MREIF up to ₦26,130,000, and a commercial range of ₦10,900,000 to ₦13,950,000. Displayed amounts are rounded down to the nearest ₦10,000.
The PDF prompt
Element
Copy
Card title
Want your full report as a PDF?
Body
Your free Mortgage Prequalification Report breaks down each option, the deposit you'll need, the documents lenders will ask for and your next steps. Create a free account and we'll email it to you in a few minutes.
Primary button
Yes, send my report
Secondary button
Not now
After "Not now"
No problem. Your estimate is saved on this device for 30 days. When you're ready, you can get the full report or talk to an advisor.
[Get my report] [Talk to an advisor]
Exit intent (desktop) or back button (mobile)
Before you go: get your full report free, so you have your numbers when you speak to a bank. [Send my report]

Result variants
Situation
Trigger
Copy
Low income
Best loan below the admin-set minimum (default ₦5,000,000)
Headline: "Let's find your way in." Body: "On your current income alone, a mortgage would be small. Applying jointly, saving a bigger deposit, or a rent-to-own plan can change that. An advisor can show you which works best for you."
NHF cap reached
NHF loan capped at ₦50m
"NHF loans are capped at ₦50m. We've shown how MREIF and commercial options can cover a more expensive home."
Target above estimate
Target value higher than max property value
"The home you want costs more than this estimate covers. A bigger deposit, a joint application or a different location can close the gap of about {gap}."
Age shortens the term
Tenor reduced by age
"Because lenders want loans repaid by about age {max_age}, your term is {years} years. That lowers the amount, but not the rate."
Diaspora
Residence outside Nigeria
"We converted your income at today's rate of {live_rate} and tested it at {stressed_rate}, so your estimate still holds if the Naira moves. The figures above use the safer rate." NHF Diaspora shown in place of NHF.
Not an NHF contributor
nhf_contributor = No or Not sure
NHF card stays, with the note "You'll need to register and contribute to the NHF before applying. Your advisor will guide you."
Non-interest
non_interest_preference = Yes
"Interest" becomes "profit rate"; adds a card: "Non-interest home finance (Ijarah). Your advisor will match you with non-interest banks."
Non-Nigerian
nationality = Other
NHF and NHF Diaspora hidden; commercial card shown with "Eligibility depends on residency status. Your advisor will confirm."

Page copy: Sign up, sign in and verification
Element
Copy
Sign up title
Create your free HomeFi account
Sign up subtitle (from result)
Your report is ready to send. We'll email it to you and keep it safe in your dashboard.
Fields
First name, Surname (prefilled) · Email address · Password · Phone (prefilled)
Email helper
Use an email you check often. Lenders will use it during your application.
Password helper
At least 8 characters, with a number.
Social option
Continue with Google
Consent line
By creating an account you agree to our Terms and Privacy Notice. [Checkbox, optional] Send me mortgage tips and updates.
Button
Create account and send my report
Switch link
Already have an account? Sign in
Sign in title
Welcome back
Sign in subtitle (from result)
Sign in and we'll add this estimate to your account and send your report.
Sign in button
Sign in
Forgot password
Forgot your password? Enter your email and we'll send you a reset link.
Verification
Your report email includes a "Confirm your email" button. Until it is clicked, the dashboard shows a gentle banner: "Please confirm your email so lenders can reach you. [Resend email]". The report is still delivered and downloadable.
Email already registered
There's already an account with this email. [Sign in instead]

Page copy: Applicant dashboard
Element
Copy
Greeting
Welcome, {FirstName}.
Report generating
Your report is on its way. We're preparing your Mortgage Prequalification Report. It usually takes 2 to 3 minutes and we'll email it to {email}.
Report card
1st Mortgage Prequalification Report · Ref {reference_code} · {date}
You could access up to {headline_amount}.
[Download PDF] [Email it again] [View estimate]
Report failed checks (internal)
Your report is being reviewed by our team to make sure every figure is right. You'll have it within 24 hours.
Next step card
Book your 1-on-1 Mortgage Advisory Session. 30 minutes with a HomeFi Mortgage Advisor. You'll get:
A walk through your report and the options that suit you best
A more precise 2nd report based on your exact income
Advice on the right property in your preferred location
Your exact next steps to get approved faster
[Choose my advisor]
Progress tracker
Prequalified → Advisory session → Documents → Submitted to lender → Offer letter → Keys
Tracker helper
You are here: {stage}. Next: {next_stage_hint}
Upcoming session card
Your session with {advisor_name} · {date}, {time} ({timezone}) · [Join call] [Reschedule]
Empty state (no application)
You haven't been prequalified yet. It takes under 5 minutes. [Get Prequalified]
Retake link
Circumstances changed? Start a new estimate

Page copy: Mortgage advisors and booking
Directory (/advisors)
Element
Copy
Title
Find your Mortgage Advisor
Subtitle
Every advisor on HomeFi is vetted by our team. Choose the one who fits your situation and book a 30 minute 1-on-1 session.
Filters
Specialism (Diaspora, Self-employed, Joint applications, NHF, MREIF, Non-interest, First-time buyers) · Location covered · Language (English, Yoruba, Hausa, Igbo, Pidgin) · Available this week
Sort
Recommended for you (default when signed in) · Highest rated · Most mortgages processed · Soonest available
Card
Photo · {name} · {headline}
Chips: {specialisms}
{mortgages_processed} mortgages processed · {approval_rate}% approval rate
★ {avg_rating} ({review_count} verified reviews)
Next available: {next_slot}
Session: USD 25 · 30 minutes
[Book session] [View profile]
New advisor card
Replace track record line with "New to HomeFi" when the advisor has fewer than 5 decided cases. Never show 0% or 100% on small numbers.
Recommended badge
Recommended for you
Empty filter result
No advisor matches all your filters right now. [Clear filters] or [See all advisors]

Advisor profile (/advisors/:slug)
Element
Copy
Header
Photo · {name} · {headline} · ★ {avg_rating} ({review_count}) · [Book a session]
About
{bio_long} (150 to 300 words, written by the advisor, edited by HomeFi)
Specialisms
Chips, plus "Covers: {states}" and "Speaks: {languages}"
Track record (with info icons)
Mortgages processed: applications this advisor took to a lender decision through HomeFi.
Approval rate: approved ÷ decided. Shown after 5 decisions.
Sessions held: completed advisory sessions on HomeFi.
Years of experience: stated by the advisor and checked by HomeFi.
Credentials
Verified badges for checked credentials, e.g. professional membership or certification [Confirm list]. Badge tooltip: "Checked by HomeFi on {date}."
Reviews
Title: "Verified reviews". Each review: rating, title, text, first name and last initial, location, month. Label: "Verified session".
Availability
Next 14 days of open slots in the visitor's time zone, with WAT shown alongside.
Sticky booking bar (mobile)
USD 25 · 30 min · [Book session]

Review and track record integrity
A review can only be written by the applicant who completed a session with that advisor, once per session, from a link in the post-session email. Reviews are moderated for abuse and personal data, not for being negative.
Track record numbers are computed from platform data (sessions and mortgage cases), never typed in by hand. Advisors cannot edit them.
Reviews and stats from before the platform launch are not imported unless they can be tied to a real session record.

Booking flow (/app/book/:advisorSlug)
Element
Copy
Step 1 title
Pick a time with {advisor_first_name}
Step 1 helper
Times are shown in your time zone ({timezone}).
Step 2 title
Confirm your session
Step 2 fields
Which report should {advisor_first_name} review? {reference_code} (preselected)
What would you most like to discuss? (optional, 300 characters)
How would you like to meet? Google Meet · Phone or WhatsApp call
Step 2 summary
1-on-1 Mortgage Advisory Session · 30 minutes · {date}, {time}
Total: USD 25 (or ₦{ngn_price} for Nigerian cards) [Confirm Naira price]
Step 2 button
Pay and book
Hold note
We're holding this time for you for 10 minutes.
Success title
You're booked!
Success body
{advisor_name} will see you on {date} at {time} ({timezone}). We've sent the invite and meeting link to {email}. {advisor_first_name} already has your report, so you can get straight to your questions.
Success button
Add to calendar · Go to dashboard
Payment failed
Your payment didn't go through, and you haven't been charged. [Try again] or use another card.
Slot taken
Someone just booked that time. Please pick another.

Page copy: Supporting pages
How it works
Element
Copy
Title
How HomeFi works
Intro
Getting a mortgage in Nigeria usually means visiting bank after bank and filling the same forms. With HomeFi, you apply once, get expert guidance and let us handle the lender.
Stages
Same 4 steps as Home, each with a short "What you'll need" list:
Step 1: nothing but your income figure.
Step 2: an email address.
Step 3: 30 minutes and your questions.
Step 4: ID, proof of income, bank statements and property documents (your advisor gives you the exact list).
Timeline note
Concessionary schemes like NHF can take longer than commercial loans. Your advisor will tell you what to expect for your option.

Mortgage options hub and detail pages
Each option page follows the same template so they are easy to compare: What it is · Rate and limits · Who qualifies · Pros and trade-offs · Documents · How HomeFi helps · [Check if you qualify]. Rates and limits on these pages are read from the rate_products table, so one admin change updates the site, the engine and the reports together.
Option
Headline copy
Key facts block (from rate_products)
NHF
The lowest mortgage rate in Nigeria, for NHF contributors.
6% a year · up to ₦50,000,000 · up to 18 years in our estimates [Confirm tenor]
NHF Diaspora
The FMBN route for Nigerians earning abroad.
Same NHF pricing, with diaspora eligibility rules [Confirm details with FMBN]
MREIF
Single-digit mortgages through partner banks.
9.75% a year · up to 18 years in our estimates [Confirm cap and tenor]
Commercial
More flexibility, faster decisions, higher cost.
Indicative 22% to 30% a year · up to 15 years [Confirm with partner PMBs]
Non-interest
Own your home through a lease-to-own structure.
Ijarah Muntahia Bittamleek · profit rate set by the bank

Diaspora page
Element
Copy
Title
Own a home in Nigeria while you live abroad
Intro
Thousands of Nigerians in the UK, USA, Canada, Europe and the Gulf have asked us the same question: can I buy at home without the stress? Yes. Here's how.
Point 1
Your income, your currency. Tell us what you earn in your currency. We do the conversion.
Point 2
Numbers that survive the exchange rate. We test your estimate at a weaker rate than today's, so you don't plan around a figure that disappears next month.
Point 3
Advice on your schedule. Video sessions at times that work in your time zone.
Point 4
Eyes on the ground. We can search for and verify the property for you, so you don't buy blind.
Button
Get Prequalified from abroad

Pricing and fees
Service
Price
Copy
Mortgage prequalification and 1st report
Free
Your estimate and your first detailed report cost nothing.
1-on-1 Mortgage Advisory Session
USD 25 (30 minutes) [Confirm Naira price]
Includes a review of your report, your most suitable options, and a more precise 2nd report based on your exact income.
Mortgage processing
3% of the Mortgage approved
For processing your mortgage with the lender, from application to disbursement.
Mortgage processing with property search
4% of the Mortgage approved
If we also search for and verify the property on your behalf.

Fee terms copy, shown under the table: "Processing fees are paid in 2 parts: 60% when we start processing your application and 40% when your mortgage is finally approved. Any fee you pay upfront is fully refundable if we cannot secure an appropriate mortgage for you within the agreed period." Fees are always stated as a percentage of the Mortgage approved and never converted to a Naira figure.
FAQ
Question
Answer
Is prequalification the same as approval?
No. Prequalification is an estimate based on what you tell us. Approval comes from the lender after they check your documents and the property.
Will this affect my credit record?
No. We don't run a credit check to give you your estimate.
How do you calculate my estimate?
We assume your mortgage repayment should be no more than a third of your monthly take-home income, then apply each scheme's rate, term and limits. Your advisor refines it with your exact details.
What is equity?
Your deposit: the part of the property price you pay yourself. Most lenders ask for at least 10%.
Can I use my pension (RSA)?
Pension rules allow some contributors to use part of their RSA towards a home deposit. Your advisor will check whether it applies to you.
Can I apply with my spouse?
Yes. Choose "apply jointly" and add their income. A joint application can increase what you can access.
I'm self-employed. Can I still get a mortgage?
Yes. Lenders look at your business income and statements instead of payslips. Your advisor will tell you what to prepare.
I live abroad. Can I apply?
Yes. Enter your income in your currency. NHF Diaspora, MREIF and commercial options may be open to you.
Do you have non-interest options?
Yes. Choose the non-interest preference and we'll show Ijarah-based options from non-interest banks.
What does the advisory session cost?
USD 25 for 30 minutes, including your 2nd, more precise report.
How do you make money?
From the advisory session and a processing fee of 3% or 4% of the Mortgage approved, paid only as described on our Pricing page, with refunds if we can't secure an appropriate mortgage within the agreed period.
Is my data safe?
We use your details only to prepare your estimate and process your mortgage, and we share them with a lender only when you ask us to. See our Privacy Notice.

About and Contact
Element
Copy
About title
Why we started HomeFi
About body
Fewer than 1 in 10 Nigerian home buyers use a mortgage. Most pay from savings or gratuity, or stay renting, often because nobody showed them the options. HomeFi started with a family story about mortgage terms that could have been better with a simple comparison. We built the comparison, and then the team to carry people through the whole process. [DT to refine the founding story in his own words]
Mission
Help 1 million Nigerians, at home and abroad, access the right mortgage.
Team and advisory board
DT (Co-Founder and Product Lead) · Semiloore Akilo (Head of Engineering) · Advisory: Dr. Ayobami Oladejo, Mr. Korede Asunni
Contact title
Talk to us
Contact body
Email support.homefi@gmail.com · Call or WhatsApp +234 802 537 9001 · Abuja, Nigeria. We reply within 1 working day.
Contact form
Name · Email · Phone · Topic (My estimate, My report, Advisory session, Fees, Partnerships, Other) · Message · [Send message]

Emails and notifications
Sender: "HomeFi Advisory Team <support@homefi.ng>" with reply-to support.homefi@gmail.com until a domain inbox exists [Confirm]. All emails use the navy header with the white and gold logo, one gold button, and a footer with the company line and unsubscribe for marketing mail.
Email
Trigger
Subject and preheader
Body summary
Report delivery
Report status = ready
Subject: Your Mortgage Prequalification Report is here, {FirstName}
Preheader: You could access up to {headline_amount}. Your full breakdown is attached.
Hi {FirstName}, thank you for prequalifying with HomeFi. Your 1st Mortgage Prequalification Report (Ref {reference_code}) is attached and saved in your dashboard. [Confirm your email] Next step: Book a 1-on-1 Advisory call Here (link on "Here").
Booking confirmed
Payment success and Cal.com booking created
Subject: You're booked with {advisor_name} on {date}
Date, time in their time zone and WAT, meeting link, what to prepare (report, latest payslip or statement), reschedule link.
Reminder
24 hours and 1 hour before
Subject: Tomorrow: your mortgage session with {advisor_first_name} / Starting in 1 hour
Short reminder with the join link.
Abandoned booking
Session left at pending_payment for 2 hours
Subject: Don't air me!
Preheader: Your advisory session is still waiting for you
Adapted from the current Mainstack copy: "We noticed you started booking your 1-on-1 Mortgage Advisory Session today… If something stopped you, just reply to this email." [Finish booking]
Report not opened
3 days after delivery with no open or download
Subject: Your mortgage numbers are waiting
One-line summary of the headline amount and a link to the dashboard.
2nd report ready
Advisor publishes Report 2
Subject: Your precise (2nd) Mortgage Prequalification Report
Attached report and the agreed next steps from the session.
Review request
2 hours after the session ends
Subject: How was your session with {advisor_first_name}?
1 to 5 star buttons in the email that open the review form.
Password reset, email confirmation
User action
Standard
Standard

Phase 2: the same delivery and reminder messages on WhatsApp through the WhatsApp Business API, only for users who opt in.
System messages and empty states
Situation
Message
Network lost during the form
You seem to be offline. Your answers are saved; we'll continue when you're back.
Server error on submit
Something went wrong on our side. Your answers are safe. [Try again]
Too many attempts (rate limit)
You've tried a few times in a row. Please wait a minute and try again.
Session expired
For your security, please sign in again. Your estimate is still here.
Report email bounced
We couldn't deliver your report to {email}. Please check it in Settings, and we'll resend.
404
This page has moved or doesn't exist. [Go home] [Get Prequalified]
No sessions yet
No sessions booked yet. A 30 minute session is the fastest way to know your next step. [Choose my advisor]
Advisor fully booked
{advisor_first_name} is fully booked for the next 14 days. [See similar advisors]

Responsive design and accessibility
	•	Mobile first. Design at 360px wide first, then 768px (tablet), 1024px (laptop) and 1440px (desktop). Most traffic arrives from Instagram, X and WhatsApp on Android phones.
	•	Performance budget. Largest Contentful Paint under 2.5 seconds on a mid-range Android over 4G; JavaScript for the form under 150 KB gzipped; images in WebP or AVIF with fixed dimensions.
	•	Form ergonomics. One column; labels above fields; tap targets at least 44px; inputmode="numeric" for money and age; live thousand separators; the primary button pinned to the bottom of the viewport on mobile.
	•	Result layout. Cards stack on mobile with the headline amount first; side by side from 1024px.
	•	Accessibility. WCAG 2.1 AA: colour contrast at least 4.5:1 (gold buttons use navy text, never white), visible focus states, all inputs labelled, errors announced to screen readers, the loading state announced with aria-live.
	•	Resilience. Drafts saved to the server after each step and to local storage between steps, so a dropped connection never loses answers.
	•	SEO. Server-rendered public pages, unique titles and descriptions, FAQ structured data on /faq, clean slugs for option and Learn pages, Open Graph images that show the brand on WhatsApp shares.
System architecture
The recommended stack keeps the tools already in the HomeFi budget (Supabase, Replit, Claude) and adds only what the journey needs. It favours managed services so a small team can run it.
Layer
Recommended choice
Role
Web front end
Next.js (App Router, TypeScript), Tailwind CSS, hosted on Vercel or Replit Deployments
Public pages (server-rendered for SEO), prequalification flow, dashboard, advisor portal, admin
Backend API
Next.js route handlers plus Supabase Edge Functions for webhooks and jobs
Validation, engine, claims, bookings, webhooks
Database
Supabase PostgreSQL with Row Level Security
All records in Appendix A
Auth
Supabase Auth (email and password, Google)
Users, sessions, password reset, roles in profiles.role
File storage
Supabase Storage, private bucket "reports"
PDFs, advisor photos (public bucket), Phase 2 documents
Job queue
Supabase Queues (pgmq) with a scheduled worker, or Inngest
Report generation, emails, reminders, retries
PDF rendering
Headless Chrome (Puppeteer or Playwright) in a container worker
Renders the existing branded HTML report template. The team already uses Chrome headless because wkhtmltopdf had a DPI scaling bug.
AI
Claude API with structured JSON output
Report narrative only (insight, recommended path, notes). Never the numbers.
Scheduling
Cal.com (existing account), API v2
Advisor availability, bookings, reschedules, meeting links
Payments
Paystack (NGN and international cards)
Advisory session payments; later, processing fee tranches
Email
Resend, Postmark or ZeptoMail, sending from homefi.ng with SPF, DKIM and DMARC
Transactional email with PDF attachments and delivery webhooks
FX rates
A daily rates feed, plus an admin override per currency
Diaspora conversion and stressed rate
Analytics and monitoring
PostHog or GA4, Sentry, uptime checks
Funnel metrics, errors, alerts
Bot protection
Cloudflare Turnstile and rate limits
Protects the anonymous submit endpoint

How the parts talk to each other
	•	Browser → POST /api/v1/prequal/applications (anonymous token in a cookie). The API validates, saves, runs the engine synchronously and returns results in under 1 second.
	•	Browser → Supabase Auth (sign up or sign in) → POST /api/v1/prequal/applications/:id/claim. The API links the application to the user and enqueues a "generate_report" job.
	•	Worker picks up the job: loads the application and results → calls Claude for narrative JSON → fills the HTML template → Chrome renders the PDF → runs automated checks → uploads to Storage → enqueues "send_report_email".
	•	Email worker sends the email with the PDF attached and a signed dashboard link; the email provider's webhook updates delivery status.
	•	Booking: browser → GET slots (API proxies Cal.com) → POST /api/v1/sessions (creates a pending session and a Paystack transaction) → Paystack checkout → Paystack webhook → API verifies payment → creates the Cal.com booking → session confirmed → confirmation email.
	•	Cal.com webhooks keep sessions in sync (reschedule, cancel, meeting ended). "Meeting ended" schedules the review request and opens the advisor's Report 2 task.
Environments
Three environments: local, staging (test keys for Paystack, Cal.com test event types, email sandbox) and production. Database changes go through versioned migrations in the repository. Engine settings and rates are data, not code, so they change in the admin without a release.
Prequalification engine
The engine is deterministic code. Given the same application and the same engine version, it always returns the same numbers. AI is used later for wording in the report, and every figure in the report comes from this engine.
Inputs and settings
Setting
Current value
Where it lives
Affordability ratio
1/3 of assessed monthly take-home income goes to the monthly repayment (stored as numerator 1, denominator 3 to avoid rounding drift)
engine_settings
Existing obligations
Subtracted from the affordable repayment before sizing the loan [Confirm; recommended]
engine_settings.deduct_obligations
Repayment method
Equal principal (straight-line), matching the HomeFi Multi-Plan Mortgage and Amortization Model 2026 [Confirm against the current report generator]
engine_settings.repayment_method
Maximum age at end of term
60 [Confirm per product]
engine_settings and rate_products.eligibility
Standard equity (deposit)
10% of property value
rate_products.equity_pct
NHF and NHF Diaspora
6% a year, 18 years, loan cap ₦50,000,000
rate_products
MREIF
9.75% a year, 18 years, no cap in the current HomeFi rule. Press coverage of partner bank launches mentions up to ₦100m over 20 years [Confirm]
rate_products
Commercial range
Indicative 22% (low) to 30% (high) a year, 15 years [Confirm with partner PMBs]
rate_products (rate_min, rate_max)
FX stress
Admin-set stressed rate per currency, or a default haircut of 13% below the live rate
fx_rates, engine_settings
Minimum useful loan
₦5,000,000; below this, show the low income variant
engine_settings

Calculation steps
	•	Assessed income (I). Primary income plus co-applicant income for joint applications. Convert non-Naira income at the stressed rate for the headline (and at the live rate for the "base" scenario stored alongside). Legacy range answers use the sum of lower bounds and the sum of upper bounds as two scenarios.
	•	Affordable monthly repayment (A). A = floor(I × 1 ÷ 3) − existing obligations (if deduction is on). If A ≤ 0, mark every product ineligible and use the low income variant.
	•	Term (n months). years = min(product max tenor, max age at end of term − age). If years < 5, the product is ineligible for this applicant. n = years × 12.
	•	Maximum loan (P). With monthly rate i = annual rate ÷ 12 and equal principal repayment, the first month is the largest payment: P ÷ n + P × i. Setting it equal to A gives P = A ÷ (1 ÷ n + i). Compute in exact decimal arithmetic (PostgreSQL numeric or decimal.js), not binary floating point, as P = A × 12n ÷ (12 + n × annual rate), then floor to whole Naira; floats can land 1 Naira below the fixtures. If P exceeds the product cap, P = cap and capped = true.
	•	First monthly repayment. P ÷ n + P × i (equal to A unless capped). Show as "from" because payments fall each month under equal principal.
	•	Property value and equity. Max property value V = floor(P ÷ (1 − equity %)). Equity required = V − P.
	•	Commercial range. Run step 4 at rate_min and rate_max. Show "{P at rate_max} to {P at rate_min}".
	•	Headline amount. The largest P among eligible concessionary products; if none, the commercial P at rate_min.
	•	Eligibility flags. NHF only for Nigerian or dual nationals resident in Nigeria; NHF Diaspora only for Nigerians resident abroad; a note (not exclusion) when nhf_contributor is No or Not sure; non-interest card when preferred.
	•	Fee wording for the report. property_status = found → "3% of the Mortgage approved"; otherwise → "4% of the Mortgage approved".
	•	Residence label. Use the chosen country. If the country is "Other" or blank, infer it from a non-Nigerian phone country code (for example +61 → Australia); otherwise show "Outside of Nigeria".
Worked example (Applicant A in Appendix C)
Income ₦1,000,000 a month, age 35, salaried in Lagos. A = ₦333,333. Both concessionary products run for 18 years (216 months).
NHF: P = ₦333,333 ÷ (1/216 + 0.005) = ₦34,615,350, below the ₦50m cap. Property value up to ₦38,461,500, equity ₦3,846,150.
MREIF: P = ₦333,333 ÷ (1/216 + 0.008125) = ₦26,134,275. Property value up to ₦29,038,083.
Commercial (15 years): ₦10,909,080 at 30% to ₦13,953,474 at 22%. Headline: "up to ₦34,610,000".

Engine versions are immutable. Each change to a setting or a rate creates a new engine version, and every stored result records the version it used, so any old report can be explained and reproduced.
Report generation pipeline
The pipeline replaces the CSV export, the manual AI run and the manual email. It reuses the existing 6 page report design so applicants see no change in quality.
Stage
What happens
Failure handling
1. Queue
Claim creates a reports row (report_number 1, status queued) and a generate_report job.
Job retries 3 times with backoff.
2. Narrative
Claude receives the application, the engine results and the house rules (voice, fee wording, disclaimer) and returns JSON: profile_summary, insight, recommended_path, next_steps[], notes[]. The prompt forbids new numbers; numbers are inserted by the template.
If the JSON fails schema validation, retry once, then fall back to rule-based wording.
3. Render
Fill the HTML template: navy cover with logo; Section 1 Applicant Profile and Basis of Assessment; Sections 2 and 3 scenario cards and equity tables against target values; Section 4 Recommended Path and Next Steps; Section 5 Important Notes and Disclaimer. Chrome prints A4 PDF.
Render timeout 30 seconds; retry.
4. Checks
Automated checks: joint incomes summed correctly; every figure in the PDF text matches the stored results; insight names a product that is shown; fee wording is 3% or 4% and never a Naira figure; residence label follows the rule; page count is 6; both links present (dashboard and "Here" booking link); reference code and file name follow the format.
Any failure → status checks_failed, no email, ops alert. The dashboard shows the "being reviewed" message.
5. Store
Upload to reports/{user_id}/{reference_code}.pdf; save page count, checks JSON, AI model and prompt version.

6. Email
Send the delivery email with the PDF attached (and a signed dashboard link valid 7 days).
Bounce → status email_failed and in-app banner.

Report 2 (the precise report after the advisory session) uses the same pipeline with report_number 2. The advisor enters exact figures and notes in the advisor portal, previews the PDF, and publishes it.
Data model
Money is stored as integers in minor units (kobo for Naira, pence or cents for other currencies) with a currency code. Timestamps are UTC (timestamptz). IDs are UUIDs. The full SQL is in Appendix A; this section explains each table.
Table
Purpose
Key fields
profiles
One row per signed-up user (extends auth.users)
id, first_name, last_name, phone_e164, title, role (applicant, advisor, admin, ops), marketing_opt_in
applications
One prequalification submission
id, reference_code, user_id (null until claimed), anon_token_hash, status, is_joint, nationality, residence, residence_country, residence_state, property fields, timeline, equity_available_kobo, has_rsa, nhf_contributor, non_interest_preference, engine_version, source_channel, utm, legacy_source, legacy_row_index
applicants
People on an application (primary and co-applicant)
application_id, role, full_name, age, marital_status, income_source, monthly_net_income_minor, income_currency, existing_monthly_obligations_minor
rate_products
Mortgage products and their terms
code (NHF, NHF_DIASPORA, MREIF, COMMERCIAL, NON_INTEREST), name, category, rate_min, rate_max, max_tenor_years, loan_cap_kobo, equity_pct, eligibility JSON, active, effective_from
engine_settings
Versioned engine rules
version, affordability_num, affordability_den, deduct_obligations, repayment_method, max_age_at_maturity, fx_haircut, min_useful_loan_kobo, is_current
fx_rates
Daily and stressed exchange rates
currency, live_rate_to_ngn, stressed_rate_to_ngn, source, fetched_at
prequal_results
Engine output per product and scenario
application_id, product_code, scenario (base, stressed, lower, upper), rate_basis (fixed, low, high), interest_rate, tenor_months, assessed_monthly_income_kobo, affordable_monthly_kobo, max_loan_kobo, first_monthly_repayment_kobo, max_property_value_kobo, equity_required_kobo, capped, eligible, notes, engine_version
reports
Generated PDFs
application_id, report_number (1 or 2), reference_code, file_name, storage_path, page_count, status, checks JSON, ai_model, prompt_version, generated_at, emailed_at, created_by
advisors
Public advisor profiles
user_id, slug, display_name, headline, bio_short, bio_long, photo_url, specialisms[], languages[], states_covered[], years_experience, credentials JSON, cal_event_type_id, price_usd_cents, price_ngn_kobo, status, verified_at
lenders
PMBs, banks, FMBN and partner institutions
name, type, licence_no, active
mortgage_cases
An application taken forward with a lender (source of advisor track record)
application_id, advisor_id, lender_id, product_code, stage, loan_amount_kobo, decided_at, disbursed_at
advisory_sessions
Booked sessions
user_id, advisor_id, application_id, report_id, cal_booking_uid, start_at, end_at, timezone, meeting_url, topic, status, payment_id
payments
Payment records
user_id, provider, provider_reference, purpose, amount_minor, currency, status, raw JSON, paid_at
reviews
Verified reviews
session_id (unique), user_id, advisor_id, rating 1 to 5, title, body, status, published_at
consents
Consent log
user_id or application_id, consent_type, version, granted, ip, user_agent, created_at
notifications
Every email or message sent
user_id, application_id, channel, template, provider_message_id, status, created_at
audit_log
Admin and system changes
actor_id, action, entity, entity_id, diff JSON, created_at
advisor_stats (view)
Computed track record
sessions_completed, mortgages_decided, mortgages_approved, approval_rate (null below 5 decisions), avg_rating, review_count

Status models
Entity
States, in order
Notes
applications.status
draft → submitted → estimated → claimed → report_sent → advisory_booked → in_processing → closed
abandoned is set by a nightly job for drafts older than 30 days
reports.status
queued → generating → ready → emailed
checks_failed and email_failed are side states that need ops action
advisory_sessions.status
pending_payment → confirmed → completed
Also rescheduled, cancelled, no_show, refunded. pending_payment expires after 10 minutes and releases the slot.
payments.status
initialised → success
Also failed, refunded
mortgage_cases.stage
documents → submitted_to_lender → offer_received → property_appraisal → underwriting → approved → disbursed
Also declined, withdrawn. approved and declined count as "decided".
reviews.status
pending → published
Also rejected (abuse or personal data only)

API
REST over HTTPS under /api/v1, JSON bodies, money as integers in minor units. Authenticated calls use the Supabase session JWT. Anonymous prequalification calls use the anon token cookie. Errors return { "error": { "code", "message", "fields" } } with the right HTTP status.
Method and path
Auth
What it does
POST /prequal/applications
Anon + Turnstile
Create or update a draft (step saves). Returns { applicationId, step }.
POST /prequal/applications/:id/submit
Anon or user
Validate everything, run the engine, return results (Appendix B).
GET /prequal/applications/:id
Anon token owner or user owner
Application and latest results.
POST /prequal/applications/:id/claim
User
Body { anonToken }. Links to user, records consent, queues Report 1. Idempotent.
POST /prequal/applications/:id/report/resend
User
Re-sends the latest ready report. Limit 3 per day.
GET /reports/:id/download
User owner, assigned advisor, admin
Returns a signed URL valid 15 minutes.
GET /me/dashboard
User
Profile, applications, reports, sessions, tracker stage.
GET /advisors
Public
Filters: specialism, state, language, availableWithinDays; sort; pagination. Returns profile and stats.
GET /advisors/:slug
Public
Full profile, stats, published reviews.
GET /advisors/:slug/slots?from&to&tz
Public
Proxies Cal.com availability; cached 60 seconds.
GET /advisors/recommended?applicationId
User
Advisors ranked by match score for this application.
POST /sessions
User
Body { advisorId, start, applicationId, topic, meetingType, currency }. Creates pending session, holds slot, initialises Paystack. Returns { sessionId, authorizationUrl }.
POST /sessions/:id/cancel, /reschedule
User
Follows the cancellation policy [Confirm refund window].
POST /sessions/:id/review
User (session owner, completed only)
Body { rating, title, body }. One per session.
POST /webhooks/paystack
Signature
Verifies x-paystack-signature (HMAC SHA512), then verifies the transaction by API before confirming.
POST /webhooks/cal
Signature
Booking created, rescheduled, cancelled, meeting ended.
POST /webhooks/email
Signature
Delivered, opened, bounced, complained.
Advisor: GET /advisor/sessions, PUT /advisor/sessions/:id/notes, POST /advisor/reports (Report 2), PUT /advisor/profile
Advisor role
Advisor portal actions
Admin: CRUD /admin/rate-products, /admin/engine-settings, /admin/advisors (approve, suspend), /admin/reviews (moderate), /admin/reports (retry, override), GET /admin/applications.csv
Admin role
Every change written to audit_log

Advisor match score
Used for "Recommended for you". Score out of 100: specialism fit 40 (diaspora, self-employed, joint, non-interest, NHF or MREIF matched to the application), state covered 20, language 10, availability within 3 days 15, average rating 10, approval rate 5 (0 for new advisors). Ties break on soonest slot. Weights live in engine_settings so they can be tuned.
Integrations and webhooks
Service
Use
Notes for the developer
Cal.com
Each advisor has a Cal.com user and a 30 minute event type. HomeFi reads slots and creates bookings through API v2, and listens to webhooks.
Store cal_event_type_id per advisor. Create the booking only after payment succeeds. The existing link (https://cal.com/mortgageadvisorysessionwithomefi/30min) stays live as a fallback during migration.
Paystack
Session payments; later, processing fee tranches (60% and 40%).
Initialise a transaction with metadata { sessionId }. Confirm only on a verified charge.success. Refunds through the Paystack refund API with a payments row update.
Mainstack
Current product page for the session (https://mainstack.com/p/mortgage-advisory-session-wt-homefi).
Keep during Phase 1 rollout for links already sent in old reports; redirect to /advisors once on-site booking is live.
Email provider
All transactional email.
Verify homefi.ng with SPF, DKIM and DMARC before launch; attachments up to 5 MB.
Claude API
Report narrative JSON.
Use structured output with a JSON schema; log model and prompt version on the report; never send phone numbers or emails to the model.
FX feed
Daily live rates for GBP, USD, CAD, EUR, AED and others.
Admin can override the stressed rate per currency.
Google Forms (legacy)
Existing CSV of past applicants.
One-off import script (see "Moving the existing applicants across").

Security, privacy and compliance
	•	Nigeria Data Protection Act 2023. Collect only what the estimate, report and advisor need; record consent with version and time; publish a Privacy Notice that names the purposes (estimate, report, advisory, mortgage processing), the processors (hosting, email, payments, AI) and how to request access or deletion; register with the NDPC as required [Confirm with counsel].
	•	Row Level Security on every table. Applicants see only their own rows; advisors see applications and reports only for their own sessions; admins see all. The anonymous token is stored hashed and expires after 30 days.
	•	Sensitive data. Income and phone numbers are personal data: encrypt backups, never log request bodies, mask phone numbers in admin lists, and keep PDFs in a private bucket with short-lived signed URLs.
	•	Payments. Card details never touch HomeFi servers (Paystack checkout). Webhooks verified by signature and by server-side verification.
	•	Abuse. Turnstile and rate limits on anonymous endpoints (for example 10 submissions per IP per hour), email verification, and admin alerts on unusual spikes, such as a viral post.
	•	Honest claims. Every number on the site (applicant counts, lender counts, advisor stats) comes from the database or is removed. Reviews are verified as described in the advisors section. The estimate disclaimer appears on results, reports and emails.
	•	Roles. applicant, advisor, ops (report review, support), admin (rates, settings, advisor approval). Two-factor authentication required for advisor, ops and admin accounts.
Analytics events
Event
Properties
prequal_started
source, utm, device
prequal_step_completed
step (1 to 4), seconds_on_step
prequal_submitted
is_joint, residence, income_currency, property_type, target_band
estimate_viewed
headline_band, products_eligible, variant
report_prompt_answered
answer (yes, not_now)
account_created / signed_in
method (email, google), from (result, direct)
report_emailed / report_downloaded / report_opened
report_number, minutes_since_claim
advisors_viewed / advisor_profile_viewed
filters, advisor_id, recommended (true or false)
booking_started / booking_paid / booking_failed
advisor_id, currency, amount
session_completed / review_submitted
advisor_id, rating

Moving the existing applicants across
	•	Export the Google Form responses as CSV and import them into applications and applicants with legacy_source = "google_form_2026" and legacy_row_index = the CSV row index, so the team's row references keep working.
	•	Map range answers to the lower and upper scenarios; map exact income answers (from Applicant 2366 onward, when the form switched to exact figures and currency) to a single scenario.
	•	Apply the clean-up rules the team already uses: email taken from the username field when the email field holds something else; phone numbers kept as submitted when malformed; residence inferred from phone code; names shown in the order the applicant typed them.
	•	Attach reports already sent (PDFs from the team's folders) as report_number 1 where the file can be matched to the row.
	•	Send one "Your HomeFi dashboard is ready" email per legacy applicant with a magic link to create their account and see their report. No marketing content in this email.
	•	Freeze the Google Form with a message pointing to homefi.ng/prequalify once Phase 1 is live.
Delivery phases and acceptance criteria
Phase
Scope
Done when
Phase 1: MVP
Public pages in this brief; prequalification flow; engine; result screen; auth; claim; Report 1 pipeline; dashboard; advisor directory and profiles; booking with Paystack and Cal.com; emails; admin for rates, settings, advisors, reviews and report retries; legacy import.
A new visitor on a mid-range Android gets an estimate in under 5 minutes; Report 1 arrives within 3 minutes of sign up and passes all checks; a paid booking appears in the advisor's Cal.com calendar and the dashboard; rates changed in admin update the site and new estimates without a release; all fixtures in Appendix C pass.
Phase 2: Processing
Advisor portal with Report 2; document upload with checklists by income type; application tracker driven by mortgage_cases; processing fee payments in 2 tranches with refunds; WhatsApp notifications; Learn section CMS.
An applicant can go from Report 2 to "submitted to lender" without leaving the platform, and every advisor stat is computed from real cases.
Phase 3: Property
Property search linked to verified listings (the FindAm / propertyfinder.ng idea), property value checks, developer listings with qualified leads, lender API integrations.
An applicant can pick a verified property that fits their estimate and send it to their advisor in one click.

Open decisions
Decision
Why it matters
Owner
Repayment method for loan sizing (equal principal, as specified, or level annuity)
Annuity sizing gives noticeably higher loan amounts at the same income. The website must match the numbers in reports already sent.
DT and Semi
Commercial rate range and tenor
Shown on every result. Current values are indicative.
DT, with partner PMBs
MREIF cap and tenor (current rule: 18 years, no cap)
Press coverage of bank launches mentions up to ₦100m over 20 years.
DT
Maximum age at end of term, per product
Changes the term and amount for older applicants.
DT
Deduct existing loan repayments from affordability
More accurate estimates; slightly lower amounts.
DT
Session price in Naira and refund or reschedule policy
Needed for checkout and the Pricing page.
DT
Advisor vetting criteria and credentials to verify
Needed before the directory goes live.
DT and advisory board
Sending domain and support inbox (support@homefi.ng)
Email deliverability and trust.
Semi
Live applicant count and lender count for the trust strip
Only verifiable claims go on the site.
DT

Appendix A: Database schema (PostgreSQL)
Supabase flavour. Run as the first migration; add RLS policies in the next migration (examples at the end).
-- HomeFi.ng schema v1 (Phase 1 + tables Phase 2 needs)
create extension if not exists pgcrypto;
 
create type residence_type     as enum ('nigeria','diaspora');
create type income_source_type as enum ('salaried_public','salaried_private','self_employed',
                                        'mixed','part_time_contract','pension','other');
create type application_status as enum ('draft','submitted','estimated','claimed','report_sent',
                                        'advisory_booked','in_processing','closed','abandoned');
create type report_status      as enum ('queued','generating','ready','emailed',
                                        'checks_failed','email_failed');
create type session_status     as enum ('pending_payment','confirmed','rescheduled','completed',
                                        'no_show','cancelled','refunded');
create type payment_status     as enum ('initialised','success','failed','refunded');
create type review_status      as enum ('pending','published','rejected');
create type advisor_status     as enum ('invited','pending_review','approved','suspended');
create type case_stage         as enum ('documents','submitted_to_lender','offer_received',
                                        'property_appraisal','underwriting','approved',
                                        'declined','disbursed','withdrawn');
 
create table profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  first_name       text not null,
  last_name        text not null,
  other_names      text,
  title            text check (title in ('mr','mrs','ms','dr','none')),
  phone_e164       text,
  role             text not null default 'applicant'
                   check (role in ('applicant','advisor','ops','admin')),
  marketing_opt_in boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
 
create table engine_settings (
  version               text primary key,            -- e.g. '2026.11.1'
  affordability_num     smallint not null default 1,
  affordability_den     smallint not null default 3,
  deduct_obligations    boolean  not null default true,
  repayment_method      text not null default 'equal_principal'
                        check (repayment_method in ('equal_principal','annuity')),
  max_age_at_maturity   smallint not null default 60,
  fx_haircut            numeric(5,4) not null default 0.1300,
  min_useful_loan_kobo  bigint not null default 500000000,   -- N5,000,000
  match_weights         jsonb not null default
    '{"specialism":40,"state":20,"language":10,"availability":15,"rating":10,"approval":5}',
  is_current            boolean not null default false,
  created_by            uuid references profiles(id),
  created_at            timestamptz not null default now()
);
create unique index one_current_engine on engine_settings (is_current) where is_current;
 
create table rate_products (
  code             text primary key,  -- NHF, NHF_DIASPORA, MREIF, COMMERCIAL, NON_INTEREST
  name             text not null,
  category         text not null check (category in ('concessionary','commercial','non_interest')),
  rate_min         numeric(6,4) not null,     -- 0.0600
  rate_max         numeric(6,4) not null,     -- equals rate_min for fixed-rate schemes
  max_tenor_years  smallint not null,
  loan_cap_kobo    bigint,                    -- NHF: 5000000000 (N50,000,000)
  equity_pct       numeric(5,4) not null default 0.1000,
  eligibility      jsonb not null default '{}',  -- {"nationality":["NG","NG_DUAL"],"residence":"nigeria"}
  active           boolean not null default true,
  effective_from   date not null default current_date,
  updated_by       uuid references profiles(id),
  updated_at       timestamptz not null default now()
);
 
create table fx_rates (
  currency              char(3) not null,
  live_rate_to_ngn      numeric(14,4) not null,
  stressed_rate_to_ngn  numeric(14,4),          -- admin override; else live * (1 - fx_haircut)
  source                text not null,
  fetched_at            timestamptz not null default now(),
  primary key (currency, fetched_at)
);
 
create table applications (
  id                       uuid primary key default gen_random_uuid(),
  reference_code           text unique,         -- HF-PQ-2026-1122-DO-0042
  user_id                  uuid references profiles(id),
  anon_token_hash          text,                -- sha256(token); cleared on claim
  status                   application_status not null default 'draft',
  is_joint                 boolean not null default false,
  nationality              text not null,       -- 'NG', 'NG_DUAL' or ISO 3166 alpha-2
  residence                residence_type not null,
  residence_country        char(2) not null,
  residence_state          text,
  residence_city           text,
  property_type            text not null check (property_type in ('flat','terrace','semi_detached',
                             'detached','bungalow','land','not_sure')),
  intended_use             text not null check (intended_use in ('live','rent','family','other')),
  preferred_states         text[] not null,
  preferred_city           text,
  target_value_min_kobo    bigint,
  target_value_max_kobo    bigint,
  property_status          text not null check (property_status in ('found','searching','need_help')),
  timeline                 text not null check (timeline in ('lt3m','3to6m','6to12m','gt12m','exploring')),
  equity_available_kobo    bigint not null default 0,
  has_rsa                  text check (has_rsa in ('yes','no','not_sure')),
  nhf_contributor          text check (nhf_contributor in ('yes','no','not_sure')),
  non_interest_preference  text not null check (non_interest_preference in ('yes','no','open')),
  notes                    text check (char_length(notes) <= 500),
  source_channel           text,
  utm                      jsonb,
  engine_version           text references engine_settings(version),
  legacy_source            text,                -- 'google_form_2026'
  legacy_row_index         int,
  submitted_at             timestamptz,
  claimed_at               timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index on applications (user_id);
create index on applications (status, created_at);
 
create table applicants (
  id                                 uuid primary key default gen_random_uuid(),
  application_id                     uuid not null references applications(id) on delete cascade,
  role                               text not null check (role in ('primary','co_applicant')),
  full_name                          text not null,
  age                                smallint check (age between 18 and 70),
  marital_status                     text,
  income_source                      income_source_type not null,
  monthly_net_income_minor           bigint not null check (monthly_net_income_minor > 0),
  income_currency                    char(3) not null default 'NGN',
  existing_monthly_obligations_minor bigint not null default 0,
  legacy_income_band                 text,      -- e.g. '2m_5m' for imported range answers
  unique (application_id, role)
);
 
create table prequal_results (
  id                            uuid primary key default gen_random_uuid(),
  application_id                uuid not null references applications(id) on delete cascade,
  product_code                  text not null references rate_products(code),
  scenario                      text not null check (scenario in ('base','stressed','lower','upper')),
  rate_basis                    text not null check (rate_basis in ('fixed','low','high')),
  interest_rate                 numeric(6,4) not null,
  tenor_months                  smallint not null,
  assessed_monthly_income_kobo  bigint not null,
  affordable_monthly_kobo       bigint not null,
  max_loan_kobo                 bigint not null,
  first_monthly_repayment_kobo  bigint not null,
  max_property_value_kobo       bigint not null,
  equity_required_kobo          bigint not null,
  capped                        boolean not null default false,
  eligible                      boolean not null,
  notes                         text[] not null default '{}',
  engine_version                text not null references engine_settings(version),
  created_at                    timestamptz not null default now()
);
create index on prequal_results (application_id);
 
create table reports (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references applications(id) on delete cascade,
  report_number   smallint not null check (report_number in (1,2)),
  reference_code  text not null,
  file_name       text not null,  -- MortgagePrequalification Report1 [22.Nov.26]_HomeFi-[Surname First-name]
  storage_path    text,
  page_count      smallint,
  status          report_status not null default 'queued',
  checks          jsonb,
  ai_model        text,
  prompt_version  text,
  created_by      uuid references profiles(id),   -- null = system; advisor for Report 2
  generated_at    timestamptz,
  emailed_at      timestamptz,
  created_at      timestamptz not null default now(),
  unique (application_id, report_number)
);
 
create table advisors (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references profiles(id),
  slug              text not null unique,
  display_name      text not null,
  headline          text not null check (char_length(headline) <= 90),
  bio_short         text not null check (char_length(bio_short) <= 280),
  bio_long          text,
  photo_url         text,
  specialisms       text[] not null default '{}',  -- diaspora, self_employed, joint, nhf, mreif, non_interest, first_time
  languages         text[] not null default '{en}',
  states_covered    text[] not null default '{}',
  years_experience  smallint,
  credentials       jsonb not null default '[]',   -- [{"name":"...","verified_at":"..."}]
  cal_username      text,
  cal_event_type_id bigint,
  price_usd_cents   int not null default 2500,
  price_ngn_kobo    bigint,
  status            advisor_status not null default 'invited',
  verified_at       timestamptz,
  created_at        timestamptz not null default now()
);
 
create table lenders (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text not null check (type in ('pmb','commercial_bank','fmbn','non_interest_bank','other')),
  licence_no  text,
  active      boolean not null default true
);
 
create table mortgage_cases (
  id                uuid primary key default gen_random_uuid(),
  application_id    uuid not null references applications(id),
  advisor_id        uuid references advisors(id),
  lender_id         uuid references lenders(id),
  product_code      text references rate_products(code),
  stage             case_stage not null default 'documents',
  loan_amount_kobo  bigint,
  decided_at        timestamptz,
  disbursed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
 
create table payments (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references profiles(id),
  provider            text not null check (provider in ('paystack','stripe')),
  provider_reference  text not null unique,
  purpose             text not null check (purpose in ('advisory_session','processing_fee_t1','processing_fee_t2')),
  amount_minor        bigint not null,
  currency            char(3) not null,
  status              payment_status not null default 'initialised',
  raw                 jsonb,
  paid_at             timestamptz,
  created_at          timestamptz not null default now()
);
 
create table advisory_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id),
  advisor_id       uuid not null references advisors(id),
  application_id   uuid references applications(id),
  report_id        uuid references reports(id),
  cal_booking_uid  text unique,
  start_at         timestamptz not null,
  end_at           timestamptz not null,
  timezone         text not null default 'Africa/Lagos',
  meeting_type     text not null default 'video' check (meeting_type in ('video','phone')),
  meeting_url      text,
  topic            text check (char_length(topic) <= 300),
  advisor_notes    text,
  status           session_status not null default 'pending_payment',
  hold_expires_at  timestamptz,
  payment_id       uuid references payments(id),
  created_at       timestamptz not null default now()
);
create index on advisory_sessions (advisor_id, start_at);
 
create table reviews (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null unique references advisory_sessions(id),
  user_id       uuid not null references profiles(id),
  advisor_id    uuid not null references advisors(id),
  rating        smallint not null check (rating between 1 and 5),
  title         text check (char_length(title) <= 80),
  body          text check (char_length(body) <= 1000),
  status        review_status not null default 'pending',
  published_at  timestamptz,
  created_at    timestamptz not null default now()
);
 
create table consents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id),
  application_id  uuid references applications(id),
  consent_type    text not null check (consent_type in ('data_processing','terms','marketing')),
  version         text not null,
  granted         boolean not null,
  ip              inet,
  user_agent      text,
  created_at      timestamptz not null default now()
);
 
create table notifications (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references profiles(id),
  application_id       uuid references applications(id),
  channel              text not null check (channel in ('email','whatsapp','sms')),
  template             text not null,
  provider_message_id  text,
  status               text not null default 'queued',
  created_at           timestamptz not null default now()
);
 
create table audit_log (
  id          bigserial primary key,
  actor_id    uuid references profiles(id),
  action      text not null,
  entity      text not null,
  entity_id   text not null,
  diff        jsonb,
  created_at  timestamptz not null default now()
);
 
-- Track record, computed (never typed in)
create view advisor_stats as
select a.id as advisor_id,
  (select count(*) from advisory_sessions s
     where s.advisor_id = a.id and s.status = 'completed')                      as sessions_completed,
  (select count(*) from mortgage_cases c
     where c.advisor_id = a.id and c.stage in ('approved','disbursed','declined')) as mortgages_decided,
  (select count(*) from mortgage_cases c
     where c.advisor_id = a.id and c.stage in ('approved','disbursed'))           as mortgages_approved,
  (select case when count(*) >= 5 then round(100.0 * count(*) filter
            (where c.stage in ('approved','disbursed')) / count(*)) end
     from mortgage_cases c
     where c.advisor_id = a.id and c.stage in ('approved','disbursed','declined')) as approval_rate,
  (select round(avg(r.rating)::numeric, 1) from reviews r
     where r.advisor_id = a.id and r.status = 'published')                       as avg_rating,
  (select count(*) from reviews r
     where r.advisor_id = a.id and r.status = 'published')                       as review_count
from advisors a;
 
-- Seed products (values from the brief; confirm before launch)
insert into rate_products (code,name,category,rate_min,rate_max,max_tenor_years,loan_cap_kobo,eligibility) values
 ('NHF','National Housing Fund (FMBN)','concessionary',0.06,0.06,18,5000000000,
   '{"nationality":["NG","NG_DUAL"],"residence":"nigeria"}'),
 ('NHF_DIASPORA','NHF Diaspora (FMBN)','concessionary',0.06,0.06,18,5000000000,
   '{"nationality":["NG","NG_DUAL"],"residence":"diaspora"}'),
 ('MREIF','MREIF via partner banks','concessionary',0.0975,0.0975,18,null,'{}'),
 ('COMMERCIAL','Commercial (PMBs and banks)','commercial',0.22,0.30,15,null,'{}'),
 ('NON_INTEREST','Non-interest (Ijarah)','non_interest',0.22,0.30,15,null,'{"preference":"yes"}');
 
-- RLS examples
alter table applications enable row level security;
create policy own_applications on applications for select using (user_id = auth.uid());
create policy staff_applications on applications for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('ops','admin')));
alter table reports enable row level security;
create policy own_reports on reports for select using (
  exists (select 1 from applications a where a.id = application_id and a.user_id = auth.uid()));
create policy advisor_reports on reports for select using (
  exists (select 1 from advisory_sessions s join advisors v on v.id = s.advisor_id
          where s.application_id = reports.application_id and v.user_id = auth.uid()
            and s.status in ('confirmed','rescheduled','completed')));
-- Anonymous draft access goes through the API with the service role, keyed by anon_token_hash.

Appendix B: Sample API response
POST /api/v1/prequal/applications/:id/submit for Applicant A. Amounts in kobo.
{
  "applicationId": "7a1c2f9e-5b0d-4c55-9a7e-1f2b3c4d5e6f",
  "status": "estimated",
  "engineVersion": "2026.11.1",
  "assessed": {
    "monthlyIncomeKobo": 100000000,
    "affordableMonthlyKobo": 33333300,
    "currency": "NGN",
    "scenario": "base"
  },
  "headline": {
    "productCode": "NHF",
    "maxLoanKobo": 3461535000,
    "display": "₦34,610,000"
  },
  "results": [
    {
      "productCode": "NHF",
      "category": "concessionary",
      "interestRate": 0.06,
      "tenorMonths": 216,
      "maxLoanKobo": 3461535000,
      "firstMonthlyRepaymentKobo": 33333300,
      "maxPropertyValueKobo": 3846150000,
      "equityRequiredKobo": 384615000,
      "capped": false,
      "eligible": true,
      "notes": []
    },
    {
      "productCode": "MREIF",
      "category": "concessionary",
      "interestRate": 0.0975,
      "tenorMonths": 216,
      "maxLoanKobo": 2613427500,
      "firstMonthlyRepaymentKobo": 33333300,
      "maxPropertyValueKobo": 2903808300,
      "equityRequiredKobo": 290380800,
      "capped": false,
      "eligible": true,
      "notes": []
    },
    {
      "productCode": "COMMERCIAL",
      "category": "commercial",
      "rateBasis": "low",
      "interestRate": 0.22,
      "tenorMonths": 180,
      "maxLoanKobo": 1395347400,
      "eligible": true
    },
    {
      "productCode": "COMMERCIAL",
      "category": "commercial",
      "rateBasis": "high",
      "interestRate": 0.3,
      "tenorMonths": 180,
      "maxLoanKobo": 1090908000,
      "eligible": true
    }
  ],
  "variants": [],
  "insightKey": "nhf_best_value",
  "reportPrompt": true
}

Appendix C: Engine test fixtures
These figures were computed with the rules in "Prequalification engine" (equal principal, 1/3 affordability, 10% equity, maximum age 60, no obligations). The engine's unit tests must reproduce them to the Naira. If the repayment method or any setting changes, regenerate this table.
A. Salaried, Lagos, ₦1,000,000 a month, age 35
Product
Rate, term
Affordable a month
Max loan
First repayment
Max property value
Equity (10%)
NHF (FMBN)
6%, 18 yrs
₦333,333
₦34,615,350
₦333,333
₦38,461,500
₦3,846,150
MREIF via partner banks
9.75%, 18 yrs
₦333,333
₦26,134,275
₦333,333
₦29,038,083
₦2,903,808
Commercial (low end)
22%, 15 yrs
₦333,333
₦13,953,474
₦333,333
₦15,503,860
₦1,550,386
Commercial (high end)
30%, 15 yrs
₦333,333
₦10,909,080
₦333,333
₦12,121,200
₦1,212,120

B. Joint, Abuja, ₦600,000 + ₦450,000 a month, primary applicant age 45
Product
Rate, term
Affordable a month
Max loan
First repayment
Max property value
Equity (10%)
NHF (FMBN)
6%, 15 yrs
₦350,000
₦33,157,894
₦350,000
₦36,842,104
₦3,684,210
MREIF via partner banks
9.75%, 15 yrs
₦350,000
₦25,583,756
₦350,000
₦28,426,395
₦2,842,639
Commercial (low end)
22%, 15 yrs
₦350,000
₦14,651,162
₦350,000
₦16,279,068
₦1,627,906
Commercial (high end)
30%, 15 yrs
₦350,000
₦11,454,545
₦350,000
₦12,727,272
₦1,272,727

C. Diaspora, UK, £2,400 a month at a stressed ₦1,600/£ (live ₦1,836/£), age 40
Product
Rate, term
Affordable a month
Max loan
First repayment
Max property value
Equity (10%)
NHF Diaspora (FMBN)
6%, 18 yrs
₦1,280,000
₦50,000,000 (cap)
₦481,481
₦55,555,555
₦5,555,555
MREIF via partner banks
9.75%, 18 yrs
₦1,280,000
₦100,355,716
₦1,280,000
₦111,506,351
₦11,150,635
Commercial (low end)
22%, 15 yrs
₦1,280,000
₦53,581,395
₦1,280,000
₦59,534,883
₦5,953,488
Commercial (high end)
30%, 15 yrs
₦1,280,000
₦41,890,909
₦1,280,000
₦46,545,454
₦4,654,545

Applicant B shows the age rule: at 45, the term is 15 years, not 18. Applicant C shows the NHF cap: the uncapped NHF Diaspora amount would be far above ₦50,000,000, so the cap applies and MREIF becomes the headline.
