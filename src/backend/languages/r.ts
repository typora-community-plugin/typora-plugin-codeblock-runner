import { makeOneCompilerBackend } from '../providers/onecompiler'

// https://onecompiler.com/r — served by the JSON endpoint, see onecompiler.ts.
export default makeOneCompilerBackend({ language: 'r', file: 'main.r' })
