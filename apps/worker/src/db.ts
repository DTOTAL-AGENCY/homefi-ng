import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@homefi/db';
import { env } from './env';

export const sql = postgres(env.databaseUrl, { max: 5, idle_timeout: 30 });
export const sb = createClient<Database>(env.supabaseUrl, env.serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export interface QueueMessage<T> {
  msg_id: number;
  read_ct: number;
  message: T;
}

/** Read up to qty messages, hidden for vt seconds (a failed job reappears after vt: retry with backoff). */
export async function readQueue<T>(queue: string, vt: number, qty: number): Promise<QueueMessage<T>[]> {
  return (await sql`select msg_id, read_ct, message from pgmq.read(${queue}::text, ${vt}::integer, ${qty}::integer)`) as unknown as QueueMessage<T>[];
}
export const ack = (queue: string, id: number) => sql`select pgmq.delete(${queue}::text, ${id}::bigint)`;
export const archive = (queue: string, id: number) => sql`select pgmq.archive(${queue}::text, ${id}::bigint)`;
/** Push the message's visibility further out: exponential backoff for retries */
export const backoff = (queue: string, id: number, seconds: number) => sql`select pgmq.set_vt(${queue}::text, ${id}::bigint, ${seconds}::integer)`;
export const enqueue = (queue: string, payload: object, delay = 0) =>
  sql`select pgmq.send(${queue}::text, ${sql.json(payload as never)}::jsonb, ${delay}::integer)`;
