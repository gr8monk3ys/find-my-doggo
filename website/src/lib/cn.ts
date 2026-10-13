/** Joins class names, dropping falsy entries. No merging; later classes simply win in CSS order. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
