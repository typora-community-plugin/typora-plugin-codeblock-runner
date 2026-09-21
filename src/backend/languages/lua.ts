import { makeOneCompilerBackend } from '../providers/onecompiler'

// https://onecompiler.com/lua — served by the JSON endpoint, see onecompiler.ts.
export default makeOneCompilerBackend({ language: 'lua', file: 'main.lua' })
