import { v4 as uuid } from "uuid";

const SESSION_KEY = "vsde-session-id";

export function getOrCreateSessionId(): string {
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = uuid();
  window.localStorage.setItem(SESSION_KEY, id);
  return id;
}





