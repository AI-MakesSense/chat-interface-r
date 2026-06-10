/**
 * Shared deep-merge utility.
 *
 * Semantics:
 *  - Plain objects: keys are merged recursively.
 *  - Arrays and scalars: `patch` value replaces `base` wholesale.
 *  - `undefined` patch values are SKIPPED (base value is preserved).
 *
 * This is the single canonical implementation for this project.
 * Previously duplicated between:
 *   - stores/widget-store.ts (typed, undefined-skipping — the correct one)
 *   - lib/utils/config-helpers.ts (any-typed, assigned undefined — incorrect)
 * Both call sites now import from here.
 */

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Deep-merge `patch` over `base`.
 * Arrays and scalars replace; plain objects merge.
 * `undefined` patch values are skipped so partial updates never clobber existing values.
 */
export function deepMerge<T>(base: T, patch: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return (patch === undefined ? base : patch) as T;
  }
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    const baseValue = (base as Record<string, unknown>)[key];
    out[key] = isPlainObject(baseValue) && isPlainObject(value)
      ? deepMerge(baseValue, value)
      : value;
  }
  return out as T;
}
