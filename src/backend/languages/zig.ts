import { makeOneCompilerBackend } from '../providers/onecompiler'

// https://onecompiler.com/zig — served by the JSON endpoint, see onecompiler.ts.
export default makeOneCompilerBackend({ language: 'zig', file: 'main.zig' })
