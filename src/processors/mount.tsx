import CodeBlock from '../components/CodeBlock'
import { mountSolid } from '../solid/render'
import { registerRunner, type RunnerHandle } from '../runner-registry'

export function mountRunner(
  container: HTMLElement,
  lang: string,
  code: string,
  getCode: () => string,
): () => void {
  let handle: RunnerHandle | undefined
  const unregister = registerRunner(container, {
    run: () => handle?.run(),
    clear: () => handle?.clear(),
  })

  let dispose: () => void
  try {
    dispose = mountSolid(container, () => (
      <CodeBlock lang={lang} code={code} getCode={getCode} expose={h => { handle = h }} />
    ))
  } catch (error) {
    unregister()
    throw error
  }

  return () => {
    unregister()
    dispose()
  }
}
