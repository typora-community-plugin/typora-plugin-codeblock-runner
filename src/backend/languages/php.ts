import { makeOneCompilerBackend } from '../providers/onecompiler'

// https://onecompiler.com/php — served by the JSON endpoint, see onecompiler.ts.
export default makeOneCompilerBackend({ language: 'php', file: 'main.php' })
