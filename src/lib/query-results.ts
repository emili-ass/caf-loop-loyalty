/** Preserve genuine empty results, but never hide Supabase permission/network errors. */
export function requireData<T>(result: { data: T | null; error: { message: string } | null }, context: string): T | null {
  if (result.error) throw new Error(`${context}: ${result.error.message}`);
  return result.data;
}

export function requireCount(result: { count: number | null; error: { message: string } | null }, context: string): number {
  if (result.error) throw new Error(`${context}: ${result.error.message}`);
  if (result.count === null) throw new Error(`${context}: conteo no disponible`);
  return result.count;
}
