'use client';

import { useCallback, useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      execute: (id: string) => void;
      reset: (id: string) => void;
      getResponse: (id: string) => string | undefined;
    };
  }
}

/**
 * Invisible Cloudflare Turnstile. Returns a fresh token on demand, or undefined when
 * no site key is configured (the server skips the check outside production).
 */
export function useTurnstile() {
  const ref = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const waiters = useRef<Array<(t: string | undefined) => void>>([]);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    const mount = () => {
      if (!window.turnstile || !ref.current || widget.current) return;
      widget.current = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        execution: 'execute',
        appearance: 'interaction-only',
        callback: (t: string) => {
          waiters.current.splice(0).forEach((w) => w(t));
        },
        'error-callback': () => waiters.current.splice(0).forEach((w) => w(undefined)),
      });
    };
    if (window.turnstile) mount();
    else {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.onload = mount;
      document.head.appendChild(s);
    }
  }, [siteKey]);

  const token = useCallback(async (): Promise<string | undefined> => {
    if (!siteKey || !window.turnstile || !widget.current) return undefined;
    const id = widget.current;
    window.turnstile.reset(id);
    return new Promise((resolve) => {
      waiters.current.push(resolve);
      window.turnstile!.execute(id);
      setTimeout(() => resolve(undefined), 15000);
    });
  }, [siteKey]);

  return { ref, token };
}
