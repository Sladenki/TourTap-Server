export function idOf(value: unknown): string {
  if (value && typeof value === 'object' && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }

  return String(value);
}

export function sameObjectId(left: unknown, right: unknown): boolean {
  return idOf(left) === idOf(right);
}

export function asRecord(value: unknown): Record<string, unknown> {
  if (
    value &&
    typeof value === 'object' &&
    'toObject' in value &&
    typeof (value as { toObject?: unknown }).toObject === 'function'
  ) {
    return (value as { toObject: () => Record<string, unknown> }).toObject();
  }

  return { ...(value as Record<string, unknown>) };
}
