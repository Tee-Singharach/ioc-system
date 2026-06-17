import type { User } from "@/lib/types/ticket";

const SESSION_KEY = "ioc-mock-session";
const SESSION_EVENT = "ioc-session-change";

function notifySessionChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_EVENT));
  }
}

export function subscribeSession(callback: () => void) {
  window.addEventListener(SESSION_EVENT, callback);
  return () => window.removeEventListener(SESSION_EVENT, callback);
}

export function getSessionRaw(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function parseSession(raw: string | null): User | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setSession(user: User): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  notifySessionChange();
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  notifySessionChange();
}

export function getServerSessionSnapshot(): null {
  return null;
}
