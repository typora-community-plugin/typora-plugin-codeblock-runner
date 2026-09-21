export function isMacOS(): boolean {
  const g = globalThis as unknown as { File?: { isNode?: boolean } }
  return g.File?.isNode === false
}
