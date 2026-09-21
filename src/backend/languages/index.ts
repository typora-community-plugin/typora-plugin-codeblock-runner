import type { Backend } from '../index'
import type { LanguageId } from '../../settings'
import bashBackend from './bash'
import cBackend from './c'
import cppBackend from './cpp'
import crystalBackend from './crystal'
import csharpBackend from './csharp'
import dartBackend from './dart'
import goBackend from './go'
import haskellBackend from './haskell'
import htmlBackend from './html'
import javaBackend from './java'
import jsBackend from './js'
import juliaBackend from './julia'
import kotlinBackend from './kotlin'
import luaBackend from './lua'
import nodeBackend from './node'
import phpBackend from './php'
import powershellBackend from './powershell'
import pythonBackend from './python'
import python2Backend from './python2'
import rBackend from './r'
import rustBackend from './rust'
import swiftBackend from './swift'
import tsBackend from './ts'
import vBackend from './v'
import zigBackend from './zig'

export const languages: Record<string, Backend> = {
  js: jsBackend,
  javascript: jsBackend,
  node: nodeBackend,
  nodejs: nodeBackend,
  ts: tsBackend,
  typescript: tsBackend,
  html: htmlBackend,
  v: vBackend,
  vlang: vBackend,
  crystal: crystalBackend,
  cr: crystalBackend,
  hs: haskellBackend,
  haskell: haskellBackend,
  kotlin: kotlinBackend,
  kt: kotlinBackend,
  rust: rustBackend,
  rs: rustBackend,
  go: goBackend,
  golang: goBackend,
  java: javaBackend,
  bash: bashBackend,
  sh: bashBackend,
  c: cBackend,
  cpp: cppBackend,
  cc: cppBackend,
  csharp: csharpBackend,
  cs: csharpBackend,
  python: pythonBackend,
  py: pythonBackend,
  powershell: powershellBackend,
  ps1: powershellBackend,
  pwsh: powershellBackend,
  php: phpBackend,
  lua: luaBackend,
  python2: python2Backend,
  py2: python2Backend,
  r: rBackend,
  swift: swiftBackend,
  dart: dartBackend,
  julia: juliaBackend,
  jl: juliaBackend,
  zig: zigBackend,
}

/** Maps every code-fence alias to the language group it belongs to. */
export const languageIds: Record<string, LanguageId> = {
  js: 'js',
  javascript: 'js',
  node: 'node',
  nodejs: 'node',
  ts: 'ts',
  typescript: 'ts',
  html: 'html',
  v: 'v',
  vlang: 'v',
  crystal: 'crystal',
  cr: 'crystal',
  hs: 'haskell',
  haskell: 'haskell',
  kotlin: 'kotlin',
  kt: 'kotlin',
  rust: 'rust',
  rs: 'rust',
  go: 'go',
  golang: 'go',
  java: 'java',
  bash: 'bash',
  sh: 'bash',
  c: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  csharp: 'csharp',
  cs: 'csharp',
  python: 'python',
  py: 'python',
  powershell: 'powershell',
  ps1: 'powershell',
  pwsh: 'powershell',
  php: 'php',
  lua: 'lua',
  python2: 'python2',
  py2: 'python2',
  r: 'r',
  swift: 'swift',
  dart: 'dart',
  julia: 'julia',
  jl: 'julia',
  zig: 'zig',
}
