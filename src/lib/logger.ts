'use client';

const dev =
  typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';

function enabled() {
  if (dev) return true;
  if (typeof window !== 'undefined') {
    try {
      return (
        window.localStorage.getItem('debug') === '1' ||
        window.localStorage.getItem('debug-auth') === '1'
      );
    } catch {
      return false;
    }
  }
  return false;
}

function out(method: 'log' | 'info' | 'warn' | 'error', args: unknown[]) {
  if (!enabled()) return;
  const fn = console[method] as (...data: unknown[]) => void;
  fn(...args);
}

export const logger = {
  log: (...args: unknown[]) => out('log', args),
  info: (...args: unknown[]) => out('info', args),
  warn: (...args: unknown[]) => out('warn', args),
  error: (...args: unknown[]) => out('error', args),
};
