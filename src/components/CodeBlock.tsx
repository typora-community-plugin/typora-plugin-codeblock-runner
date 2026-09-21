import Play from './Play'
import type { RunnerHandle } from '../runner-registry'

/**
 * Root component for code block runner mounting.
 * Note: does NOT render <pre><code> — Typora renders code blocks itself (CodeMirror in editor),
 * this only handles the runner UI to avoid breaking code block editing capability.
 */
export default function CodeBlock(props: {
  lang: string
  code: string
  getCode: () => string
  expose?: (handle: RunnerHandle) => void
}) {
  return <Play lang={props.lang} code={props.code} getCode={props.getCode} expose={props.expose} />
}
