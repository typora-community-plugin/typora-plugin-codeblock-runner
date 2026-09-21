# Typora Plugin Codeblock Runner

English | [中文](./README.zh-CN.md)

This is a plugin based on [typora-community-plugin][core] for [Typora](https://typora.io). Inspired by [Obsidian Code Runner](https://github.com/chujiu-dev/obsidian-code-runner).

Run `js` / `node` / `ts` / `html` / `rust` / `kotlin` / `haskell` / `crystal` / `v` / `go` / `java` code blocks right inside your notes. Hover a code block and click ▶, and its output shows up inline below the code, with ANSI colors preserved. Results are cached by code content.

## Preview

![](./docs/assets/base.jpg)

## Usage

| Action | How |
| --- | --- |
| Run a code block | Hover the code block and click ▶ |
| Cancel the running state | Click ⏹ while it is running (see Known Limitations) |
| Clear one block's output | Click the clear button in the output header |
| Run the block at the cursor | `Alt+Ctrl+R`, or <kbd>F1</kbd> → "Run Code Block at Cursor" |
| Clear every block's output | <kbd>F1</kbd> → "Clear All Code Block Outputs" |

## Supported Languages

| Language | Aliases | Runtime | OS | Notes |
| --- | --- | --- | --- | --- |
| JavaScript | `js`, `javascript` | Browser (Local) / OneCompiler (Remote) | All platforms (local) / Windows & Linux (OneCompiler) | Runtime is chosen in settings: **Browser (Local)** runs in an async function context (so `await` works); **OneCompiler (Remote)** sends code to [OneCompiler](https://onecompiler.com/javascript). |
| TypeScript | `ts`, `typescript` | Browser (Local) / OneCompiler (Remote) | All platforms (local) / Windows & Linux (OneCompiler) | Runtime is chosen in settings: **Browser (Local)** transpiles with Sucrase and runs as JavaScript; **OneCompiler (Remote)** sends code to [OneCompiler](https://onecompiler.com/typescript). |
| Node.js | `node`, `nodejs` | Node.js VM (Local) / OneCompiler (Remote) | Windows / Linux | Runtime is chosen in settings: **Node.js VM (Local)** compiles with Node's `vm`; **OneCompiler (Remote)** sends code to [OneCompiler](https://onecompiler.com/nodejs). Requires network access for the remote runtime. |
| HTML | `html` | Browser (Local) | All platforms | Runtime is chosen in settings: **Browser (Local)** uses a closed Shadow DOM (inline `<script>` does not run), **iframe (Local)** uses a sandboxed iframe where scripts do run. |
| Crystal | `crystal`, `cr` | Crystal Playground (Remote) | All platforms | Sent to the [Crystal Playground](https://play.crystal-lang.org). Requires network access. |
| Go | `go`, `golang` | Go Playground (Remote) | Windows / Linux | Sent to the [Go Playground](https://go.dev/play). Requires network access. |
| Haskell | `hs`, `haskell` | Haskell Playground (Remote) | All platforms | Sent to the [Haskell Playground](https://play.haskell.org). Requires network access. |
| Java | `java` | Java Playground (Remote) | Windows / Linux | Sent to the [Java Playground](https://dev.java/playground). Runs top-level statements, imports and classes (Java 27 + preview). Requires network access. |
| Kotlin | `kotlin`, `kt` | Kotlin Playground (Remote) | Windows / Linux | Sent to the [Kotlin Playground](https://play.kotlinlang.org). Requires network access. |
| Rust | `rust`, `rs` | Rust Playground (Remote) | All platforms | Sent to the [Rust Playground](https://play.rust-lang.org). Requires network access. |
| V | `v`, `vlang` | V Playground (Remote) | Windows / Linux | Sent to the [V Playground](https://play.vlang.io). Requires network access. |
| Bash | `bash`, `sh` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/bash). Requires network access. |
| C | `c` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/c). Requires network access. |
| C++ | `cpp`, `cc` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/cpp). Requires network access. |
| C# | `csharp`, `cs` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/csharp). Requires network access. |
| Dart | `dart` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/dart). Requires network access. |
| Julia | `julia`, `jl` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/julia). Requires network access. |
| Lua | `lua` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/lua). Requires network access. |
| PHP | `php` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/php). Requires network access. |
| PowerShell | `powershell`, `ps1`, `pwsh` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/powershell). Requires network access. |
| Python | `python`, `py` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/python). Requires network access. |
| Python 2 | `python2`, `py2` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/python2). Requires network access. |
| R | `r` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/r). Requires network access. |
| Swift | `swift` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/swift). Requires network access. |
| Zig | `zig` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/zig). Requires network access. |

## Settings

Open "Settings → Plugins → Codeblock Runner".

| Setting | Values | Default | Description |
| --- | --- | --- | --- |
| Run languages | on / off (per language) | local: on, remote: off | Toggle each language on or off. Remote languages (`rust`, `kotlin`, `haskell`, `crystal`, `v`, `go`, `java`, `bash`, `c`, `cpp`, `csharp`, `python`, `powershell`, `php`, `lua`, `python2`, `r`, `swift`, `dart`, `julia`, `zig`) send code to an online playground and stay off until you enable them. Running a disabled language reports it in the output. |
| HTML runtime | Browser (Local) / iframe (Local) | Browser (Local) | The select on the HTML row. **Browser (Local)** renders output in a closed Shadow DOM (inline `<script>` does not run); **iframe (Local)** renders it in a sandboxed iframe where scripts run, isolated from the note (opaque origin, no same-origin access). |
| JavaScript runtime | Browser (Local) / OneCompiler (Remote) | Browser (Local) | The select on the JavaScript row. **Browser (Local)** runs in the renderer; **OneCompiler (Remote)** sends code to [OneCompiler](https://onecompiler.com/javascript). |
| TypeScript runtime | Browser (Local) / OneCompiler (Remote) | Browser (Local) | The select on the TypeScript row. **Browser (Local)** transpiles with Sucrase then runs in the renderer; **OneCompiler (Remote)** sends code to [OneCompiler](https://onecompiler.com/typescript). |
| Node.js runtime | Node.js VM (Local) / OneCompiler (Remote) | Node.js VM (Local) | The select on the Node.js row. **Node.js VM (Local)** runs in-process via Node's `vm`; **OneCompiler (Remote)** sends code to [OneCompiler](https://onecompiler.com/nodejs). |

## Install

1. Install [typora-community-plugin][core]
2. Open "Settings → Plugin Marketplace" search "Codeblock Runner" then install it.

## Known Limitations

- In `js` / `ts` blocks, BOM/DOM/network and Typora globals (`window`, `document`, `fetch`, `reqnode`, `editor`, …) are shadowed as `undefined`. This is a guardrail, not a security sandbox: constructor chains, indirect `eval` and dynamic `import()` still reach the real globals, and `eval` itself cannot be shadowed under strict mode.
- `js` / `ts` / `node` blocks have a 5-second timeout: braced loop bodies throw `Loop Timeout` once it elapses, and a hung `await` is caught by the outer race. Unbraced single-statement loop bodies get no check, so such infinite loops can still freeze Typora.
- TypeScript is transpiled without type checking, so type errors do not stop execution.
- In a `node` block, Node.js's built-in module names work, but relative paths are not resolved against the note's folder.
- `node` blocks only run on Windows and Linux. Typora does not expose Node.js on macOS, so the block reports an error there.
- Inline `<script>` inside an `html` block is not executed with the **Browser (Local)** runtime (closed Shadow DOM); switch the HTML runtime to **iframe (Local)** to run scripts.
- `rust` / `kotlin` / `hs` / `crystal` / `v` / `go` / `java` blocks run on the corresponding online playground, so they need a network connection and are unavailable offline. On Windows / Linux requests go through Node (CORS is not an issue); on macOS they fall back to `fetch` and may be rejected if the playground does not allow cross-origin requests.
- On macOS the `kotlin` / `v` / `go` / `java` settings rows are hidden and these languages cannot be enabled: their playgrounds send no CORS headers, so the renderer's `fetch` fallback is rejected.
- ⏹ cancels the running state of the UI but cannot interrupt code that is already executing.
- "Clear All Code Block Outputs" also purges the cached output of every block, including notes that are not currently open.

[core]: https://github.com/typora-community-plugin/typora-community-plugin
