import { makeOneCompilerBackend } from '../providers/onecompiler'

// https://onecompiler.com/julia — served by the JSON endpoint, see onecompiler.ts.
export default makeOneCompilerBackend({ language: 'julia', file: 'main.jl' })
