# Typora Plugin Codeblock Runner

English | [中文](./README.zh-CN.md)

This is a [Typora](https://typoraio.cn) plugin based on [typora-community-plugin][core]. Inspired by [Obsidian Code Runner](https://github.com/chujiu-dev/obsidian-code-runner).

Run `bash` / `c` / `cpp` / `csharp` / `crystal` / `dart` / `go` / `haskell` / `html` / `java` / `js` / `javascript` / `julia` / `kotlin` / `lua` / `node` / `php` / `powershell` / `python` / `r` / `rust` / `swift` / `ts` / `v` / `zig` code blocks directly in your notes: hover over a code block and click ▶, the output will be displayed inline below the code with ANSI colors preserved. Output is cached by code content.

## Preview

![](./docs/assets/base.jpg)

## Usage

| Action | Method |
| --- | --- |
| Run a code block | Hover over the code block and click ▶ |
| Cancel running state | Click ⏹ while running (see "Known Limitations") |
| Clear output of a single block | Click the clear button at the top of the output area |
| Run the code block containing the cursor | `Alt+Ctrl+R`, or <kbd>F1</kbd> → "Run Code Block at Cursor" |
| Clear all code block outputs | <kbd>F1</kbd> → "Clear All Code Block Outputs" |

## Supported Languages

| Language | Aliases | Runtime | OS | Notes |
| --- | --- | --- | --- | --- |
| Bash | `bash`, `sh` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/bash), requires internet. |
| C | `c` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/c), requires internet. |
| C++ | `cpp`, `cc` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/cpp), requires internet. |
| C# | `csharp`, `cs` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/csharp), requires internet. |
| Crystal | `crystal`, `cr` | Crystal Playground (Remote) | All platforms | Sent to [Crystal Playground](https://play.crystal-lang.org), requires internet. |
| Dart | `dart` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/dart), requires internet. |
| Go | `go`, `golang` | Go Playground (Remote) | Windows / Linux | Sent to [Go Playground](https://go.dev/play), requires internet. |
| Haskell | `hs`, `haskell` | Haskell Playground (Remote) | All platforms | Sent to [Haskell Playground](https://play.haskell.org), requires internet. |
| HTML | `html` | Browser (Local) | All platforms | Execution mode selectable in settings: **Browser (Local)** renders in closed Shadow DOM (inline `<script>` tags won't execute), **iframe (Local)** renders in a sandboxed iframe where scripts will execute. |
| Java | `java` | Java Playground (Remote) | Windows / Linux | Sent to [Java Playground](https://dev.java/playground). Supports top-level statements, imports, and class definitions (Java 27 + preview features). Requires internet. |
| JavaScript | `js`, `javascript` | Browser (Local) / OneCompiler (Remote) | All platforms (local) / Windows / Linux (OneCompiler) | Execution mode selectable in settings: **Browser (Local)** executes within an async function context (`await` is available); **OneCompiler (Remote)** sends code to [OneCompiler](https://onecompiler.com/javascript). |
| Julia | `julia`, `jl` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/julia), requires internet. |
| Kotlin | `kotlin`, `kt` | Kotlin Playground (Remote) | Windows / Linux | Sent to [Kotlin Playground](https://play.kotlinlang.org), requires internet. |
| Lua | `lua` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/lua), requires internet. |
| Node.js | `node`, `nodejs` | Node.js VM (Local) / OneCompiler (Remote) | Windows / Linux | Execution mode selectable in settings: **Node.js VM (Local)** compiles and executes using Node's `vm`; **OneCompiler (Remote)** sends code to [OneCompiler](https://onecompiler.com/nodejs). Remote execution requires internet. |
| PHP | `php` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/php), requires internet. |
| PowerShell | `powershell`, `ps1`, `pwsh` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/powershell), requires internet. |
| Python | `python`, `py` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/python), requires internet. |
| Python 2 | `python2`, `py2` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/python2), requires internet. |
| R | `r` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/r), requires internet. |
| Rust | `rust`, `rs` | Rust Playground (Remote) | All platforms | Sent to [Rust Playground](https://play.rust-lang.org), requires internet. |
| Swift | `swift` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/swift), requires internet. |
| TypeScript | `ts`, `typescript` | Browser (Local) / OneCompiler (Remote) | All platforms (local) / Windows / Linux (OneCompiler) | Execution mode selectable in settings: **Browser (Local)** is transpiled by Sucrase then executed as JavaScript; **OneCompiler (Remote)** sends code to [OneCompiler](https://onecompiler.com/typescript). |
| V | `v`, `vlang` | V Playground (Remote) | Windows / Linux | Sent to [V Playground](https://play.vlang.io), requires internet. |
| Zig | `zig` | OneCompiler (Remote) | Windows / Linux | Sent to [OneCompiler](https://onecompiler.com/zig), requires internet. |

## Settings

Open "Settings → Plugins → Codeblock Runner".

| Setting | Values | Default | Notes |
| --- | --- | --- | --- |
| Language toggles | On / Off (per language) | Local: On, Remote: Off | Toggle each language on/off individually. Remote languages are disabled by default and must be manually enabled; running a disabled language will show a prompt in the output area. See the "Supported Languages" table for details. |
| HTML execution mode | Browser (Local) / iframe (Local) | Browser (Local) | Dropdown option on the HTML row. See the "Supported Languages" table for details. |
| JavaScript execution mode | Browser (Local) / OneCompiler (Remote) | Browser (Local) | Dropdown option on the JS row. See the "Supported Languages" table for details. |
| TypeScript execution mode | Browser (Local) / OneCompiler (Remote) | Browser (Local) | Dropdown option on the TS row. See the "Supported Languages" table for details. |
| Node.js execution mode | Node.js VM (Local) / OneCompiler (Remote) | Node.js VM (Local) | Dropdown option on the Node row. See the "Supported Languages" table for details. |

## Installation

1. First install [typora-community-plugin][core]
2. Open "Settings → Plugin Marketplace", search for "Codeblock Runner" and install.

## Known Limitations

- In `js` / `ts` code blocks, BOM/DOM/network and Typora-related globals (`window`, `document`, `fetch`, `reqnode`, `editor`, etc.) are masked as `undefined`. This is a guardrail against accidental misuse, not a security sandbox: constructor chains, indirect `eval`, and dynamic `import()` can still access real globals, and `eval` cannot be masked in strict mode.
- `js` / `ts` / `node` code blocks have a 5-second timeout: loop bodies with curly braces will throw `Loop Timeout` after the timeout expires; pending `await`s are caught by an outer overall timeout. Single-statement loop bodies without curly braces won't inject checks, so infinite loops may still freeze Typora.
- TypeScript transpilation performs no type checking; type errors will not interrupt execution.
| `node` code blocks: Node.js built-in module names work, but relative paths are not resolved relative to the note's directory.
- `node` code blocks only run on Windows and Linux. Typora does not expose Node on macOS (`reqnode`), so it will error directly on that platform.
- Inline `<script>` tags in `html` code blocks do not execute under **Browser (Local)** mode (closed Shadow DOM); switch HTML execution mode to **iframe (Local)** for scripts to run.
- `rust` / `kotlin` / `hs` / `crystal` / `v` / `go` / `java` code blocks run on their respective online playgrounds, require internet, and are unavailable offline. On Windows / Linux requests are made via Node (no CORS issues); on macOS it falls back to `fetch`, which may be rejected if the playground doesn't allow cross-origin requests.
- On macOS, the settings for `kotlin` / `v` / `go` / `java` will be hidden and cannot be enabled: these playgrounds don't return CORS headers, so the render process `fetch` fallback will be rejected.
- ⏹ can only cancel the UI's running state, not interrupt code that is already executing.
- "Clear All Code Block Outputs" will clear the output cache for **every** code block, including those in notes that are currently closed.

[core]: https://github.com/typora-community-plugin/typora-community-plugin
