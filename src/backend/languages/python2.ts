import { makeOneCompilerBackend } from '../providers/onecompiler'

// https://onecompiler.com/python2 — served by the JSON endpoint, see onecompiler.ts.
export default makeOneCompilerBackend({ language: 'python2', file: 'main.py' })
