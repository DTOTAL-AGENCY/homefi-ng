const req = (k: string) => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env ${k}`);
  return v;
};

export const env = {
  databaseUrl: req('DATABASE_URL'),
  supabaseUrl: req('NEXT_PUBLIC_SUPABASE_URL'),
  serviceRoleKey: req('SUPABASE_SERVICE_ROLE_KEY'),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  anthropicModel: process.env.ANTHROPIC_MODEL ?? 'claude-opus-5-5',
  aiEnabled: !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN),
  emailTransport: (process.env.EMAIL_TRANSPORT ?? 'log') as 'smtp' | 'resend' | 'log',
  smtpUrl: process.env.SMTP_URL ?? 'smtp://127.0.0.1:54325',
  resendKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM ?? 'HomeFi Advisory Team <support@homefi.ng>',
  emailReplyTo: process.env.EMAIL_REPLY_TO ?? 'support.homefi@gmail.com',
  opsEmail: process.env.OPS_ALERT_EMAIL ?? 'support.homefi@gmail.com',
  appSecret: process.env.APP_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'dev-secret',
};
