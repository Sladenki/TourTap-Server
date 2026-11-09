export function trimString({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

export function normalizeEmail({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}
