import { render } from 'solid-js/web'
import type { JSX } from 'solid-js'

// Typora 的 Node.prototype 可能缺少 firstChild / nextSibling getter，
// Solid 的 render() 依赖它们。参考 typora-plugin-automate/tasks/svelte-integration.md 的 ensureSvelteDomShims：
//   - window.Node 缺失但 Element 存在时，用 Element 兜底；
//   - firstChild: Object.defineProperty(Node.prototype, 'firstChild', { get() { return this.childNodes?.[0] ?? null } })
//   - nextSibling: 通过 parentNode.childNodes + indexOf(this) + 1 计算。
function ensureSolidDomShims(): void {
  const NodeProto = (window.Node as typeof window.Node & { prototype?: unknown }).prototype || Element.prototype

  // firstChild shim
  if (!Object.getOwnPropertyDescriptor(NodeProto, 'firstChild')) {
    Object.defineProperty(NodeProto, 'firstChild', {
      get(this: Node): Node | null {
        return this.childNodes?.[0] ?? null
      },
      configurable: true,
    })
  }

  // nextSibling shim
  if (!Object.getOwnPropertyDescriptor(NodeProto, 'nextSibling')) {
    Object.defineProperty(NodeProto, 'nextSibling', {
      get(this: Node): Node | null {
        const parent = this.parentNode
        const childNodes = parent?.childNodes as unknown as ArrayLike<Node> | null
        if (!parent || !childNodes) return null
        const index = Array.prototype.indexOf.call(childNodes, this as unknown as unknown)
        return (index >= 0 && index < childNodes.length - 1) ? childNodes[index + 1] : null
      },
      configurable: true,
    })
  }
}

export function mountSolid(container: HTMLElement | DocumentFragment, component: () => JSX.Element): () => void {
  ensureSolidDomShims()
  const cleanup = render(component as () => import('solid-js').JSX.Element, container)
  return () => { cleanup(); }
}

export function disposeSolid(cleanupRef: { current?: (() => void) }): void {
  cleanupRef.current?.()
  cleanupRef.current = undefined
}
