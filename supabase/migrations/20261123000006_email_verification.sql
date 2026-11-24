-- The report is delivered before the email is confirmed (brief: "Your report email
-- includes a Confirm your email button"), so confirmation is tracked here rather
-- than by blocking sign-in.
alter table profiles add column email_verified_at timestamptz;
alter table profiles add column email_bounced_at timestamptz;
