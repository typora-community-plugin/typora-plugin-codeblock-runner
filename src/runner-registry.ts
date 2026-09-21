export const RUNNER_CONTAINER_CLASS = 'typ-cbr-block-container'
export const RUNNER_CONTAINER_SELECTOR = ':scope > .' + RUNNER_CONTAINER_CLASS

export interface RunnerHandle {
  run(): void
  clear(): void
}

const runners = new Map<HTMLElement, RunnerHandle>()

export function registerRunner(container: HTMLElement, handle: RunnerHandle): () => void {
  runners.set(container, handle)
  return () => {
    runners.delete(container)
  }
}

export function getRunnerForPre(pre: HTMLElement): RunnerHandle | undefined {
  const container = pre.querySelector(RUNNER_CONTAINER_SELECTOR)
  return container instanceof HTMLElement ? runners.get(container) : undefined
}

export function clearAllRunners(): number {
  const handles = Array.from(runners.values())
  for (const handle of handles) handle.clear()
  return handles.length
}
