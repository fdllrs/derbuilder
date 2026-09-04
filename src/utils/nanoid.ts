// Simple 8-character random ID — no dependency needed
export function nanoid(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
}
