/**
 * Headless smoke test for the js / ts / html language backends.
 * Run: pnpm run smoke     (esbuild bundles this to .temp/ then node executes it)
 * NOTE: this file is a dev-only test artifact — it is NOT part of the plugin bundle.
 */
import { getBackend, isLanguageEnabled } from '../../src/backend/index'
import { createStdio } from '../../src/backend/store'
import { readCache, writeCache } from '../../src/backend/cache'
import { injectTimeout } from '../../src/backend/languages/js-guard'
import { setEnabledLanguages } from '../../src/settings-bridge'
import { createRequire } from 'module'

type AnyEl = {
  className: string
  innerHTML: string
  children: AnyEl[]
  replaceChildren(): void
  hasChildNodes(): boolean
  appendChild(child: AnyEl): AnyEl
  attachShadow(): { appendChild(child: AnyEl): void }
}

const appended: AnyEl[] = []

function makeEl(): AnyEl {
  const el: AnyEl = {
    className: '',
    innerHTML: '',
    children: [],
    replaceChildren() { el.children = [] },
    hasChildNodes() { return el.children.length > 0 },
    appendChild(child: AnyEl) { el.children.push(child); appended.push(child); return child },
    attachShadow() { return { appendChild() {} } },
  }
  return el
}

// store.ts calls document.createElement('div') when createStdio() runs (its only DOM usage).
;(globalThis as unknown as { document: unknown }).document = { createElement: makeEl }

// In-memory localStorage so cache read/write can be exercised headlessly.
const localStore = new Map<string, string>()
;(globalThis as unknown as { localStorage: unknown }).localStorage = {
  getItem: (k: string) => (localStore.has(k) ? localStore.get(k)! : null),
  setItem: (k: string, v: string) => { localStore.set(k, v) },
  removeItem: (k: string) => { localStore.delete(k) },
  key: (i: number) => [...localStore.keys()][i] ?? null,
  get length() { return localStore.size },
}

// Typora defines `reqnode`; simulate it so the node backend can run under plain Node.
;(globalThis as unknown as { reqnode: unknown }).reqnode = createRequire(import.meta.url)

const results: string[] = []
let failed = 0

function check(name: string, ok: boolean, detail: string): void {
  if (!ok) failed++
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + detail}`)
}

async function run(lang: string, code: string) {
  const stdio = createStdio()
  const backend = getBackend(lang)
  if (!backend) throw new Error('no backend registered for ' + lang)
  await backend(code, stdio)
  return stdio
}

async function main(): Promise<void> {
  { // 1. js sync
    const o = (await run('js', "console.log('a', 1)")).getOutputs()
    check('js sync log', o.length === 1 && o[0].text.includes('a 1') && o[0].level === 'log', JSON.stringify(o))
  }
  { // 2. js async await
    const o = (await run('js', "await new Promise(r => setTimeout(r, 10)); console.log('after await')")).getOutputs()
    check('js async await', o.length === 1 && o[0].text.includes('after await'), JSON.stringify(o))
  }
  { // 3. js thrown error -> error level
    const o = (await run('js', "throw new Error('boom')")).getOutputs()
    check('js throw', o.length === 1 && o[0].level === 'error' && o[0].text.includes('boom'), JSON.stringify(o))
  }
  { // 4. js syntax error -> captured as error level (js.ts also prints a real console.error: expected noise)
    const o = (await run('js', "console.log('unterminated")).getOutputs()
    check('js syntax error', o.length === 1 && o[0].level === 'error' && o[0].text.includes('SyntaxError'), JSON.stringify(o))
  }
  { // 5. console level mapping
    const o = (await run('js', "console.info('i'); console.debug('d'); console.warn('w'); console.error('e')")).getOutputs()
    check('js console levels', o.length === 4
      && o[0].level === 'info'
      && o[1].level === 'debug'
      && o[2].level === 'warn'
      && o[3].level === 'error', JSON.stringify(o))
  }
  { // 6. ts interface + enum + annotations (mirrors test/vault/doc.md)
    const code = "interface Point { x: number; y: number }\nenum Color { Red = 'red', Blue = 'blue' }\nconst p: Point = { x: 1, y: 2 }\nconsole.log(Color.Red, p.x + p.y)"
    const o = (await run('ts', code)).getOutputs()
    check('ts transpile + run', o.length === 1 && o[0].text.includes('red 3'), JSON.stringify(o))
  }
  { // 7. ts transpile failure -> error output
    const o = (await run('ts', 'const x: = 1')).getOutputs()
    check('ts transpile error', o.length === 1 && o[0].level === 'error', JSON.stringify(o))
  }
  { // 8. empty code block -> no output, no crash
    const o = (await run('js', '')).getOutputs()
    check('empty code', o.length === 0, JSON.stringify(o))
  }
  { // 9. huge output
    const o = (await run('js', "for (let i = 0; i < 2000; i++) console.log('line ' + i)")).getOutputs()
    check('huge output 2000 lines', o.length === 2000 && o[1999].text.includes('line 1999'), 'len=' + o.length)
  }
  { // 10. repeat run must not accumulate (mirrors Play.run(): stdio.clear() first)
    const stdio = await run('js', "console.log('once')")
    stdio.clear()
    await getBackend('js')!("console.log('twice')", stdio)
    const o = stdio.getOutputs()
    check('repeat run after clear', o.length === 1 && o[0].text.includes('twice'), JSON.stringify(o))
  }
  { // 11. html structural smoke (real rendering needs a browser: manual check in Typora)
    const stdio = await run('html', '<h3>Hello HTML</h3>')
    check('html host appended', stdio.getOutputs().length === 0 && appended.some(el => el.className === 'typ-cbr-html'), 'appended=' + appended.length)
  }
  { // 12. unsupported language
    check('unsupported language', getBackend('ruby') === undefined, 'getBackend("ruby") must be undefined')
  }
  { // 12b. remote languages + aliases are registered and carry a runtime label
    const aliases: [string, string][] = [
      ['v', 'vlang'], ['crystal', 'cr'], ['hs', 'haskell'], ['kotlin', 'kt'], ['rust', 'rs'], ['go', 'golang'], ['java', 'java'],
      ['bash', 'sh'], ['cpp', 'cc'], ['csharp', 'cs'], ['python', 'py'], ['python2', 'py2'], ['powershell', 'ps1'], ['powershell', 'pwsh'], ['julia', 'jl'],
    ]
    const ok = !!getBackend('c')
      && aliases.every(([a, b]) => !!getBackend(a) && getBackend(a) === getBackend(b))
      && ['v', 'crystal', 'haskell', 'kotlin', 'rust', 'go', 'java', 'bash', 'c', 'cpp', 'csharp', 'python', 'powershell', 'php', 'lua', 'python2', 'r', 'swift', 'dart', 'julia', 'zig']
        .every(a => typeof getBackend(a)?.runtime === 'string')
    check('remote languages registered', ok, JSON.stringify(aliases))
  }
  { // 12c. per-language toggles gate execution: local on / remote off by default
    const localOn = ['js', 'node', 'ts', 'html'].every(l => isLanguageEnabled(l))
    const remoteOff = ['rust', 'kotlin', 'haskell', 'crystal', 'v', 'go', 'java', 'bash', 'c', 'cpp', 'csharp', 'python', 'powershell', 'php', 'lua', 'python2', 'r', 'swift', 'dart', 'julia', 'zig'].every(l => !isLanguageEnabled(l))
    setEnabledLanguages({ rust: true })
    const enabled = isLanguageEnabled('rust') && isLanguageEnabled('rs') && !isLanguageEnabled('v')
    setEnabledLanguages({})
    check('language toggles', localOn && remoteOff && enabled,
      `local=${localOn} remoteOff=${remoteOff} enabled=${enabled}`)
  }
  { // 13. plugin-internal frames (bundled chunks) are stripped from error stacks
    const o = (await run('js', "throw new Error('framed')")).getOutputs()
    check('js stack strips internal frames',
      o.length === 1 && o[0].text.includes('codeblock.js') && !o[0].text.includes('backend.smoke'),
      JSON.stringify(o))
  }
  { // 14. node: require() of a builtin is forwarded to reqnode
    const o = (await run('node', "console.log(require('path').basename('/a/b/c.txt'))")).getOutputs()
    check('node require builtin', o.length === 1 && o[0].text.includes('c.txt'), JSON.stringify(o))
  }
  { // 15. node: top-level await works through the vm-compiled async wrapper
    const o = (await run('node', "await new Promise(r => setTimeout(r, 5)); console.log('node await')")).getOutputs()
    check('node async await', o.length === 1 && o[0].text.includes('node await'), JSON.stringify(o))
  }
  { // 16. node: runtime error surfaces as an error line
    const o = (await run('node', "require('path').basename(1, {})")).getOutputs()
    check('node runtime error', o.length === 1 && o[0].level === 'error', JSON.stringify(o))
  }
  { // 17. node: missing reqnode is reported, not thrown
    const g = globalThis as unknown as { reqnode?: unknown }
    const saved = g.reqnode
    delete g.reqnode
    const o = (await run('node', "console.log('x')")).getOutputs()
    check('node missing reqnode', o.length === 1 && o[0].text.includes('reqnode'), JSON.stringify(o))
    g.reqnode = saved
  }
  { // 18. node: wrapper offset maps frames back to user line numbers
    const o = (await run('node', "const x = 1\nthrow new Error('line2')")).getOutputs()
    check('node line mapping', o.length === 1 && o[0].text.includes('codeblock.js:2'), JSON.stringify(o))
  }
  { // 19. node: File.isNode === false (macOS) disables the backend with a clear error
    const g = globalThis as unknown as { File?: unknown }
    const saved = g.File
    g.File = { isNode: false }
    const o = (await run('node', "console.log('x')")).getOutputs()
    check('node macos disabled', o.length === 1 && o[0].level === 'error' && o[0].text.includes('macOS'), JSON.stringify(o))
    g.File = saved
  }
  { // 20. plugin core frames (button onclick wrapper) are stripped, user frame kept
    const coreFrame = 'at Object.onclick (file:///C:/x/node_modules/@typora-community-plugin/core/dist/core.js:7020:22)'
    const userFrame = 'at user (codeblock.js:4:15)'
    const code = `const e = new Error('coreframe')\ne.stack = 'Error: coreframe\\n    ${coreFrame}\\n    ${userFrame}'\nthrow e`
    const o = (await run('js', code)).getOutputs()
    check('js stack strips core frames',
      o.length === 1 && o[0].text.includes('codeblock.js') && !o[0].text.includes('core.js'),
      JSON.stringify(o))
  }
  { // 21. console output carries the user source line (DevTools-style, right side)
    const o = (await run('js', "console.log('one')\nconsole.log('two')")).getOutputs()
    check('js console line numbers',
      o.length === 2 && o[0].line === 1 && o[1].line === 2,
      JSON.stringify(o))
  }
  { // 22. cache round-trip preserves the structured message (incl. source line)
    const code = "console.log('cached')"
    const o = (await run('js', code)).getOutputs()
    writeCache(code, o)
    const restored = readCache(code)
    check('cache keeps structured output',
      JSON.stringify(restored) === JSON.stringify(o)
        && (restored ?? []).some(m => m.level === 'log' && m.line !== undefined),
      JSON.stringify(restored))
  }

  { // 23. blocked globals are shadowed with undefined, `this` stays undefined
    const o = (await run('js', "console.log(typeof window, typeof document, typeof globalThis, typeof fetch, typeof this)")).getOutputs()
    check('js globals blocked',
      o.length === 1 && o[0].text.includes('undefined undefined undefined undefined undefined'),
      JSON.stringify(o))
  }
  { // 24. timeout check is injected into braced loop bodies and fires past the deadline
    const out = injectTimeout('for(;;){\n  step()\n}', Date.now() - 1)
    check('timeout injected into loop body',
      out.includes('throw new Error("Loop Timeout")') && out.split('\n').length === 3 && out.startsWith('for(;;){if(Date.now()>'),
      JSON.stringify(out))
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
      ...args: string[]
    ) => (...args: unknown[]) => Promise<unknown>
    let message = ''
    try {
      await new AsyncFunction('console', out)({ log() {} })
    } catch (e) {
      message = e instanceof Error ? e.message : String(e)
    }
    check('injected timeout throws', message === 'Loop Timeout', message)
  }
  { // 25. literals/comments hide loop keywords; original text is preserved
    const code = 'const s = "for(;;){}"\nconst re = /while(x){}/\nconst t = `do{}while(x)`\nwhile (a) { b() }'
    const out = injectTimeout(code, Date.now() - 1)
    const injected = out.split('\n').filter(l => l.includes('throw new Error')).length
    check('literals are masked',
      out.includes('"for(;;){}"') && out.includes('/while(x){}/') && out.includes('`do{}while(x)`') && injected === 1,
      JSON.stringify(out))
  }
  { // 26. unbraced (single-statement) loop bodies are left untouched
    const out = injectTimeout('while (x) step()', Date.now() - 1)
    check('unbraced loop body skipped', !out.includes('Timeout'), JSON.stringify(out))
  }
  { // 27. a finite braced loop still completes inside the budget
    const o = (await run('js', 'for (let i = 0; i < 3; i++) { console.log(i) }')).getOutputs()
    check('finite loop completes', o.length === 3 && o[2].text.includes('2'), JSON.stringify(o))
  }

  console.log(results.join('\n'))
  console.log('')
  console.log(`${results.length - failed}/${results.length} passed`)
  if (failed > 0) process.exitCode = 1
}

main().catch(error => {
  console.error('[smoke] crashed:', error)
  process.exitCode = 1
})
